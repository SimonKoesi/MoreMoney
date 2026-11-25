import SwiftUI
import UIKit
import UserNotifications

final class PushSessionDelegate: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil)
    }
}

@MainActor final class RemotePush: ObservableObject {
    static let shared = RemotePush()
    private static let credential = "push-relay"
    struct Configuration: Codable, Equatable {
        let endpoint: URL
        let key: String
    }
    struct Rule: Codable, Equatable {
        let id: UUID
        let symbol: String
        let exchange: String
        let currency: String
        let target: String
        let below: Bool
        let since: Int64
    }
    private struct Registration: Codable {
        let token: String
        let rules: [Rule]
    }
    @Published private(set) var status = "Nicht konfiguriert"
    @Published private(set) var busy = false
    private(set) var configuration: Configuration?
    private var deviceToken: String?
    private var lastPayload: Data?
    private var sentRules: [UUID: Rule] = [:]
    private var confirmedAt = Date.distantPast
    private var pending = false
    private weak var store: MoneyStore?
    private let session = URLSession(configuration: .ephemeral, delegate: PushSessionDelegate(), delegateQueue: nil)

    private init() {
        let stored = QuoteKey.read(account: Self.credential)
        configuration = try? JSONDecoder().decode(Configuration.self, from: Data(stored.utf8))
        if configuration != nil { status = "Übertragung ausstehend" }
    }

    static func endpoint(_ value: String) -> URL? {
        guard let parts = URLComponents(string: value.trimmingCharacters(in: .whitespacesAndNewlines)),
              parts.scheme?.lowercased() == "https", let host = parts.host, !host.isEmpty,
              parts.user == nil, parts.password == nil, parts.query == nil, parts.fragment == nil,
              parts.path.isEmpty || parts.path == "/" else { return nil }
        return parts.url?.appending(path: "v1/device")
    }

    private func rule(_ stock: MoneyRecord) -> Rule {
        Rule(id: stock.id, symbol: stock.symbol, exchange: stock.exchange ?? "", currency: stock.currency, target: String(stock.amount), below: stock.alertBelow == true, since: Int64(ceil(stock.alertConfiguredAt?.timeIntervalSince1970 ?? 0)))
    }

    func attach(_ store: MoneyStore) async {
        self.store = store
        guard configuration != nil else { return }
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        guard [.authorized, .provisional, .ephemeral].contains(settings.authorizationStatus) else {
            status = "Systemmitteilungen deaktiviert"
            return
        }
        UIApplication.shared.registerForRemoteNotifications()
        await sync()
    }

