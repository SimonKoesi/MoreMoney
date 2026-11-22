import Foundation
import UserNotifications
import Security
import BackgroundTasks

// Optional Codable fields preserve existing local files and exported backups.
enum AlertRule {
    static func inside(price: Int64, target: Int64, below: Bool) -> Bool {
        price > 0 && target > 0 && (below ? price <= target : price >= target)
    }
    static func shouldNotify(_ stock: MoneyRecord, quote: MoneyRecord) -> Bool {
        stock.alertsEnabled == true && stock.alertInside != true &&
        quote.date >= (stock.alertConfiguredAt ?? .distantPast) &&
        inside(price: quote.amount, target: stock.amount, below: stock.alertBelow == true)
    }
}

enum QuoteFailure: LocalizedError {
    case unavailable, currency, key, permission
    var errorDescription: String? {
        switch self {
        case .unavailable: return "Kursabruf fehlgeschlagen. Symbol, Zugang und Anbieterlimit prüfen."
        case .currency: return "Die Kurswährung passt nicht zur Aktie."
        case .key: return "Schlüssel konnte nicht sicher gespeichert werden."
        case .permission: return "Mitteilungen in den iPhone-Einstellungen für MoreMoney erlauben."
        }
    }
}

enum QuoteKey {
    private static var query: [String: Any] { [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "de.moremoney.quotes", kSecAttrAccount as String: "twelvedata"] }
    static func read() -> String {
        var request = query
        request[kSecReturnData as String] = true
        var result: CFTypeRef?
        guard SecItemCopyMatching(request as CFDictionary, &result) == errSecSuccess, let data = result as? Data else { return "" }
        return String(data: data, encoding: .utf8) ?? ""
    }
    static func save(_ value: String) throws {
        let cleaned = value.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleaned.isEmpty {
            let status = SecItemDelete(query as CFDictionary)
            guard status == errSecSuccess || status == errSecItemNotFound else { throw QuoteFailure.key }
            return
        }
        let attributes: [String: Any] = [kSecValueData as String: Data(cleaned.utf8), kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]
        let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            guard SecItemAdd(query.merging(attributes) { _, new in new } as CFDictionary, nil) == errSecSuccess else { throw QuoteFailure.key }
        } else if status != errSecSuccess { throw QuoteFailure.key }
    }
}

enum QuoteClient {
    struct Reply: Decodable { var close: String?; var currency: String?; var timestamp: Double?; var symbol: String?; var exchange: String? }
    static func parse(_ data: Data, stock: MoneyRecord, now: Date = Date()) throws -> MoneyRecord {
        let reply = try JSONDecoder().decode(Reply.self, from: data)
        guard reply.currency == stock.currency else { throw QuoteFailure.currency }
        guard reply.symbol?.uppercased() == stock.symbol.uppercased(), let price = reply.close,
              let timestamp = reply.timestamp, timestamp.isFinite,
              timestamp > 0, timestamp <= now.timeIntervalSince1970 + 60 else { throw QuoteFailure.unavailable }
        if let exchange = stock.exchange, !exchange.isEmpty, reply.exchange?.uppercased() != exchange.uppercased() { throw QuoteFailure.unavailable }
        let value = try Money.parse(price, decimals: 6)
        guard value > 0 else { throw QuoteFailure.unavailable }
        return MoneyRecord(kind: .quote, name: stock.name, amount: value, parentID: stock.id, currency: stock.currency, date: Date(timeIntervalSince1970: timestamp), source: "Twelve Data")
    }
    struct Suggestion: Decodable, Identifiable {
        let symbol: String
        let instrument_name: String
        let exchange: String
        let currency: String
        let instrument_type: String
        var id: String { symbol + ":" + exchange + ":" + currency }
    }
    static func search(_ query: String) async throws -> [Suggestion] {
        struct SearchReply: Decodable { let data: [Suggestion]? }
        guard !QuoteKey.read().isEmpty else { return [] }
        var url = URLComponents(string: "https://api.twelvedata.com/symbol_search")!
        url.queryItems = [URLQueryItem(name: "symbol", value: query), URLQueryItem(name: "outputsize", value: "12"), URLQueryItem(name: "apikey", value: QuoteKey.read())]
        var request = URLRequest(url: url.url!); request.timeoutInterval = 12
        let (data, response) = try await URLSession.shared.data(for: request)
        guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw QuoteFailure.unavailable }
        let reply = try JSONDecoder().decode(SearchReply.self, from: data)
        guard let values = reply.data else { throw QuoteFailure.unavailable }
        var seen = Set<String>()
        return values.filter { ["Common Stock", "ETF", "REIT", "Depositary Receipt"].contains($0.instrument_type) && ["EUR", "USD", "GBP", "CHF"].contains($0.currency) && seen.insert($0.id).inserted }
    }
    static func fetch(_ stock: MoneyRecord) async throws -> MoneyRecord {
        let key = QuoteKey.read()
        guard !key.isEmpty else { throw QuoteFailure.unavailable }
        var url = URLComponents(string: "https://api.twelvedata.com/quote")!
        url.queryItems = [URLQueryItem(name: "symbol", value: stock.symbol), URLQueryItem(name: "apikey", value: key)]
        var request = URLRequest(url: url.url!)
        if let exchange = stock.exchange, !exchange.isEmpty { url.queryItems?.append(URLQueryItem(name: "exchange", value: exchange)); request.url = url.url }
        request.timeoutInterval = 20
        request.cachePolicy = .reloadIgnoringLocalCacheData
        let (data, response) = try await URLSession.shared.data(for: request)
        guard (response as? HTTPURLResponse)?.statusCode == 200, data.count < 100_000 else { throw QuoteFailure.unavailable }
        return try parse(data, stock: stock)
    }
}

