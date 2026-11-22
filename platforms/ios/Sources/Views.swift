import SwiftUI
import Charts
import UniformTypeIdentifiers

struct MainView: View {
    var body: some View {
        TabView {
            NavigationStack { OverviewView() }.tabItem { Label("Übersicht", systemImage: "square.grid.2x2") }
            NavigationStack { FinanceView() }.tabItem { Label("Finanzen", systemImage: "creditcard") }
            NavigationStack { PlansView() }.tabItem { Label("Pläne", systemImage: "folder") }
            NavigationStack { StockListView() }.tabItem { Label("Aktien", systemImage: "chart.xyaxis.line") }
            NavigationStack { SettingsView() }.tabItem { Label("Mehr", systemImage: "ellipsis") }
        }
    }
}

struct AmountRow: View {
    let label: String
    let amount: Int64
    var currency = "EUR"
    var decimals = 2
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.subheadline).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            Text(Money.display(amount, currency: currency, decimals: decimals)).font(.title3.weight(.semibold)).monospacedDigit().fixedSize(horizontal: false, vertical: true)
        }.padding(.vertical, 5)
    }
}

struct OverviewView: View {
    @EnvironmentObject private var store: MoneyStore
    @State private var add = false
    var body: some View {
        List {
            Section {
                AmountRow(label: "Kontostand", amount: store.totalBalance)
                AmountRow(label: "Einnahmen", amount: store.items(.transaction).filter { $0.amount > 0 }.reduce(0) { $0 + $1.amount })
                AmountRow(label: "Ausgaben", amount: -store.items(.transaction).filter { $0.amount < 0 }.reduce(0) { $0 + $1.amount })
            }
            if store.items(.account).isEmpty {
                Button { add = true } label: { Label("Erstes Konto anlegen", systemImage: "plus.circle") }
            }
            Section("Budgets") {
                ForEach(store.items(.budget)) { record in NavigationLink { PlanDetail(record: record) } label: { AmountRow(label: record.name, amount: store.budgetTotals(record).remaining) } }
                if store.items(.budget).isEmpty { Text("Noch keine Budgets").foregroundStyle(.secondary) }
            }
        }.navigationTitle("MoreMoney")
            .sheet(isPresented: $add) { RecordEditor(kind: .account) }
    }
}

struct FinanceView: View {
    @EnvironmentObject private var store: MoneyStore
    @State private var kind: RecordKind = .account
    @State private var add = false
    @State private var transfer = false
    var body: some View {
        List {
            Picker("Ansicht", selection: $kind) {
                Text("Konten").tag(RecordKind.account)
                Text("Buchungen").tag(RecordKind.transaction)
                Text("Fixkosten").tag(RecordKind.recurring)
            }.pickerStyle(.menu)
            ForEach(store.items(kind)) { record in
                AmountRow(label: record.name, amount: kind == .account ? store.balance(record) : record.amount)
                    .swipeActions { Button("Löschen", role: .destructive) { do { try store.remove(record) } catch { store.error = error.localizedDescription } } }
            }
            if store.items(kind).isEmpty { Text("Noch keine Einträge").foregroundStyle(.secondary) }
            if store.items(.account).count > 1 { Button("Umbuchen") { transfer = true } }
        }.navigationTitle("Finanzen")
            .toolbar { Button { add = true } label: { Image(systemName: "plus") }.accessibilityLabel("Eintrag hinzufügen").accessibilityIdentifier("add-record") }
            .sheet(isPresented: $add) { RecordEditor(kind: kind) }
            .sheet(isPresented: $transfer) { TransferEditor() }
    }
}

struct PlansView: View {
    @EnvironmentObject private var store: MoneyStore
    @State private var kind: RecordKind = .budget
    @State private var add = false
    var body: some View {
        List {
            Picker("Ansicht", selection: $kind) { Text("Budgets").tag(RecordKind.budget); Text("Projekte").tag(RecordKind.project); Text("Sparziele").tag(RecordKind.goal) }.pickerStyle(.menu)
            ForEach(store.items(kind)) { record in NavigationLink { PlanDetail(record: record) } label: { Text(record.name).fixedSize(horizontal: false, vertical: true) } }
            if store.items(kind).isEmpty { Text("Noch keine Pläne").foregroundStyle(.secondary) }
        }.navigationTitle("Pläne").toolbar { Button { add = true } label: { Image(systemName: "plus") }.accessibilityLabel("Plan hinzufügen") }
            .sheet(isPresented: $add) { RecordEditor(kind: kind) }
    }
}

