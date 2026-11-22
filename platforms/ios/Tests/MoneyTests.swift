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
}
