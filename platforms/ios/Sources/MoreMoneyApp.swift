import SwiftUI

@main struct MoreMoneyApp: App {
    @StateObject private var store = MoneyStore()
    var body: some Scene {
        WindowGroup {
            MainView().environmentObject(store)
                .tint(Color(red: 0.17, green: 0.64, blue: 0.52))
                .preferredColorScheme(.dark)
                .alert("Änderung nicht möglich", isPresented: Binding(get: { store.error != nil }, set: { if !$0 { store.error = nil } })) {
                    Button("OK") { store.error = nil }
                } message: { Text(store.error ?? "") }
        }
    }
}
