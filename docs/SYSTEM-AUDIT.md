# MoreMoney – Systemaudit

25. November 2026. Prüfgegenstand ist der lokale Entwicklungsstand von MoreMoney 0.5.0 mit Next.js 16, React 19, Prisma/libSQL, Electron/Windows und separater SwiftUI-App. Die Tests verwendeten isolierte Datenbanken und synthetische Buchungen. Der Stand ist ein geprüfter lokaler Zwischenstand. Die vollständige Produktionsabnahme bleibt offen.

| Bereich | Prüfstatus | Befund und Korrektur |
| --- | --- | --- |
| Sitzungen und API | Bestanden mit Einschränkungen | Gleichzeitige Sitzungsänderungen konnten sich überschreiben. Die lokale Instanz verarbeitet sie in einer Warteschlange. Passphrase, Abmeldung und Sperre von Finanz- und Exportendpunkten sind als Regressionstest erfasst. MFA-Einrichtung und -Abschaltung nutzen dieselbe Versuchsbegrenzung. |
| Datenschutz | Bestanden mit Einschränkungen | Alle API-Antworten erhalten `Cache-Control: no-store`. Der Zugriff bleibt auf den lokalen Host und bei eingerichteter Sperre auf eine gültige Sitzung begrenzt. Der Privacy Mode blendet sensible Inhalte, Dialoge, Suche und Diagramme aus. Die aktive SQLite-Datei und Migrationssicherungen benötigen weiter Schutz durch das Betriebssystem. |
| Export und Import | Bestanden mit Einschränkungen | CSV-Export entschärft Formeleinträge auch bei führenden Leer- und Steuerzeichen. Import-Rücknahme berücksichtigt nachträgliche Klassifizierungen, Aufteilungen und verknüpfte Sparbewegungen. CSV, CAMT.053, MT940 und OFX wurden mit synthetischen Beispielen geprüft. Bankvarianten und echte Kontoauszüge sind offen. |
| Finanzmathematik | Bestanden mit Einschränkungen | Fremdwährungs-Aufteilungen erhalten den gerundeten Gesamtbetrag. Vergleichszeiträume verwenden dieselben Filter. Tests prüfen exakte Kredit- und Sparbeträge, Wechselkurse, Monatswechsel, Score-Interpolation und fehlende Daten. |
| Produktfunktionen | Bestanden mit Einschränkungen | Auswertung mit Zeitraum, Gruppierung, Kategorien und Diagrammwerten sowie Financial Health mit Teilwerten, Datenabdeckung, Monatsbestätigung und Simulation sind erreichbar. Der vollständige Sparziel-Manager, KI-Assistent, die Berichte und das Benachrichtigungscenter befinden sich weiter in Umsetzung. |
| UI und Reflow | Bestanden mit Einschränkungen | Vier konkrete Layoutbefunde korrigiert: Tabellenüberlauf durch die Positionierung von Screenreader-Text, veraltete Diagrammbreiten beim Drehen, umgebrochene Wortmarke bei 820 CSS-Pixeln und zu kleine Touchflächen in der mobilen Kopfzeile. Eine Zwischenkorrektur, die Diagramme auf null Breite begrenzte, wurde durch die Begrenzung auf die Kartenbreite ersetzt. Die Matrix erfasst Dokumentüberlauf und sichtbare Seiten. Sie ersetzt keine Einzelprüfung jedes Dialogs und Widgets. |
| Abhängigkeiten und Secrets | Bestanden mit Einschränkungen | `npm audit --omit=dev` meldete keine bekannten Schwachstellen in Produktionsabhängigkeiten. Die Stichprobe im Quellbaum und in der Git-Historie fand keine Treffer für die geprüften Muster für private Schlüssel und GitHub- sowie OpenAI-Tokens. Binärdateien und andere Tokenformate sind in der Stichprobe nicht erfasst. |
| Externe Dienste | Nicht verifiziert | Kein Open-Banking- oder KI-Provider konfiguriert. Kursdaten- und ETF-Abläufe verwenden in Tests simulierte Anbieterantworten. |
| Produktsicherheit und Betrieb | Nicht verifiziert | Kein Mehrbenutzerbetrieb, keine Prüfung echter iPhones, kein VoiceOver-Test und keine Feldmessungen für Core Web Vitals. Lokale App-Sperre, Betriebssystemzugriff und Datenbankverschlüsselung sind getrennte Schutzebenen. |

