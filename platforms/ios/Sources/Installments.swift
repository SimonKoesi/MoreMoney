import SwiftUI

struct InstallmentDue: Identifiable {
    let index: Int
    let amount: Int64
    let date: Date
    var interest: Int64 = 0
    var principal: Int64 = 0
    var balance: Int64 = 0
    var id: Int { index }
}
enum Installments {
    static func schedule(_ record: MoneyRecord) throws -> [InstallmentDue] {
        if let principal = record.principalCents { return try loan(principal: principal, bps: record.interestBps ?? 0, months: record.termMonths ?? 0, date: record.date) }
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
    static func loan(principal: Int64, bps: Int64, months: Int, date: Date) throws -> [InstallmentDue] {
        guard principal > 0, principal <= 2_000_000_000, bps >= 0, bps <= 10000, months >= 1, months <= 600 else { throw MoneyError.invalidAmount }
        func interest(_ balance: Int64) -> Int64 { (balance * bps + 60_000) / 120_000 }
        func remaining(_ rate: Int64) -> Int64 {
            var balance = principal
            for _ in 0..<months {
                if balance == 0 { break }
                let charge = interest(balance)
                if rate <= charge { return 1 }
                balance = max(0, balance + charge - rate)
            }
            return balance
        }
        var low: Int64 = 1, high = principal + interest(principal)
        while low < high { let mid = (low + high) / 2; if remaining(mid) == 0 { high = mid } else { low = mid + 1 } }
        let dates = try schedule(MoneyRecord(kind: .installment, name: "Termine", amount: Int64(months), date: date, rateCents: 1))
        var result: [InstallmentDue] = [], balance = principal
        for index in 0..<months {
            if balance == 0 { break }
            let charge = interest(balance), amount = min(low, balance + charge), repaid = amount - charge
            balance -= repaid
            result.append(InstallmentDue(index: index + 1, amount: amount, date: dates[index].date, interest: charge, principal: repaid, balance: balance))
        }
        guard result.reduce(Int64(0), { $0 + $1.amount }) <= 2_000_000_000 else { throw MoneyError.overflow }
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
        }.navigationTitle("Raten & Darlehen").navigationBarTitleDisplayMode(.inline)
            .toolbar { Button { add = true } label: { Image(systemName: "plus") }.accessibilityLabel("Finanzierung hinzufügen") }
            .sheet(isPresented: $add) { InstallmentEditor() }
    }
}
struct InstallmentEditor: View {
    @EnvironmentObject private var store: MoneyStore
    @Environment(\.dismiss) private var dismiss
    @State private var isLoan = false
    @State private var apr = ""
    @State private var months = ""
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
                Picker("Art", selection: $isLoan) { Text("Ratenkauf").tag(false); Text("Darlehen").tag(true) }
                TextField("Name", text: $name, axis: .vertical).accessibilityIdentifier("installment-name")
                TextField(isLoan ? "Darlehensbetrag in EUR" : "Gesamtpreis inkl. Zinsen in EUR", text: $total).keyboardType(.decimalPad).accessibilityIdentifier("installment-total")
                if isLoan {
                    TextField("Fester Sollzins in % pro Jahr", text: $apr).keyboardType(.decimalPad)
                    TextField("Laufzeit in Monaten", text: $months).keyboardType(.numberPad)
                    Text("Monatliche Verzinsung, ohne Gebühren. Auszahlung separat erfassen.").font(.footnote)
                } else {
                    TextField("Anzahlung in EUR", text: $down).keyboardType(.decimalPad)
                    TextField("Monatsrate in EUR", text: $rate).keyboardType(.decimalPad).accessibilityIdentifier("installment-rate")
                }
                DatePicker("Erste Fälligkeit", selection: $date, displayedComponents: .date)
                Text("Anzahlung am ersten Termin. Zahlungen einzeln bestätigen.").font(.footnote)
                if !error.isEmpty { Text(error).foregroundStyle(.red) }
            }.navigationTitle("Finanzierung").navigationBarTitleDisplayMode(.inline).toolbar {
                ToolbarItemGroup(placement: .keyboard) { Spacer(); Button("Fertig") { UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil) } }
                ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Speichern") {
                        guard !saving else { return }; saving = true
                        do {
                            var record: MoneyRecord
                            if isLoan {
                                guard let term = Int(months) else { throw MoneyError.invalidAmount }
                                let principal = try Money.parse(total), bps = try Money.parse(apr)
                                let rows = try Installments.loan(principal: principal, bps: bps, months: term, date: date)
                                record = MoneyRecord(kind: .installment, name: name, amount: rows.reduce(Int64(0)) { $0 + $1.amount }, date: date, rateCents: rows.first!.amount, principalCents: principal, interestBps: bps, termMonths: term)
                            } else { record = MoneyRecord(kind: .installment, name: name, amount: try Money.parse(total), date: date, rateCents: try Money.parse(rate), downPaymentCents: try Money.parse(down)) }
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
            AmountRow(label: purchase.principalCents != nil ? "Gesamtrückzahlung" : "Gesamtpreis", amount: purchase.amount)
            if let principal = purchase.principalCents {
                let due = (try? Installments.schedule(purchase)) ?? []
                let paidIndices = Set(payments.compactMap(\.installmentIndex))
                AmountRow(label: "Restschuld", amount: principal - due.filter { paidIndices.contains($0.index) }.reduce(Int64(0)) { $0 + $1.principal })
                AmountRow(label: "Zinsen gesamt", amount: purchase.amount - principal)
            }
            AmountRow(label: "Offen", amount: purchase.amount + payments.reduce(Int64(0)) { $0 + $1.amount })
            ForEach((try? Installments.schedule(purchase)) ?? []) { due in
                VStack(alignment: .leading, spacing: 8) {
                    let dateLabel = due.date.formatted(.dateTime.day(.twoDigits).month(.twoDigits).year().locale(Locale(identifier: "de_DE")))
                    let rateLabel = due.index == 0 ? "Anzahlung" : "Rate \(due.index)"
                    AmountRow(label: "\(rateLabel) · \(dateLabel)", amount: due.amount)
                    if purchase.principalCents != nil {
                        AmountRow(label: "Zinsen", amount: due.interest)
                        AmountRow(label: "Tilgung", amount: due.principal)
                    }
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
                    }.navigationTitle("Zahlung").navigationBarTitleDisplayMode(.inline).toolbar {
                        ToolbarItemGroup(placement: .keyboard) { Spacer(); Button("Fertig") { UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil) } }
                        ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { paying = nil } }
                        ToolbarItem(placement: .confirmationAction) { Button("Buchen") {
                            guard !saving else { return }; saving = true
                            do { guard let account else { throw MoneyError.missingAccount }; try store.payInstallment(purchase, index: due.index, accountID: account, date: date); paying = nil }
                            catch { self.error = error.localizedDescription }; saving = false
                        }.disabled(saving) }
                    }.alert("Zahlung nicht gebucht", isPresented: Binding(
                        get: { !error.isEmpty },
                        set: { if !$0 { error = "" } }
                    )) {
                        Button("OK") { error = "" }
                    } message: {
                        Text(error)
                    }
                }
            }
    }
}