@MainActor final class StockAlerts: NSObject, UNUserNotificationCenterDelegate {
    static let shared = StockAlerts()
    static let taskID = "de.moremoney.quote-refresh"
    private var checking = false
    private var fetching = Set<UUID>()
    private var lastAutomatic: [UUID: Date] = [:]
    func configure() { UNUserNotificationCenter.current().delegate = self }
    func permission() async throws {
        guard try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) else { throw QuoteFailure.permission }
    }
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions { [.banner, .sound, .list] }
    func evaluate(_ store: MoneyStore) async {
        guard !checking else { return }
        checking = true
        defer { checking = false }
        for stock in store.items(.stock) where stock.alertsEnabled == true {
            guard let quote = store.items(.quote, parent: stock.id).max(by: { $0.date < $1.date }),
                  quote.date >= (stock.alertConfiguredAt ?? .distantPast) else { continue }
            let inside = AlertRule.inside(price: quote.amount, target: stock.amount, below: stock.alertBelow == true)
            do {
                if AlertRule.shouldNotify(stock, quote: quote) {
                    let settings = await UNUserNotificationCenter.current().notificationSettings()
                    guard [.authorized, .provisional, .ephemeral].contains(settings.authorizationStatus) else { continue }
                    let content = UNMutableNotificationContent()
                    content.title = stock.name + " · Kursalarm"
                    content.body = Money.display(quote.amount, currency: stock.currency, decimals: 6) + " · " + (quote.source ?? "Manuell") + " · " + quote.date.formatted()
                    content.sound = .default
                    // A stable quote identifier also prevents duplicate pending requests on retry.
                    let request = UNNotificationRequest(identifier: "stock-" + stock.id.uuidString + "-" + quote.id.uuidString, content: content, trigger: nil)
                    try await UNUserNotificationCenter.current().add(request)
                }
                if stock.alertInside != inside { try store.markAlert(stock.id, inside: inside) }
            } catch { store.error = "Kursalarm konnte nicht gespeichert oder zugestellt werden. Erneut versuchen." }
        }
    }
    func refresh(_ stock: MoneyRecord, store: MoneyStore) async throws {
        guard !fetching.contains(stock.id) else { return }
        fetching.insert(stock.id)
        defer { fetching.remove(stock.id) }
        let quote = try await QuoteClient.fetch(stock)
        try Task.checkCancellation()
        guard store.items(.stock).contains(where: { $0.id == stock.id }) else { return }
        let latest = store.items(.quote, parent: stock.id).max(by: { $0.date < $1.date })
        if latest == nil || quote.date > latest!.date { try store.save(quote) }
        await evaluate(store)
    }
    func refreshEnabled(_ store: MoneyStore, onlyAlerts: Bool = false) async {
        guard !QuoteKey.read().isEmpty else { return }
        for stock in store.items(.stock) where !onlyAlerts || stock.alertsEnabled == true {
            guard !Task.isCancelled else { break }
            if Date().timeIntervalSince(lastAutomatic[stock.id] ?? .distantPast) < 300 { continue }
            lastAutomatic[stock.id] = Date()
            do {
                try await refresh(stock, store: store)
                try await Task.sleep(for: .seconds(10))
            } catch { if !Task.isCancelled { store.error = QuoteFailure.unavailable.localizedDescription }; break }
        }
    }
    func schedule(_ store: MoneyStore) {
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: Self.taskID)
        guard !QuoteKey.read().isEmpty, store.items(.stock).contains(where: { $0.alertsEnabled == true }) else { return }
        let request = BGAppRefreshTaskRequest(identifier: Self.taskID)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 30 * 60)
        do { try BGTaskScheduler.shared.submit(request) }
        catch { /* Foreground refresh remains available when iOS refuses scheduling. */ }
    }
}
