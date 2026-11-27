# MoreMoney

Persönlicher Finanz-, Budget- und Aktienplaner ohne vorinstallierte Probe- oder Demodaten.

| Plattform | Quellcode | Ausgabe |
| --- | --- | --- |
| Windows x64 | [platforms/windows](platforms/windows/README.md), src/, prisma/ | release/windows/0.5.3/MoreMoney-Setup-0.5.3.exe |
| iPhone / iPad, iOS 17+ | [platforms/ios](platforms/ios/README.md) | release/ios/MoreMoney-iOS-0.5.0-Sideloadly.ipa |

Downloads unter [Releases](https://github.com/SimonKoesi/MoreMoney/releases). Die iOS-App wurde tatsächlich auf macOS gebaut, ist ohne Apple-Signierung aber noch nicht regulär installierbar. Für Ad-Hoc/TestFlight/App Store sind ein eigenes Apple-Team und passendes Provisioning erforderlich. Das Windows-Setup ist ebenfalls weiterhin unsigniert.

## Windows

Node.js 24 LTS und npm. In PowerShell bei blockiertem npm.ps1 npm.cmd verwenden:

```powershell
npm.cmd ci
npx.cmd prisma generate
npm.cmd run dev
npm.cmd run desktop:build
```

Die Entwicklungsoberfläche läuft nur auf 127.0.0.1:3000. Beim Endnutzer startet Electron den lokalen Dienst mit Sitzungstoken. Neue Installationen verwenden `%APPDATA%/MoreMoney/data`. Updates öffnen bestehende Finanzdaten im bisherigen Ordner `%APPDATA%/finova/data`. Bei blockierten Installationsskripten kann die Electron-Laufzeit gezielt mit `node node_modules/electron/install.js` installiert werden.

Ab 0.5.3 entfallen die Aktien-Watchlist und der Kursdienst. Gespeicherte Kurse bleiben in Backups und bei bereits verknüpften Vermögenswerten erhalten.

Das Dashboard zeigt unter **Wohin fließt dein Geld?** die gebuchten Einnahmen, Ausgabenkategorien und den Überschuss oder Fehlbetrag. Eine Kategorie öffnet die zugehörigen Buchungen mit ihrem Anteil am Gesamtbetrag. Die Zeitraumwahl steuert auch den Cashflow-Verlauf. Im Abo-Formular lässt sich ein eigenes Logo hinzufügen, austauschen oder entfernen.

**Finanzassistent** und **Berichte** verwenden lokale Finanzberechnungen. Berichte lassen sich als Text exportieren. Der optionale Sprachmodell-Adapter wird über `MOREMONEY_OPENAI_API_KEY` und `MOREMONEY_OPENAI_MODEL` serverseitig eingerichtet. Erst die Freigabe für eine einzelne Frage erlaubt, ihren Text zur Themenwahl an OpenAI zu senden. Die Anwendung überträgt dabei keine zusätzlichen Konten, Buchungen oder Berechnungsergebnisse. [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create)

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:e2e
node scripts/smoke-desktop.cjs
```

Migration 003 entfernt den früher ausdrücklich markierten Beispieldatensatz. Zusätzlich selbst angelegte Buchungen, Positionen und Aufgaben in dessen Konten/Plänen bleiben erhalten; deren IDs und Beziehungen werden bewahrt. Demo-Schaltflächen und Demo-API-Befehl wurden entfernt. Regressionstests verwenden isolierte Testdaten, die nicht als App-Inhalte ausgeliefert werden.

## iOS

Die native SwiftUI-App verwendet lokale, atomar gespeicherte Daten und native Navigation/Formulare. Auf einem Mac in platforms/ios mit xcodegen generate das Xcode-Projekt erzeugen und öffnen. Die GitHub-Action „iOS build and layout tests“ führt echte Modell- und Simulator-Tests aus und liefert IPA, xcresult-Protokoll und Screenshots. Die Standard-macOS-Runner sind für dieses öffentliche Repository kostenlos; Apple-Zugangsdaten werden nicht hinterlegt.

Die Plattformen synchronisieren noch nicht automatisch. iOS besitzt einen benutzbaren nativen Kern; [Umfang und Signierung](platforms/ios/README.md) beschreiben die Unterschiede zur Windows-Version. Ein Windows-Build ersetzt keine Apple-Signierung.

## Dokumentation

- [Funktionsstand](docs/STATUS.md) und [Prüfprotokoll](docs/PRUEFUNGEN.md)
- [Master-Prompt](docs/MASTER-PROMPT.md) und [Bausteine](docs/ELEMENTE-EVALUIERUNG.md)
- [Berechnungen](docs/BERECHNUNGEN.md) und [Aktien-Watchlist](docs/AKTIEN-WATCHLIST.md)
- [Bankanbindung einrichten](docs/BANKANBINDUNG.md) und [Upgrade- und Kompatibilitätsbericht](docs/FINANCE-OS-2-UPGRADE.md)

Backups lassen sich lokal exportieren. In 0.5.2 stehen lokale Konten und der Dateiimport im Vordergrund. Vorhandene Onlinefreigaben lassen sich im Datenschutz widerrufen. Die Übertragung einer Frage an das konfigurierte Sprachmodell erfolgt nach Einzelzustimmung.
Für die native App gelten die Hinweise zu [Build und Signierung](platforms/ios/README.md).

Neu: Namensvorschläge für Aktien und ETFs, automatische Kursbeobachtung über eigenen Twelve-Data-Zugang und Ratenkäufe/Darlehen mit festem Sollzins, Tilgungsplan, Zinsanteilen und Restschuld. Bestätigte Ratenzahlungen werden ohne Duplikate gebucht; das Anlegen allein verändert keinen Kontostand. Profilblock „Mein persönlicher Bereich“ entfernt. Details: docs/FINANZIERUNGEN.md und docs/AKTIEN-WATCHLIST.md.
