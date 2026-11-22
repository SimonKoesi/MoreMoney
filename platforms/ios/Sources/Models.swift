import Foundation
import Combine

enum RecordKind: String, Codable, CaseIterable, Hashable {
    case account, transaction, transfer, budget, item, project, task, goal, contribution, stock, quote, recurring
}

struct MoneyRecord: Codable, Identifiable, Equatable {
    var id = UUID()
    var kind: RecordKind
    var name: String
    var amount: Int64 = 0
    var parentID: UUID? = nil
    var accountID: UUID? = nil
    var quantity: Int64 = 1
    var done = false
    var favorite = false
    var note = ""
    var symbol = ""
    var currency = "EUR"
    var date = Date()
    var alertsEnabled: Bool? = nil
    var alertBelow: Bool? = nil
    var alertInside: Bool? = nil
    var alertConfiguredAt: Date? = nil
    var source: String? = nil
}

enum MoneyError: LocalizedError {
    case invalidAmount, missingName, missingAccount, linked, corruptStore, overflow
    var errorDescription: String? {
        switch self {
        case .invalidAmount: return "Gültigen Betrag ohne Tausendertrennzeichen eingeben."
        case .missingName: return "Bitte einen Namen eingeben."
        case .missingAccount: return "Bitte ein vorhandenes Konto wählen."
        case .linked: return "Der Eintrag wird noch verwendet."
        case .corruptStore: return "Die Daten konnten nicht gelesen werden. Die vorhandene Datei bleibt erhalten."
        case .overflow: return "Der Betrag ist zu groß."
        }
    }
}

enum Money {
    static func parse(_ text: String, decimals: Int = 2) throws -> Int64 {
        let cleaned = text.trimmingCharacters(in: .whitespacesAndNewlines)
        let pattern = "^-?[0-9]{1,9}([.,][0-9]{1,\(decimals)})?$"
        guard cleaned.range(of: pattern, options: .regularExpression) != nil else { throw MoneyError.invalidAmount }
        let negative = cleaned.hasPrefix("-")
        let parts = cleaned.replacingOccurrences(of: "-", with: "").split(whereSeparator: { $0 == "," || $0 == "." })
        let factor = Int64(pow(10.0, Double(decimals)))
        guard let whole = Int64(parts[0]) else { throw MoneyError.invalidAmount }
        let fractional = parts.count > 1 ? String(parts[1]) : ""
        let fraction = Int64(fractional + String(repeating: "0", count: decimals - fractional.count)) ?? 0
        return (whole * factor + fraction) * (negative ? -1 : 1)
    }
    static func display(_ value: Int64, currency: String = "EUR", decimals: Int = 2) -> String {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "de_DE")
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = decimals
        let divisor = NSDecimalNumber(mantissa: 1, exponent: Int16(decimals), isNegative: false)
        return formatter.string(from: NSDecimalNumber(value: value).dividing(by: divisor)) ?? "—"
    }
}

@MainActor final class MoneyStore: ObservableObject {
    @Published private(set) var records: [MoneyRecord] = []
    @Published var error: String? = nil
    private let url: URL
    private var readable = true