struct PlanDetail: View {
    @EnvironmentObject private var store: MoneyStore
    let record: MoneyRecord
    @State private var add = false
    @State private var paymentItem: MoneyRecord? = nil
    private var childKind: RecordKind { record.kind == .budget ? .item : record.kind == .project ? .task : .contribution }
    var body: some View {
        List {
            if record.kind == .budget {
                let totals = store.budgetTotals(record)
                AmountRow(label: "Gesamtbudget", amount: record.amount)
                AmountRow(label: "Bezahlt", amount: totals.paid)
                AmountRow(label: "Offener Plan", amount: totals.open)
                AmountRow(label: "Prognostizierter Rest", amount: totals.remaining)
            } else if record.kind == .goal {
                let saved = store.items(.contribution, parent: record.id).reduce(Int64(0)) { $0 + $1.amount }
                AmountRow(label: "Ziel", amount: record.amount)
                AmountRow(label: "Fortschritt ohne Kontobuchung", amount: saved)
                ProgressView(value: Double(min(saved, record.amount)), total: Double(max(1, record.amount))).accessibilityLabel("Sparfortschritt")
            } else {
                let tasks = store.items(.task, parent: record.id)
                ProgressView(value: Double(tasks.filter(\.done).count), total: Double(max(1, tasks.count))).accessibilityLabel("Projektfortschritt")
            }
            ForEach(store.items(childKind, parent: record.id)) { item in
                VStack(alignment: .leading, spacing: 10) {
                    if childKind == .contribution { AmountRow(label: item.name, amount: item.amount) }
                    else {
                        Toggle(isOn: Binding(get: { item.done }, set: { _ in store.toggle(item) })) { Text(item.name).strikethrough(item.done).fixedSize(horizontal: false, vertical: true) }
                        if childKind == .item {
                            Text(Money.display(item.amount * item.quantity)).monospacedDigit()
                            Button("Zahlung erfassen") { paymentItem = item }
                        }
                    }
                }.padding(.vertical, 4)
            }
        }.navigationTitle(record.name).navigationBarTitleDisplayMode(.inline)
            .toolbar { Button { add = true } label: { Image(systemName: "plus") }.accessibilityLabel("Position hinzufügen") }
            .sheet(isPresented: $add) { RecordEditor(kind: childKind, parent: record.id) }
            .sheet(item: $paymentItem) { item in RecordEditor(kind: .transaction, parent: item.id, defaultName: item.name) }
    }
}

struct StockListView: View {
    @EnvironmentObject private var store: MoneyStore
    @State private var add = false
    @State private var favorites = false
    @State private var search = ""
    var stocks: [MoneyRecord] { store.items(.stock).filter { (!favorites || $0.favorite) && (search.isEmpty || ($0.name + $0.symbol).localizedCaseInsensitiveContains(search)) } }
    var body: some View {
        List {
            Toggle("Nur Favoriten", isOn: $favorites)
            ForEach(stocks) { stock in
                HStack(alignment: .top, spacing: 12) {
                    NavigationLink { StockDetail(stock: stock) } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(stock.name).font(.headline).fixedSize(horizontal: false, vertical: true)
                            Text(stock.symbol + " · " + stock.currency).font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                    Button { store.toggle(stock, favorite: true) } label: { Image(systemName: stock.favorite ? "star.fill" : "star") }.buttonStyle(.borderless).accessibilityLabel(stock.favorite ? "Favorit entfernen" : "Als Favorit markieren")
                }.padding(.vertical, 5)
            }
            if stocks.isEmpty { Text("Noch keine passenden Aktien").foregroundStyle(.secondary) }
        }.navigationTitle("Aktien").searchable(text: $search, prompt: "Name oder Symbol")
            .toolbar { Button { add = true } label: { Image(systemName: "plus") }.accessibilityLabel("Aktie hinzufügen") }
            .sheet(isPresented: $add) { RecordEditor(kind: .stock) }
    }
}