## Geltungsbereich und Befunde

Die Build-Routen umfassen Dashboard, Konten, Transaktionen, Fixkosten, Raten und Darlehen, Sparziele, Watchlist, Budgets, Projekte, Simulation, Einstellungen, Abos, Vermögen, Bankkonten, Datenschutz, Analyse und Financial Health. Technisch geprüft wurden außerdem die API-Gruppen `state`, `finance`, `intelligence`, `bank`, `privacy`, `export`, `images`, `documents` und `stocks` anhand statischer Sichtung und der genannten Automatisierung. Native iOS-Funktionen stehen in `platforms/ios` und haben eine separate Testsuite. Die Finanzmodule des Windows-Standes sind nicht automatisch in der SwiftUI-App verfügbar.

Die konkreten Audit-Korrekturen liegen in `src/proxy.ts`, `src/lib/local-security.ts`, `src/app/api/export/route.ts`, `src/app/api/bank/route.ts`, `src/lib/intelligence-state.ts` und `src/app/globals.css`. `src/components/intelligence-dashboard.tsx` verbindet die vorhandenen Berechnungen mit Analyse und Financial Health. Die Regressionstests liegen unter `e2e`. Die im Arbeitsbaum bereits vorbereiteten Migrationen 006 und 007 gehören zur Finance-OS-Erweiterung. Mit einer synthetischen Datenbank auf Stand 005 geprüft: Konten, Buchungen, Beträge und IDs blieben beim Upgrade erhalten. Ein zweiter Lauf änderte den Bestand nicht. Beide Migrationssicherungen waren lesbar und bestanden die SQLite-Integritätsprüfung.

### Sicherheitsbefunde

Die Einstufungen unten gelten für die lokale Einzelbenutzer-App. Sie sind keine CVSS-Bewertung.

| Schweregrad | Befund | Ergebnis und Nachweis |
| --- | --- | --- |
| Mittel | Gleichzeitige Änderungen von Sitzung und MFA konnten den jeweils anderen Schreibvorgang überschreiben. | Die Sicherheitsdatei wird innerhalb einer Instanz sequenziell geändert. Login, MFA, Sitzungssperre und Backup wurden in `e2e/zz-privacy-audit.spec.ts` geprüft. Mehrprozessbetrieb steht aus. |
| Mittel | Die Exportabsicherung erkannte Tabellenformeln mit vorangestellten Leer- oder Steuerzeichen nicht. | Export neutralisiert diese Präfixe. Ein Unit-Test prüft CSV-Werte mit solchen Eingaben. |
| Niedrig | Die API erzwang für Lesezugriffe keine einheitliche Prüfung des Ursprungs und keine einheitliche Cache-Sperre. | Der Proxy prüft den Ursprung für alle API-Methoden und setzt `no-store`. Die API- und Datenschutztests prüfen unter anderem abgewiesene Zugriffe und Cache-Header. |
| Offen | Die laufende lokale Datenbank und die Migrationssicherungen liegen ohne anwendungseigene Verschlüsselung auf dem Datenträger. | Dokumente und eigens exportierte verschlüsselte Backups sind abgedeckt. Für die aktiven Dateien bleibt Zugriffsschutz durch das Betriebssystem erforderlich. |

Die Finanzprüfung hat zwei Befunde korrigiert. Die Import-Rücknahme bewahrt nachträgliche Zuordnungen und berücksichtigt verknüpfte Sparbewegungen. Die Rundung von Fremdwährungsanteilen erhält den Buchungsgesamtbetrag. Die Layoutprüfung hat vier Befunde korrigiert. Tabellen bleiben innerhalb des Inhaltsbereichs, Diagramme passen sich der Kartenbreite beim Drehen an, die Wortmarke bleibt bei 820 CSS-Pixeln zusammen und mobile Kopfleistenaktionen haben größere Touchflächen. Die native Sichtbarkeit der Ratenvalidierung zählt separat zur iOS-Prüfung.