    func connect(endpointText: String, key: String, store: MoneyStore) async {
        guard !busy else { return }
        let secret = key.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let endpoint = Self.endpoint(endpointText), secret.range(of: "^[A-Za-z0-9_-]{32,128}$", options: .regularExpression) != nil else {
            status = "HTTPS-Adresse und Kopplungsschlüssel prüfen."
            return
        }
        let candidate = Configuration(endpoint: endpoint, key: secret)
        if configuration != nil && configuration != candidate {
            status = "Vorherige Verbindung zuerst trennen."
            return
        }
        busy = true
        defer { busy = false }
        do {
            guard try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert,.sound]) else {
                status = "Mitteilungen in den iPhone-Einstellungen erlauben."
                return
            }
            try await send("GET", configuration: candidate, body: nil)
            let raw = try JSONEncoder().encode(candidate)
            try QuoteKey.save(String(decoding: raw, as: UTF8.self), account: Self.credential)
            configuration = candidate
            self.store = store
            lastPayload = nil
            status = "Warte auf Gerätebestätigung …"
            UIApplication.shared.registerForRemoteNotifications()
        } catch { status = "Push-Dienst derzeit nicht erreichbar. Eingaben prüfen." }
        scheduleSyncIfNeeded()
    }

    func registered(_ token: Data) {
        deviceToken = token.map { String(format: "%02x", $0) }.joined()
        Task { await sync() }
    }

    func registrationFailed() {
        if configuration != nil { status = "Apple-Push-Registrierung fehlgeschlagen. Signierung prüfen." }
    }

    func handlesMarketAlert(_ stock: MoneyRecord) -> Bool {
        Date().timeIntervalSince(confirmedAt) < 600 && sentRules[stock.id] == rule(stock)
    }

    func sync() async {
        if busy { pending = true; return }
        guard let config = configuration, let store, let token = deviceToken else { return }
        let rules = store.items(.stock).filter { $0.alertsEnabled == true && !$0.symbol.isEmpty && $0.amount > 0 }.map(rule).sorted { $0.id.uuidString < $1.id.uuidString }
        guard rules.count <= 30 else { status = "Für Push höchstens 30 aktive Kursalarme wählen."; return }
        let encoder = JSONEncoder()
        encoder.outputFormatting = .sortedKeys
        guard let payload = try? encoder.encode(Registration(token: token, rules: rules)),
              payload != lastPayload || Date().timeIntervalSince(confirmedAt) >= 300 else { return }
        busy = true
        defer { busy = false; scheduleSyncIfNeeded() }
        do {
            try await send("PUT", configuration: config, body: payload)
            lastPayload = payload
            sentRules = Dictionary(uniqueKeysWithValues: rules.map { ($0.id,$0) })
            confirmedAt = Date()
            status = rules.isEmpty ? "Verbunden · keine aktiven Kursalarme" : "Verbunden · \(rules.count) aktive Kursalarme"
        } catch { status = "Synchronisierung fehlgeschlagen. Beim Öffnen wird erneut versucht." }
    }

    func disconnect() async {
        guard !busy, let config = configuration else { return }
        busy = true
        defer { busy = false; scheduleSyncIfNeeded() }
        do {
            try await send("DELETE", configuration: config, body: nil)
            try QuoteKey.save("", account: Self.credential)
            configuration = nil
            lastPayload = nil
            sentRules.removeAll()
            status = "Nicht konfiguriert"
            UIApplication.shared.unregisterForRemoteNotifications()
        } catch { status = "Verbindung konnte nicht getrennt werden. Erneut versuchen." }
    }

    private func scheduleSyncIfNeeded() {
        guard pending else { return }
        pending = false
        Task { await sync() }
    }

    private func send(_ method: String, configuration: Configuration, body: Data?) async throws {
        var request = URLRequest(url: configuration.endpoint)
        request.httpMethod = method
        request.httpBody = body
        request.timeoutInterval = 15
        request.setValue("Bearer \(configuration.key)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let (data, response) = try await session.data(for: request)
        struct Reply: Decodable { let ok: Bool }
        guard (response as? HTTPURLResponse)?.statusCode == 200, data.count <= 1024,
              try JSONDecoder().decode(Reply.self, from: data).ok else { throw URLError(.badServerResponse) }
    }
}

final class MoreMoneyPushDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Task { @MainActor in RemotePush.shared.registered(deviceToken) }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        Task { @MainActor in RemotePush.shared.registrationFailed() }
    }
}

struct PushSettings: View {
    @EnvironmentObject private var store: MoneyStore
    @ObservedObject private var push = RemotePush.shared
    @State private var address = ""
    @State private var key = ""

    var body: some View {
        Form {
            Section { Text(push.status) }
            if push.configuration == nil {
                Section {
                    TextField("HTTPS-Adresse", text: $address).keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
                    SecureField("Kopplungsschlüssel", text: $key).textInputAutocapitalization(.never).autocorrectionDisabled()
                    Button("Verbinden") {
                        Task { await push.connect(endpointText: address, key: key, store: store); if push.configuration != nil { key = "" } }
                    }.disabled(push.busy || address.isEmpty || key.isEmpty)
                } footer: {
                    Text("Der eigene Push-Dienst erhält den Geräte-Token und aktive Kursalarme.")
                }
            } else {
                Button("Erneut synchronisieren") { Task { await push.attach(store) } }.disabled(push.busy)
                Button("Verbindung trennen", role: .destructive) { Task { await push.disconnect() } }.disabled(push.busy)
            }
        }.navigationTitle("Kursalarme per Push").navigationBarTitleDisplayMode(.inline)
    }
}