struct StockDetail: View {
    @EnvironmentObject private var store: MoneyStore
    let stock: MoneyRecord
    @State private var add = false
    @State private var alertEditor = false
    @State private var refreshing = false
    @State private var error = ""
    private var current: MoneyRecord { store.items(.stock).first(where: { $0.id == stock.id }) ?? stock }
    private var quotes: [MoneyRecord] { store.items(.quote, parent: stock.id).sorted { $0.date < $1.date } }
    var body: some View {
        List {
            if let latest = quotes.last {
                AmountRow(label: (latest.source ?? "Manuell") + " · " + latest.date.formatted(), amount: latest.amount, currency: stock.currency, decimals: 6)
            }
            if current.amount > 0 { AmountRow(label: "Zielkurs", amount: current.amount, currency: stock.currency, decimals: 6) }
            Section {
                Button { alertEditor = true } label: { Label(current.alertsEnabled == true ? "Kursalarm bearbeiten" : "Kursalarm einrichten", systemImage: current.alertsEnabled == true ? "bell.badge" : "bell") }
                if !QuoteKey.read().isEmpty {
                    Button(refreshing ? "Wird aktualisiert …" : "Kurs aktualisieren") {
                        refreshing = true; error = ""
                        Task {
                            do { try await StockAlerts.shared.refresh(current, store: store) }
                            catch { self.error = QuoteFailure.unavailable.localizedDescription }
                            refreshing = false
                        }
                    }.disabled(refreshing)
                }
                if !error.isEmpty { Text(error).foregroundStyle(.red) }
            }
            if quotes.count > 1 {
                Chart(quotes) { quote in LineMark(x: .value("Datum", quote.date), y: .value(stock.currency, Double(quote.amount) / 1_000_000)) }.frame(minHeight: 180).accessibilityLabel("Gespeicherter Kursverlauf")
            }
            if !stock.note.isEmpty { Text(stock.note).fixedSize(horizontal: false, vertical: true) }
            ForEach(quotes.reversed()) { quote in AmountRow(label: quote.date.formatted(), amount: quote.amount, currency: stock.currency, decimals: 6) }
        }.navigationTitle(stock.name).navigationBarTitleDisplayMode(.inline)
            .toolbar { Button { add = true } label: { Image(systemName: "plus") }.accessibilityLabel("Kurs erfassen") }
            .sheet(isPresented: $add) { RecordEditor(kind: .quote, parent: stock.id, defaultName: stock.name) }
            .sheet(isPresented: $alertEditor) { AlertEditor(stock: current) }
    }
}

struct AlertEditor: View {
    @EnvironmentObject private var store: MoneyStore
    @Environment(\.dismiss) private var dismiss
    let stock: MoneyRecord
    @State private var enabled = false
    @State private var below = false
    @State private var target = ""
    @State private var saving = false
    @State private var error = ""
    var body: some View {
        NavigationStack {
            Form {
                Toggle("Benachrichtigung", isOn: $enabled)
                TextField("Zielkurs in " + stock.currency, text: $target).keyboardType(.decimalPad).accessibilityIdentifier("alert-target")
                Picker("Auslösen", selection: $below) { Text("Ab Zielkurs").tag(false); Text("Bis Zielkurs").tag(true) }
                Section {
                    Text("Nach neuen Kursen. Hintergrundabrufe sind von iOS abhängig; keine dauerhafte Überwachung.").font(.footnote)
                    if QuoteKey.read().isEmpty { Text("Automatisch: Twelve-Data-Schlüssel unter Mehr hinterlegen.").font(.footnote) }
                    if !error.isEmpty { Text(error).foregroundStyle(.red) }
                }
            }.navigationTitle("Kursalarm").navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { dismiss() }.disabled(saving) }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Speichern") {
                            guard !saving else { return }; saving = true
                            Task {
                                do {
                                    let value = try (target.isEmpty && !enabled ? stock.amount : Money.parse(target, decimals: 6))
                                    guard value > 0 || !enabled else { throw MoneyError.invalidAmount }
                                    if enabled { try await StockAlerts.shared.permission() }
                                    try store.setAlert(stock.id, target: value, below: below, enabled: enabled)
                                    StockAlerts.shared.schedule(store)
                                    dismiss()
                                } catch { self.error = error.localizedDescription }
                                saving = false
                            }
                        }.disabled(saving)
                    }
                }
                .onAppear {
                    enabled = stock.alertsEnabled == true; below = stock.alertBelow == true
                    if stock.amount > 0 { target = NSDecimalNumber(value: stock.amount).dividing(by: NSDecimalNumber(value: 1_000_000)).stringValue }
                }
        }
    }
}