    init(url: URL? = nil) {
        let root = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("MoreMoney", isDirectory: true)
        let testing = ProcessInfo.processInfo.environment["MOREMONEY_UI_TEST_STORE"] == "1"
        self.url = url ?? root.appendingPathComponent(testing ? "uitest.json" : "store.json")
        if testing && ProcessInfo.processInfo.environment["MOREMONEY_RESET_TEST_DATA"] == "1" { try? FileManager.default.removeItem(at: self.url) }
        do {
            if FileManager.default.fileExists(atPath: self.url.path) {
                records = try JSONDecoder().decode([MoneyRecord].self, from: Data(contentsOf: self.url))
            }
        } catch { readable = false; self.error = MoneyError.corruptStore.localizedDescription }
    }
    func items(_ kind: RecordKind, parent: UUID? = nil) -> [MoneyRecord] {
        records.filter { $0.kind == kind && (parent == nil || $0.parentID == parent) }
    }
    func save(_ record: MoneyRecord) throws {
        guard readable else { throw MoneyError.corruptStore }
        guard !record.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw MoneyError.missingName }
        if [.transaction, .transfer].contains(record.kind) {
            guard let id = record.accountID, items(.account).contains(where: { $0.id == id }) else { throw MoneyError.missingAccount }
            guard record.amount != 0 else { throw MoneyError.invalidAmount }
        }
        if record.kind == .quote && record.amount <= 0 { throw MoneyError.invalidAmount }
        let requiredParent: RecordKind? = record.kind == .item ? .budget : record.kind == .task ? .project : record.kind == .contribution ? .goal : record.kind == .quote ? .stock : nil
        if let requiredParent {
            guard let parent = record.parentID, items(requiredParent).contains(where: { $0.id == parent }) else { throw MoneyError.linked }
        }
        guard record.quantity > 0 && record.quantity <= 1000 else { throw MoneyError.invalidAmount }
        guard !record.amount.multipliedReportingOverflow(by: record.quantity).overflow else { throw MoneyError.overflow }
        var next = records
        if let index = next.firstIndex(where: { $0.id == record.id }) { next[index] = record } else { next.append(record) }
        try persist(next)
    }
    func toggle(_ record: MoneyRecord, favorite: Bool = false) {
        var next = record
        if favorite { next.favorite.toggle() } else { next.done.toggle() }
        do { try save(next) } catch { self.error = error.localizedDescription }
    }
    func remove(_ record: MoneyRecord) throws {
        if records.contains(where: { $0.accountID == record.id || $0.parentID == record.id }) { throw MoneyError.linked }
        try persist(records.filter { $0.id != record.id })
    }
    func transfer(from: UUID, to: UUID, amount: Int64) throws {
        guard from != to, amount > 0, items(.account).contains(where: { $0.id == from }), items(.account).contains(where: { $0.id == to }) else { throw MoneyError.missingAccount }
        let group = UUID()
        let debit = MoneyRecord(kind: .transfer, name: "Umbuchung", amount: -amount, parentID: group, accountID: from)
        let credit = MoneyRecord(kind: .transfer, name: "Umbuchung", amount: amount, parentID: group, accountID: to)
        try persist(records + [debit, credit])
    }
    private func persist(_ next: [MoneyRecord]) throws {
        guard readable else { throw MoneyError.corruptStore }
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        let data = try JSONEncoder().encode(next)
        try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        records = next
    }
    func balance(_ account: MoneyRecord) -> Int64 {
        account.amount + records.filter { [.transaction, .transfer].contains($0.kind) && $0.accountID == account.id }.reduce(0) { $0 + $1.amount }
    }
    var totalBalance: Int64 { items(.account).reduce(0) { $0 + balance($1) } }
    func budgetTotals(_ budget: MoneyRecord) -> (paid: Int64, open: Int64, remaining: Int64) {
        let positions = items(.item, parent: budget.id)
        let ids = Set(positions.map(\.id))
        let payments = items(.transaction).filter { $0.amount < 0 && ($0.parentID == budget.id || ($0.parentID.map { ids.contains($0) } ?? false)) }
        let paid = -payments.reduce(0) { $0 + $1.amount }
        let open = positions.reduce(Int64(0)) { result, item in
            let itemPaid = -payments.filter { $0.parentID == item.id }.reduce(0) { $0 + $1.amount }
            return result + max(0, item.amount * item.quantity - itemPaid)
        }
        return (paid, open, budget.amount - paid - open)
    }
    func setAlert(_ id: UUID, target: Int64, below: Bool, enabled: Bool) throws {
        guard var stock = records.first(where: { $0.id == id && $0.kind == .stock }), target > 0 || !enabled else { throw MoneyError.invalidAmount }
        stock.amount = target
        stock.alertsEnabled = enabled
        stock.alertBelow = below
        stock.alertInside = false
        stock.alertConfiguredAt = Date()
        try save(stock)
    }
    func markAlert(_ id: UUID, inside: Bool) throws {
        guard var stock = records.first(where: { $0.id == id && $0.kind == .stock }) else { return }
        stock.alertInside = inside
        try save(stock)
    }
    func backup() throws -> Data { try JSONEncoder().encode(records) }
}
