import SwiftUI

struct InstallmentDue: Identifiable {
    let index: Int
    let amount: Int64
    let date: Date
    var id: Int { index }
}
enum Installments {
    static func schedule(_ record: MoneyRecord) throws -> [InstallmentDue] {
        let down = record.downPaymentCents ?? 0
        let rate = record.rateCents ?? 0
        guard record.amount > 0, record.amount <= 2_000_000_000, down >= 0, down < record.amount, rate > 0 else { throw MoneyError.invalidAmount }
        let remaining = record.amount - down
        let count = (remaining + rate - 1) / rate
        guard count <= 600 else { throw MoneyError.invalidAmount }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        let origin = calendar.dateComponents([.year, .month, .day], from: record.date)
        let firstMonth = calendar.date(from: DateComponents(year: origin.year, month: origin.month, day: 1))!
        var result: [InstallmentDue] = down > 0 ? [InstallmentDue(index: 0, amount: down, date: record.date)] : []
        for index in 0..<Int(count) {
            let month = calendar.date(byAdding: .month, value: index, to: firstMonth)!
            let last = calendar.range(of: .day, in: .month, for: month)!.count
            let date = calendar.date(byAdding: .day, value: min(origin.day!, last) - 1, to: month)!
            result.append(InstallmentDue(index: index + 1, amount: min(rate, remaining - Int64(index) * rate), date: date))
        }
        return result
    }
}

struct InstallmentList: View {
    @EnvironmentObject private var store: MoneyStore
    @State private var add = false
    var body: some View {
        List {
            ForEach(store.items(.installment)) { record in
                NavigationLink { InstallmentDetail(purchase: record) } label: {
                    let paid = -store.items(.transaction).filter { $0.parentID == record.id }.reduce(Int64(0)) { $0 + $1.amount }
                    AmountRow(label: record.name + " · Restbetrag", amount: record.amount - paid)
                }
            }
            if store.items(.installment).isEmpty { Text("Noch keine Ratenkäufe").foregroundStyle(.secondary) }
        }.navigationTitle("Ratenkäufe").navigationBarTitleDisplayMode(.inline)
            .toolbar { Button { add = true } label: { Image(systemName: "plus") }.accessibilityLabel("Ratenkauf hinzufügen") }
            .sheet(isPresented: $add) { InstallmentEditor() }
    }
}
struct InstallmentEditor: View {
    @EnvironmentObject private var store: MoneyStore
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var total = ""
    @State private var down = "0"
    @State private var rate = ""
    @State private var date = Date()
    @State private var error = ""
    @State private var saving = false
    var body: some View {
        NavigationStack {
            Form {
                TextField("Name", text: $name, axis: .vertical).accessibilityIdentifier("installment-name")
                TextField("Gesamtpreis inkl. Zinsen in EUR", text: $total).keyboardType(.decimalPad).accessibilityIdentifier("installment-total")
                TextField("Anzahlung in EUR", text: $down).keyboardType(.decimalPad)
                TextField("Monatsrate in EUR", text: $rate).keyboardType(.decimalPad).accessibilityIdentifier("installment-rate")
                DatePicker("Erste Fälligkeit", selection: $date, displayedComponents: .date)
                Text("Anzahlung am ersten Termin. Zahlungen einzeln bestätigen.").font(.footnote)
                if !error.isEmpty { Text(error).foregroundStyle(.red) }
            }.navigationTitle("Ratenkauf").navigationBarTitleDisplayMode(.inline).toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Speichern") {
                        guard !saving else { return }; saving = true
                        do {
                            let record = MoneyRecord(kind: .installment, name: name, amount: try Money.parse(total), date: date, rateCents: try Money.parse(rate), downPaymentCents: try Money.parse(down))
                            try store.save(record); dismiss()
                        } catch { self.error = error.localizedDescription }
                        saving = false
                    }.disabled(saving)
                }
            }
        }
    }
}
struct InstallmentDetail: View {
    @EnvironmentObject private var store: MoneyStore
    let purchase: MoneyRecord
    @State private var paying: InstallmentDue? = nil
    @State private var account: UUID? = nil
    @State private var date = Date()
    @State private var error = ""
    @State private var saving = false
    private var payments: [MoneyRecord] { store.items(.transaction).filter { $0.parentID == purchase.id } }
    var body: some View {
        List {
            AmountRow(label: "Gesamtpreis", amount: purchase.amount)
            AmountRow(label: "Offen", amount: purchase.amount + payments.reduce(Int64(0)) { $0 + $1.amount })
            ForEach((try? Installments.schedule(purchase)) ?? []) { due in
                VStack(alignment: .leading, spacing: 8) {
                    AmountRow(label: (due.index == 0 ? "Anzahlung" : "Rate " + String(due.index)) + " · " + due.date.formatted(date: .numeric, time: .omitted), amount: due.amount)
                    if payments.contains(where: { $0.installmentIndex == due.index }) { Label("Bezahlt", systemImage: "checkmark.circle") }
                    else { Button("Zahlung erfassen") { account = store.items(.account).first?.id; date = Date(); error = ""; paying = due } }
                }
            }
        }.navigationTitle(purchase.name).navigationBarTitleDisplayMode(.inline)
            .sheet(item: $paying) { due in
                NavigationStack {
                    Form {
                        AmountRow(label: due.index == 0 ? "Anzahlung" : "Rate " + String(due.index), amount: due.amount)
                        Picker("Konto", selection: $account) { Text("Konto wählen").tag(nil as UUID?); ForEach(store.items(.account)) { Text($0.name).tag(Optional($0.id)) } }
                        DatePicker("Bezahlt am", selection: $date, in: ...Date(), displayedComponents: .date)
                        if !error.isEmpty { Text(error).foregroundStyle(.red) }
                    }.navigationTitle("Zahlung").navigationBarTitleDisplayMode(.inline).toolbar {
                        ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { paying = nil } }
                        ToolbarItem(placement: .confirmationAction) { Button("Buchen") {
                            guard !saving else { return }; saving = true
                            do { guard let account else { throw MoneyError.missingAccount }; try store.payInstallment(purchase, index: due.index, accountID: account, date: date); paying = nil }
                            catch { self.error = error.localizedDescription }; saving = false
                        }.disabled(saving) }
                    }
                }
            }
    }
}