struct RecordEditor: View {
    @EnvironmentObject private var store: MoneyStore
    @Environment(\.dismiss) private var dismiss
    let kind: RecordKind
    var parent: UUID? = nil
    var defaultName = ""
    @State private var name = ""
    @State private var amount = ""
    @State private var account: UUID? = nil
    @State private var income = false
    @State private var symbol = ""
    @State private var currency = "EUR"
    @State private var exchange = ""
    @State private var securityType = ""
    @State private var suggestions: [QuoteClient.Suggestion] = []
    @State private var selectedName = ""
    @State private var note = ""
    @State private var quantity = 1
    @State private var date = Date()
    @State private var error = ""
    @State private var saving = false
    private var needsAmount: Bool { ![.project, .task].contains(kind) }
    var body: some View {
        NavigationStack {
            Form {
                TextField("Name", text: $name, axis: .vertical).lineLimit(1...5).accessibilityIdentifier("record-name")
                if kind == .stock && symbol.isEmpty && QuoteKey.read().isEmpty { Text("Namenssuche: eigenen Twelve-Data-Schlüssel unter Mehr hinterlegen.").font(.footnote) }
                if kind == .stock {
                    ForEach(suggestions) { suggestion in
                        Button {
                            selectedName = suggestion.instrument_name; name = suggestion.instrument_name
                            symbol = suggestion.symbol; currency = suggestion.currency
                            exchange = suggestion.exchange; securityType = suggestion.instrument_type
                            suggestions = []
                        } label: {
                            VStack(alignment: .leading) { Text(suggestion.instrument_name); Text(suggestion.symbol + " · " + suggestion.exchange + " · " + suggestion.instrument_type).font(.caption).foregroundStyle(.secondary) }
                        }
                    }
                }
                if needsAmount { TextField(kind == .stock ? "Zielkurs · optional" : kind == .quote ? "Kurs" : "Betrag in EUR", text: $amount).keyboardType(.decimalPad).accessibilityIdentifier("record-amount") }
                if kind == .transaction {
                    Toggle("Einnahme", isOn: $income)
                    Picker("Konto", selection: $account) { Text("Konto wählen").tag(nil as UUID?); ForEach(store.items(.account)) { item in Text(item.name).tag(Optional(item.id)) } }
                }
                if kind == .item { Stepper("Menge: \(quantity)", value: $quantity, in: 1...1000) }
                if kind == .stock {
                    TextField("Symbol", text: $symbol).textInputAutocapitalization(.characters).autocorrectionDisabled()
                    Picker("Währung", selection: $currency) { ForEach(["EUR", "USD", "GBP", "CHF"], id: \.self) { Text($0) } }
                }
                if [.transaction, .quote].contains(kind) { DatePicker("Datum", selection: $date, in: ...Date(), displayedComponents: .date) }
                if [.stock, .budget, .project].contains(kind) { TextField("Notiz · optional", text: $note, axis: .vertical).lineLimit(2...8) }
                if !error.isEmpty { Text(error).foregroundStyle(.red).fixedSize(horizontal: false, vertical: true) }
            }.navigationTitle("Eintrag hinzufügen").navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { dismiss() }.disabled(saving) }
                    ToolbarItem(placement: .confirmationAction) { Button("Speichern") { save() }.disabled(saving).accessibilityIdentifier("save-record") }
                }
                .onAppear { name = defaultName; account = store.items(.account).first?.id }
                .task(id: name) {
                    guard kind == .stock, name != selectedName, name.trimmingCharacters(in: .whitespaces).count >= 2 else { suggestions = []; return }
                    do {
                        try await Task.sleep(for: .milliseconds(350))
                        let matches = try await QuoteClient.search(name)
                        try Task.checkCancellation(); suggestions = matches
                    } catch is CancellationError { } catch { suggestions = []; self.error = "Suche nicht verfügbar. Erneut tippen oder Symbol manuell eingeben." }
                }
        }
    }
    private func save() {
        guard !saving else { return }
        saving = true
        do {
            var value: Int64 = 0
            if needsAmount && !(kind == .stock && amount.isEmpty) { value = try Money.parse(amount, decimals: [.stock, .quote].contains(kind) ? 6 : 2) }
            if kind != .account && value < 0 { throw MoneyError.invalidAmount }
            if kind == .transaction { guard value > 0 else { throw MoneyError.invalidAmount }; if !income { value = -value } }
            if kind == .stock && symbol.trimmingCharacters(in: .whitespaces).isEmpty { throw MoneyError.missingName }
            let record = MoneyRecord(kind: kind, name: name, amount: value, parentID: parent, accountID: kind == .transaction ? account : nil, quantity: Int64(quantity), note: note, symbol: symbol.uppercased(), currency: currency, date: date, exchange: kind == .stock ? exchange : nil, securityType: kind == .stock ? securityType : nil)
            try store.save(record)
            if kind == .stock && !QuoteKey.read().isEmpty {
                Task { do { try await StockAlerts.shared.refresh(record, store: store) } catch { store.error = QuoteFailure.unavailable.localizedDescription } }
            }
            dismiss()
        } catch { self.error = error.localizedDescription }
        saving = false
    }
}

