# MoreMoney für iPhone und iPad

Eigenständige native SwiftUI-App für iOS 17+, lokal nutzbar ohne Cloud-Konto und ohne Beispieldaten. Quellen unter Sources, Modelltests unter Tests, native Layout-/Persistenztests unter UITests. XcodeGen erzeugt aus project.yml das Xcode-Projekt.

Enthalten: Konten, Buchungen, atomare Umbuchungen, Fixkosten-Planwerte, Budgets/Positionen mit Teilzahlungen und unabhängigen Aufgaben, Projekte, Sparziele, manuelle Aktien-Watchlist mit Favoriten und Kursdiagramm, lokaler JSON-Backup-Export. Die iOS-Version speichert eigenständig im geschützten Application-Support-Verzeichnis. Es gibt noch keine Synchronisierung und keinen Import des Windows-Datenformats. Produktbilder/-alternativen, Online-Kursprovider und der Windows-Simulator sind noch nicht als native Module enthalten.

Native Lists, Forms, NavigationStack und TabView berücksichtigen Bildschirmtastatur, Safe Areas, Dynamic Type und unterschiedliche iPhone-/iPadgrößen. Texte umbrechen; Geldbeträge werden unter Labels statt in engen, festen Spalten dargestellt. Keine unnötigen Layoutanimationen und keine Demonstrationsdaten beim Start.

## Auf einem Mac bauen

Xcode und XcodeGen installieren, dann:

```sh
cd platforms/ios
xcodegen generate
open MoreMoney.xcodeproj
```

In Xcode ein eigenes Team auswählen und die Bundle-ID bei Bedarf anpassen. Für eine installierbare IPA ist eine passende Apple-Signierung mit Provisioning nötig. Die GitHub-Action `iOS build and layout tests` baut auf einem Standard-macOS-Runner zunächst ohne Signierung und stellt `MoreMoney-unsigned.ipa` sowie Testergebnisse als Artefakte bereit. Eine unsignierte IPA ist kein regulär installierbarer App-Store-/Ad-Hoc-Release. TestFlight-/App-Store-Freigabe erfolgt nicht automatisch.

Windows kann diesen nativen iOS-Code nicht mit Xcode kompilieren oder einen iPhone-Simulator ausführen. Das Prüfprotokoll unterscheidet deshalb lokale Browserprüfungen von tatsächlich auf macOS ausgeführten nativen Tests. Native UI-Tests erzeugen ihre eigenen isolierten Datensätze, nie Daten in der produktiven App.

## Sideloadly und Kursalarme

Die unsignierte IPA ist für die erneute Signierung durch Sideloadly vorbereitet. Sie benötigt iOS 17 oder neuer. Kein bezahlter Developer-Zugang erforderlich; kostenlose Apple-IDs müssen typischerweise alle sieben Tage neu signieren. Die Apple-ID nur in Sideloadly eingeben.

1. Aktuelle Sideloadly-Version von https://sideloadly.io/ installieren.
2. iPhone per USB verbinden, entsperren und dem Computer vertrauen.
3. MoreMoney-iOS-0.5.0-Sideloadly.ipa in Sideloadly öffnen, Gerät und eigene Apple-ID auswählen, Start drücken.
4. Auf dem iPhone bei Bedarf unter Allgemein → VPN und Geräteverwaltung dem Entwickler vertrauen und den von iOS verlangten Entwicklermodus aktivieren.

Aktie öffnen → Kursalarm einrichten → Zielkurs, Ab/Bis und Benachrichtigung speichern. iOS fragt nach der Erlaubnis. Automatische Abrufe benötigen einen eigenen Twelve-Data-Schlüssel unter Mehr; der Schlüssel bleibt im Geräte-Schlüsselbund und fehlt in Backups. Symbole und Zugang werden nur an Twelve Data geschickt. Kein eigener Push-Server, keine permanente Überwachung: iOS bestimmt die Hintergrundabrufe (angefragt frühestens nach 30 Minuten); Beenden der App, Energiesparmodus oder deaktivierte Hintergrundaktualisierung können sie verhindern. Anbieterlimits und verzögerte Kurse gelten. Manuell gespeicherte neue Kurse prüfen den Alarm ebenfalls. Ein Alarm erfolgt einmal pro erreichtem Bereich, danach erst wieder nach Verlassen und erneutem Erreichen. Neue Einstellungen gelten nur für anschließend erfasste Kurse. Alarme sind keine verlässliche Handelsautomatisierung.

Lokale Finanzdaten sind ab der ersten Geräteentsperrung geschützt verfügbar, damit erlaubte Hintergrundabrufe den Stand lesen können. Keine Push-Entitlements nötig, daher auch mit kostenloser Sideloadly-Signierung verwendbar. Installation auf einem physischen iPhone und das tatsächliche iOS-Hintergrundverhalten müssen am Gerät geprüft werden.
