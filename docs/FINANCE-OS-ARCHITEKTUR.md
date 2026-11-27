# Finance-OS-Erweiterung

Stand 25.11.2026. Bestehender Stack: Next.js/React/TypeScript, Prisma/SQLite-libSQL, Electron-Windows und separate lokale SwiftUI-iOS-App. Keine bestehende Cloud, Benutzerverwaltung oder Bankverbindung. Keine IPA-Erzeugung ohne neue ausdrückliche Freigabe; automatische CI-Läufe testen nur.

Die bestehenden Konten und Buchungen bleiben zentrale Datenquelle. Bankimporte ergänzen sie transaktional mit stabilen IDs und Importbatches. Kontostände sind Anfangsbestand plus Buchungen, keine zusätzlich aufsummierten Banksalden. Interne Transfers bleiben neutral. Verknüpfte Konten dürfen kein zweites manuelles Asset erzeugen. Darlehen liefern ihre Restschuld ohne künftige Zinsen an das Nettovermögen. Watchlist allein ist kein Aktienbesitz.

Abonnements speichern Vertragsdaten und eine Preis-/Statushistorie. Sie ersetzen keine tatsächlichen Buchungen. Vorschläge aus Buchungen werden erst nach Bestätigung zu Verträgen. Nicht-EUR-Werte ohne Wechselkurs dürfen nicht still als EUR summiert werden. Vermögen führt automatische Tagesstände bei App-Nutzung und zusätzliche Änderungsstände; geschlossene Offline-App führt keine Arbeit aus.

Bankanbieter: zunächst keiner konfiguriert, ausdrücklich vom Nutzer bestätigt. Keine Anbieterbuchung, kein echter OAuth-Fluss und kein Internetbankzugriff ohne eigenen freigeschalteten Zugang. Dateiimport bleibt vollständig lokal. Produktive und Testdaten dürfen nicht vermischt werden. Geprüfte Anbietervoraussetzungen: finAPI-Live benötigt Lizenzvertrag (https://documentation.finapi.io/access/finapi-environments), Tink benötigt Zugang und produktabhängige Vereinbarung (https://tink.com/get-started/), GoCardless-Bankdatenzugang auf Anfrage (Service Terms Januar 2026). Keine allgemeine kostenlose Verfügbarkeit behaupten.

Sicherheit: lokale Einzelbenutzer-Anwendung, keine öffentlich gehostete Mehrbenutzerlösung. Bestehende Electron-Sitzung wird mit lokalem Sperr-/Sitzungsmodell ergänzt. Kein angebliches RLS auf SQLite. Export, Löschung und Importe benötigen serverseitige Autorisierung; Diagnoseprotokolle enthalten nur Ereignistypen und Zeitpunkte. Finanzwerte weder in Logs noch im URL-Query. Datenschutzeinstellungen gelten für Tabellen, Diagramme, Tooltips und Meldungen. Keine vollständige DSGVO-Konformität behaupten.

Vor neuen Schemaänderungen: konsistente SQLite-Sicherung mit VACUUM INTO; eine fehlgeschlagene Sicherung verhindert Migration. Rücksetzung offline nach App-Schließung aus gesicherter Datei, nie laufende Datenbank überschreiben. Bestehende Daten werden nicht automatisch gelöscht. Vollständige Datenlöschung nur durch eigenen bestätigten Ablauf.

Rechtlich/organisatorisch offen: Verantwortlicher, konkrete Rechtsgrundlagen, Speicher-/Backupfristen, Auftragsverarbeitervereinbarungen, Anbieter-Lizenz/PSD2-Rolle, Zustell-/Kündigungsregeln. Passkeys, geräteübergreifende Abmeldung und Cloud-Sync benötigen jeweils passende Plattform-/Serverarchitektur und dürfen nicht als verfügbar vorgetäuscht werden.

## Datenstruktur und Betrieb

| Datenbereich | Tabellen und Beziehungen |
| --- | --- |
| Verträge | `Subscription` mit verknüpftem Konto, `SubscriptionHistory` für Änderungen und `RejectedSuggestion` für verworfene Vorschläge. |
| Vermögen | `Asset`, `Liability`, `FxRate`, `WorthSnapshot` und `FinanceGoal`. Konten und bestehende Kreditpläne liefern gemeinsame Grundwerte. |
| Bankdateien | `ImportBatch` und `ImportChange` speichern Vorgänge und Rücknahmeinformationen. Importierte Buchungen nutzen `Transaction`; `CategoryRule` enthält Klassifizierungsregeln. |
| Datenschutz | `PrivacyConsent`, `AuditEvent` und `Document`. Die lokalen Sitzungs- und MFA-Daten liegen außerhalb der SQLite-Tabellen in `security.enc`. |
| Analyse | `GoalMovement`, `TransactionSplit`, `MonthCoverage`, `DataQualityConfig` und `HealthSnapshot`. Weitere Tabellen für Insights, Filter, Nachrichten und Berichte sind als Schema vorbereitet. Ihre Existenz belegt keine verfügbare Oberfläche. |

Das vollständige Modell und die versionierten Änderungen stehen in [schema.prisma](../prisma/schema.prisma), [Migration 006](../prisma/migrations/006_finance_os/migration.sql) und [Migration 007](../prisma/migrations/007_analysis_intelligence/migration.sql).

Die installierte Windows-App setzt ihre lokalen Serverwerte selbst. Bei isolierter Entwicklung und Tests steuern `FINOVA_DATA_DIR` und `DATABASE_URL` den Datenordner und die SQLite-Datei. `FINOVA_MASTER_KEY` und `FINOVA_SESSION_TOKEN` übergibt Electron intern für Verschlüsselung und Loopback-Zugriff. Ein separat gestarteter Entwicklungsserver mit lokal abgelegter `development.key` hat nicht den Windows-Schlüsselbundschutz des Electron-Pakets. `MOREMONEY_TWELVE_DATA_KEY` ist eine optionale serverseitige Einstellung für Kursdaten. Die Nutzung setzt zusätzlich die Einwilligung in der App voraus.

In **Bankkonten** ein Konto auswählen, eine CSV-, CAMT.053-, MT940- oder OFX-Datei laden und Vorschau sowie Zuordnung prüfen. Erst mit der Importbestätigung werden Buchungen geschrieben. Der Importverlauf bietet die Rücknahme einzelner Vorgänge. Für diesen Ablauf sind keine Zugangsdaten erforderlich. Der externe Bankstatus lautet **Nicht konfiguriert**. Die App enthält derzeit keine Produktionskonfiguration für Live-Banking oder KI.
