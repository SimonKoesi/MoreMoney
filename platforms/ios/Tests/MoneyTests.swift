import XCTest
@testable import MoreMoney

final class MoneyTests: XCTestCase {
    func testExactMoney() throws {
        XCTAssertEqual(try Money.parse("0,10") + Money.parse("0,20"), 30)
        XCTAssertEqual(try Money.parse("0,000001", decimals: 6), 1)
        XCTAssertThrowsError(try Money.parse("1.000,50"))
        XCTAssertThrowsError(try Money.parse("1e4"))
    }
    @MainActor func testPersistenceAndPlanningDoesNotPostPayments() async throws {
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let url = folder.appendingPathComponent("store.json")
        let store = MoneyStore(url: url)
        XCTAssertTrue(store.records.isEmpty)
        let account = MoneyRecord(kind: .account, name: "Eigenes Konto", amount: 200000)
        try store.save(account)
        let budget = MoneyRecord(kind: .budget, name: "Eigener Plan", amount: 120000)
        try store.save(budget)
        let item = MoneyRecord(kind: .item, name: "Eigene Position", amount: 100000, parentID: budget.id)
        try store.save(item)
        store.toggle(item)
        XCTAssertTrue(store.items(.transaction).isEmpty)
        XCTAssertEqual(store.totalBalance, 200000)
        try store.save(MoneyRecord(kind: .transaction, name: "Anzahlung", amount: -20000, parentID: item.id, accountID: account.id))
        XCTAssertEqual(store.budgetTotals(budget).paid, 20000)
        XCTAssertEqual(store.budgetTotals(budget).open, 80000)
        XCTAssertEqual(store.budgetTotals(budget).remaining, 20000)
        let restored = MoneyStore(url: url)
        XCTAssertEqual(restored.totalBalance, 180000)
        XCTAssertEqual(restored.items(.budget).count, 1)
        try FileManager.default.removeItem(at: folder)
    }
    @MainActor func testTransferIsAtomicAndNeutral() async throws {
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let store = MoneyStore(url: folder.appendingPathComponent("store.json"))
        let a = MoneyRecord(kind: .account, name: "A", amount: 100000)
        let b = MoneyRecord(kind: .account, name: "B")
        try store.save(a); try store.save(b)
        try store.transfer(from: a.id, to: b.id, amount: 25000)
        XCTAssertEqual(store.items(.transfer).count, 2)
        XCTAssertEqual(store.totalBalance, 100000)
        XCTAssertTrue(store.items(.transaction).isEmpty)
        XCTAssertThrowsError(try store.remove(a))
        try FileManager.default.removeItem(at: folder)
    }
    @MainActor func testCorruptStoreIsNeverOverwritten() async throws {
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let url = folder.appendingPathComponent("store.json")
        let original = Data("beschädigt".utf8)
        try original.write(to: url)
        let store = MoneyStore(url: url)
        XCTAssertNotNil(store.error)
        XCTAssertThrowsError(try store.save(MoneyRecord(kind: .account, name: "A")))
        XCTAssertEqual(try Data(contentsOf: url), original)
        try FileManager.default.removeItem(at: folder)
    }
    func testThresholdsAndDuplicateSuppression() throws {
        var stock = MoneyRecord(kind: .stock, name: "Eigene Aktie", amount: 100_000_000, alertsEnabled: true, alertBelow: false, alertConfiguredAt: Date(timeIntervalSince1970: 10))
        var quote = MoneyRecord(kind: .quote, name: "Kurs", amount: 100_000_000, date: Date(timeIntervalSince1970: 20))
        XCTAssertTrue(AlertRule.shouldNotify(stock, quote: quote))
        stock.alertInside = true
        XCTAssertFalse(AlertRule.shouldNotify(stock, quote: quote))
        stock.alertInside = false
        quote.amount -= 1
        XCTAssertFalse(AlertRule.shouldNotify(stock, quote: quote))
        stock.alertBelow = true
        XCTAssertTrue(AlertRule.shouldNotify(stock, quote: quote))
        quote.date = Date(timeIntervalSince1970: 5)
        XCTAssertFalse(AlertRule.shouldNotify(stock, quote: quote))
        stock.alertsEnabled = false
        XCTAssertFalse(AlertRule.shouldNotify(stock, quote: quote))
    }
    func testQuoteValidationAndOldBackupCompatibility() throws {
        let stock = MoneyRecord(kind: .stock, name: "Eigene Aktie", symbol: "OWN", currency: "USD")
        let valid = Data(#"{"symbol":"OWN","currency":"USD","close":"12.000001","timestamp":100}"#.utf8)
        let quote = try QuoteClient.parse(valid, stock: stock)
        XCTAssertEqual(quote.amount, 12_000_001)
        XCTAssertEqual(quote.source, "Twelve Data")
        XCTAssertThrowsError(try QuoteClient.parse(Data(#"{"symbol":"OWN","currency":"EUR","close":"12","timestamp":100}"#.utf8), stock: stock))
        XCTAssertThrowsError(try QuoteClient.parse(Data(#"{"status":"error","message":"limit"}"#.utf8), stock: stock))
        var dictionary = try XCTUnwrap(JSONSerialization.jsonObject(with: JSONEncoder().encode(stock)) as? [String: Any])
        for key in ["alertsEnabled", "alertBelow", "alertInside", "alertConfiguredAt", "source"] { dictionary.removeValue(forKey: key) }
        let restored = try JSONDecoder().decode(MoneyRecord.self, from: JSONSerialization.data(withJSONObject: dictionary))
        XCTAssertNil(restored.alertsEnabled)
        XCTAssertEqual(restored.id, stock.id)
    }
    @MainActor func testAlertPersistenceValidationAndRearming() async throws {
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: folder) }
        let url = folder.appendingPathComponent("store.json")
        let store = MoneyStore(url: url)
        let stock = MoneyRecord(kind: .stock, name: "Eigene Aktie", symbol: "OWN")
        try store.save(stock)
        XCTAssertThrowsError(try store.setAlert(stock.id, target: 0, below: false, enabled: true))
        XCTAssertNil(store.items(.stock).first?.alertsEnabled)
        try store.setAlert(stock.id, target: 12_345_678, below: true, enabled: true)
        try store.markAlert(stock.id, inside: true)
        let restored = MoneyStore(url: url)
        XCTAssertEqual(restored.items(.stock).first?.amount, 12_345_678)
        XCTAssertEqual(restored.items(.stock).first?.alertBelow, true)
        XCTAssertEqual(restored.items(.stock).first?.alertInside, true)
        try restored.markAlert(stock.id, inside: false)
        let quote = MoneyRecord(kind: .quote, name: "Kurs", amount: 12_345_678, date: Date().addingTimeInterval(1))
        XCTAssertTrue(AlertRule.shouldNotify(try XCTUnwrap(restored.items(.stock).first), quote: quote))
        try restored.setAlert(stock.id, target: 12_345_678, below: true, enabled: false)
        XCTAssertFalse(AlertRule.shouldNotify(try XCTUnwrap(restored.items(.stock).first), quote: quote))
    }
}