Der Finance-OS-Arbeitsstand ergänzt `fast-xml-parser` für Bankdateien, `iron-session` für Sitzungscookies und `otpauth` für TOTP. [Datenmodell und lokale Betriebsgrenzen](FINANCE-OS-ARCHITEKTUR.md)

Referenzen für serverseitige Sitzungsabläufe und Reflow bei 320 CSS-Pixeln. [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) · [WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow)

## Reproduzierbarkeit

`npm.cmd test`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build` und `npm.cmd run test:e2e` aus dem Projektverzeichnis. Browserauswahl über `MOREMONEY_TEST_BROWSER=webkit|firefox|chromium`, Standard ist Edge. Lokale Screenshots und Fehlertraces liegen unter `test-results`. Die Layoutprüfung setzt synthetische Daten ein und überprüft die Anwendung von Hell- und Dunkelmodus vor dem jeweiligen Durchlauf.

Das lokale, unsignierte NSIS-Setup liegt unter `release/windows/0.5.0/geprueft-20261125/MoreMoney-Setup-0.5.0.exe`. SHA-256 `65F71B52F16D2B771912BD23E39265B13FE807936EC7E5641A5A9BBDAAF01F80`. Die gepackte App hat den Desktop-Smoke-Test mit zwei Starts bestanden. Geprüft wurden UI-Start, Persistenz in einer temporären SQLite-Datenbank und Sperren fremder Zugriffe. Ein vollständiger Installations- und Deinstallationslauf auf einem frischen Windows-System steht aus. Wegen fehlender Authenticode-Signatur kann SmartScreen weiterhin warnen.

Die ersten beiden iOS-CI-Läufe haben je neun Modelltests und zwei der drei UI-Tests bestanden. Im ersten Lauf konnte der Test die Inline-Validierung der Ratenzahlung bei größter Schrift nicht finden. Sie erscheint jetzt als nativer Dialog. Im zweiten Lauf suchte der Test vor dem Scrollen nach dem falschen Elementtyp für das Betragsfeld und erreichte den Dialog nicht. Der Folge-Commit adressiert numerische Felder direkt, scrollt in kürzeren Schritten und verwendet für Ratenfälligkeiten explizit das deutsche Datumsformat. Der abschließende Lauf auf dem iPhone SE der 3. Generation hat alle neun Modelltests und alle drei UI-Tests bestanden. IPA-Build und IPA-Upload wurden übersprungen. [Erster Lauf](https://github.com/SimonKoesi/MoreMoney/actions/runs/45627007030) · [Zweiter Lauf](https://github.com/SimonKoesi/MoreMoney/actions/runs/45629832818) · [Erfolgreicher Lauf](https://github.com/SimonKoesi/MoreMoney/actions/runs/45632538444)


### Prüfmatrix

7 Desktopgrößen (1280×720 bis 3440×1440), 3 Tabletgrößen (768×1024, 820×1180, 1024×1366), 10 Smartphonegrößen (320×568 bis 440×956) sowie dieselben 10 Smartphonegrößen im Querformat. Die Matrix prüft 17 erreichbare Seiten, beide Farbmodi und die Sichtbarkeit des gefüllten Analyse-Diagramms vor dessen Screenshot. Separater Edge-Test mit 100, 150 und 200 Prozent Schriftgröße, langen Texten und scrollbarem Formular. CSS-Viewport- und Schriftgrößenprüfungen sind keine echte iPhone-Tastaturprüfung.

32 Unit-Tests, Lint, TypeScript und Produktionsbuild waren erfolgreich. Edge, Chromium, Firefox und Windows-WebKit haben jeweils die komplette End-to-End-Suite mit 13 Tests bestanden. Der separat erweiterte Edge-Test mit MFA-Anmeldung war ebenfalls erfolgreich.

Beispielaufnahmen aus der finalen WebKit-Matrix unter `test-results/audit-webkit/visual-audit-Audit-alle-ve-937c8-ide-Themes-und-30-Viewports/`. Visuell gesichtet wurden Desktop-Auswertung im Hellmodus, Aboansicht bei 820 CSS-Pixeln und mobiler Financial Health Screen im Dunkelmodus. Die Screenshots sind synthetische Testdaten und gehören nicht zum Installer.

| Ansicht | Vorher | Nachher |
| --- | --- | --- |
| Analyse am Desktop, Hellmodus | Bei einer Zwischenkorrektur waren die Diagrammbalken unsichtbar. | Der Test prüft sichtbare Balken vor der Aufnahme. [1440 × 900](../test-results/edge-geprueft/visual-audit-Audit-alle-ve-937c8-ide-Themes-und-30-Viewports/light-analysis-1440.png) |
| Smartphone, Hochformat und gedreht | Tabellenbeschriftungen und Diagramme erzeugten Seitenüberlauf. | Die korrigierte Layoutmatrix prüft den horizontalen Überlauf. [Financial Health, 390 × 844](../test-results/audit-webkit/visual-audit-Audit-alle-ve-937c8-ide-Themes-und-30-Viewports/dark-health-390.png) |

Native Simulatoraufnahmen aus dem erfolgreichen Lauf mit größter Systemschrift. [Konten im Hochformat](../test-results/ios-simulator-final/A206594E-08F8-460F-91B6-36767112C777.png) · [iPhone im Querformat](../test-results/ios-simulator-final/EE2C3944-C096-49BC-A17D-A212F7FF5D48.png) · [Validierung im Zahlungsdialog](../test-results/ios-simulator-final/A60D0658-7D82-4DBB-BCCC-175A7F776674.png). Die Ratenansicht zeigt nach der Korrektur Fälligkeiten als `TT.MM.JJJJ`. Bei extrem langen Namen kürzt die native Navigationsleiste den Titel weiterhin mit Auslassungspunkten. [Ratenansicht vorher](../test-results/ios-simulator-initial/5465C603-A6C7-4FC1-84D9-7015C5178088.png) · [Ratenansicht nachher](../test-results/ios-simulator-final/4ACB6087-CC03-4548-A156-F04F731BDE17.png)

Der wiederholte lokale Desktop-Smoke-Test dauerte zuletzt 2,48 Sekunden für zwei Starts einschließlich API- und Persistenzprüfung. Die Messung enthält Test- und Prozesszeit.

Der gepackte Produktionsserver wurde zusätzlich mit synthetischen Buchungen auf demselben Windows-Rechner gemessen. Die Zeiten sind Medianwerte aus je drei Läufen. Die Anzeige wurde mit Chromium bei 390 × 844 CSS-Pixeln bis zur ersten sichtbaren Zeile gemessen.

| Buchungen | `/api/state` einschließlich Übertragung | Antwortgröße | Erste sichtbare Zeile | Gerenderte Zeilen |
| --- | --- | --- | --- | --- |
| 30 | 16 ms | 17.544 Byte | 213 ms | 30 |
| 5.000 | 224 ms | 2.826.414 Byte | 1.285 ms | 5.000 |

Die Transaktionsansicht überträgt und rendert im Test die vollständige Liste. Die fehlende Seitennavigation oder Virtualisierung bleibt ein Skalierungsbefund. Messungen auf echten mobilen Geräten und Core Web Vitals im Feld bleiben offen.

## Offene Abnahme

- Für Live-Banking und KI fehlen konfigurierte Anbieter und Zugangsdaten. Bankdateiimporte bleiben lokal nutzbar.
- Authenticode-Signierung und Installation auf einem frischen Windows-System stehen aus. Das Setup wurde lokal erstellt und als Windows-Release noch nicht veröffentlicht.
- Die iOS-Simulatorprüfung deckt selektierte native Abläufe ab. Echte iPhones, VoiceOver und physische Tastaturinteraktionen wurden nicht geprüft.
- Für eine Produktionsfreigabe fehlen unter anderem die Prüfung auf echten Geräten, externe Integrationsprüfungen, rechtliche Datenschutzprüfung und Freigabe eines Betriebsmodells. Aus der begrenzten Secret-Stichprobe ergibt sich kein konkreter Rotationsbefund.
