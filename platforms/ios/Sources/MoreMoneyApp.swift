import SwiftUI

@main struct MoreMoneyApp: App {
    @StateObject private var store = MoneyStore()
    @Environment(\.scenePhase) private var scenePhase
    var body: some Scene {
        WindowGroup {
            MainView().environmentObject(store)
                .task { StockAlerts.shared.configure(); await StockAlerts.shared.evaluate(store) }
                .onChange(of: store.records) { _, _ in Task { await StockAlerts.shared.evaluate(store) } }
                .onChange(of: scenePhase) { _, phase in
                    if phase == .background { StockAlerts.shared.schedule(store) }
                    if phase == .active { Task { await StockAlerts.shared.refreshEnabled(store) } }
                }.tint(Color(red: 0.17, green: 0.64, blue: 0.52))
                .alert("Änderung nicht möglich", isPresented: Binding(get: { store.error != nil }, set: { if !$0 { store.error = nil } })) {
                    Button("OK") { store.error = nil }
                } message: { Text(store.error ?? "") }
        }.backgroundTask(.appRefresh(StockAlerts.taskID)) {
            await StockAlerts.shared.refreshEnabled(store)
            await StockAlerts.shared.schedule(store)
        }
    }
}
