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