struct TransferEditor: View {
    @EnvironmentObject private var store: MoneyStore
    @Environment(\.dismiss) private var dismiss
    @State private var from: UUID? = nil
    @State private var to: UUID? = nil
    @State private var amount = ""
    @State private var error = ""
    var body: some View {
        NavigationStack {
            Form {
                Picker("Von Konto", selection: $from) { Text("Wählen").tag(nil as UUID?); ForEach(store.items(.account)) { Text($0.name).tag(Optional($0.id)) } }
                Picker("Auf Konto", selection: $to) { Text("Wählen").tag(nil as UUID?); ForEach(store.items(.account)) { Text($0.name).tag(Optional($0.id)) } }
                TextField("Betrag in EUR", text: $amount).keyboardType(.decimalPad)
                if !error.isEmpty { Text(error).foregroundStyle(.red) }
            }.navigationTitle("Umbuchen").navigationBarTitleDisplayMode(.inline).toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button("Speichern") { do { guard let from, let to else { throw MoneyError.missingAccount }; try store.transfer(from: from, to: to, amount: Money.parse(amount)); dismiss() } catch { self.error = error.localizedDescription } } }
            }
        }
    }
}

struct BackupDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    var data: Data
    init(data: Data) { self.data = data }
    init(configuration: ReadConfiguration) throws { data = configuration.file.regularFileContents ?? Data() }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: data) }
}

struct SettingsView: View {
    @EnvironmentObject private var store: MoneyStore
    @State private var exporting = false
    @State private var document: BackupDocument? = nil
    @State private var key = ""
    @State private var keyMessage = ""
    var body: some View {
        Form {
            NavigationLink("Ratenkäufe") { InstallmentList() }
            Section { Label("Lokal auf diesem Gerät", systemImage: "lock.shield"); Text("MoreMoney 0.5").foregroundStyle(.secondary) }
            Section("Aktienkurse · Twelve Data") {
                SecureField("Eigener API-Schlüssel", text: $key).textInputAutocapitalization(.never).autocorrectionDisabled()
                Button("Schlüssel speichern") {
                    do { try QuoteKey.save(key); key = ""; keyMessage = "Sicher gespeichert"; StockAlerts.shared.schedule(store); Task { await StockAlerts.shared.refreshEnabled(store) } }
                    catch { keyMessage = error.localizedDescription }
                }.disabled(key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                Button("Schlüssel entfernen", role: .destructive) {
                    do { try QuoteKey.save(""); key = ""; keyMessage = "Entfernt"; StockAlerts.shared.schedule(store) }
                    catch { keyMessage = error.localizedDescription }
                }
                Text("Nur Symbol und Zugang gehen an Twelve Data. Kurse und Limits hängen vom eigenen Tarif ab.").font(.footnote)
                if !keyMessage.isEmpty { Text(keyMessage).font(.footnote) }
            }
            Button("Backup exportieren") { do { document = BackupDocument(data: try store.backup()); exporting = true } catch { store.error = error.localizedDescription } }
        }.navigationTitle("Mehr")
            .fileExporter(isPresented: $exporting, document: document, contentType: .json, defaultFilename: "MoreMoney-Backup") { result in if case .failure(let error) = result { store.error = error.localizedDescription } }
    }
}
