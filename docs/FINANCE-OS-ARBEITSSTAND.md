# Arbeitsstand der laufenden Erweiterung

Die bisherigen Sicherheits- und Plattformprüfungen stehen im [Systemaudit](SYSTEM-AUDIT.md).

## MoreMoney mit Kursdienst, Assistent und Berichten

Das öffentliche Repository heißt [SimonKoesi/MoreMoney](https://github.com/SimonKoesi/MoreMoney). Der Profilbereich wurde aus der Desktop-Navigation entfernt. Neue Windows-Installationen nutzen den MoreMoney-Datenordner. Bestehende Datenbanken werden weiter unter ihrem bisherigen Pfad geöffnet. Im Upgrade-Test blieben die synthetische Datenbank und ihre Inhalte erhalten.

Windows enthält Finanzassistent, lokale Berichte für Woche, Monat, Monatsabschluss, Quartal und Jahr, sowie den Kursdienst mit verschlüsselter Schlüsselablage. Der Produktionsbuild hat mit dem öffentlichen Twelve-Data-Demozugang Apple über den Namen gefunden, den NASDAQ-Kurs automatisch gespeichert und nach Neuladen wieder angezeigt. Auch die Suche nach dem Namen des SPY-ETFs lieferte das Instrument. Allgemeiner Kurszugriff benötigt den eigenen Anbieterzugang. Der CSV-Import erkennt verbreitete Spalten in der ersten Vorschau und prüft die Währung des gewählten Kontos. Live-Banking bleibt ohne Anbieter unkonfiguriert.

34 Unit-Tests, 18 Edge-End-to-End-Tests und zwei Relay-Tests bestanden. Auf dem simulierten iPhone SE bestanden 10 Modell- und 3 Oberflächentests. Der Push-Quellcode samt getrenntem Relay ist im öffentlichen Repository verfügbar. Die Zustellung auf echter Hardware benötigt einen laufenden HTTPS-Relay, einen Kursanbieterzugang und eigene Apple-Push-Signierung. [iOS-CI ohne IPA](https://github.com/SimonKoesi/MoreMoney/actions/runs/45647764092) · [Push-Einrichtung](../platforms/push/README.md)

Das aktualisierte Windows-Setup liegt unter `release/windows/0.5.0/moremoney-20261125/MoreMoney-Setup-0.5.0.exe`. SHA-256 `03600148592F2672EAAECD66DE8669266AB5320CC80E745A3EE800A192CC3DA1`. Es ist lokal und unsigniert. Es wurde keine IPA erzeugt.

## Weiterentwicklung nach dem Systemaudit

**Sparziele** verwendet die bestehenden Tabellen `SavingsGoal` und `GoalMovement`. Ziel-Links sind wiederaufrufbar. Kontogebundene Spartöpfe prüfen bei neuen Zuordnungen die Deckung. Virtuelle Einzahlungen, Entnahmen, Umbuchungen und Korrekturen verändern den Kontostand nicht. Eine bestätigte laufende Einnahme kann bis zum verfügbaren Rest ihrer Buchung zugeordnet werden. Die Historie bleibt erhalten. Die Simulation übernimmt auf Wunsch Zielbetrag, Rate, Wunschdatum und Modellzins. Startguthaben und Sonderzahlungen aus der Simulation sind Modellwerte. Die automatische EUR-Verteilung bietet eine Vorschau und verlangt bei unbekannter oder unzureichender Deckung eine Bestätigung.

**Benachrichtigungen** zeigt lokale Finanzmeldungen mit Lesestand, Archiv, Wiederherstellung, Kategorieauswahl und Links zum jeweiligen Modul. Kündigungsfristen und Testphasen werden bis sieben Tage im Voraus berücksichtigt. Die App speichert optionale Kategorieeinstellungen lokal. Liquiditätshinweise bleiben sichtbar, und der globale diskrete Modus blendet den gesamten Bereich aus. Damit ist die lokale Ansicht verfügbar. Externe Push-Zustellung und Meldungen aus noch unkonfigurierten Diensten sind weiterhin offen.

Die neuen Oberflächen benötigen keine zusätzliche Datenbankmigration. Individuelle Titelbilder, der vollständige Berichtsgenerator und der KI-Assistent sind weiterhin offen. Live-Banking bleibt unkonfiguriert.

Geprüft wurden 32 Unit-Tests, 15 Edge-End-to-End-Tests, die zwei neuen Abläufe in WebKit, TypeScript, Lint und der Produktionsbuild. Die Layoutmatrix deckte 18 Ansichten, 30 Viewports und beide Farbmodi ab. Die Sparzielansicht wurde zusätzlich bei 320 CSS-Pixeln und 150 Prozent Schrift geprüft. Die gepackte Windows-App bestand zwei Startprüfungen mit isolierter SQLite-Datenbank. Ein separater Test mit dem gepackten Server hat ein Sparziel erstellt und die zu einem negativen Testsaldo erzeugte Meldung angezeigt.

Das geprüfte lokale Setup liegt unter `release/windows/0.5.0/sparziele-20261125/MoreMoney-Setup-0.5.0.exe`. SHA-256 `0450CCC178269302B95150F3068D598560672F71B6F4874F1858D6ACD01EC7F3`. Das Setup ist unsigniert. Es wurde keine IPA erstellt.

## Stand vor dem Systemaudit

Noch nicht abgeschlossen, keine IPA erzeugen. Nutzer hat keinen Bankanbieterzugang; zuerst lokale Dateiimporte und sichtbarer Status Nicht konfiguriert. Neue Anforderungen zusätzlich in MASTER-PROMPT-ANALYSE-SPARZIELE.md und MASTER-PROMPT-INTELLIGENCE.md. Frühere Aufträge Raten/Darlehen, Aktien/ETF-Autovervollständigung und Profilblockentfernung bleiben Teil des Projekts.

Implementiert im Arbeitsbaum: Migration 006 für Abos, Vermögen, Bankimporte, Dokumente, Datenschutz; Migration 007 für Sparhistorie, Kategoriesplits, Ausgabenbudgets, Datenqualität, Health-Historie, Insights und Navigation. Vor Schemaänderungen VACUUM-INTO-Sicherung. UI-Module subscriptions/wealth/bank/privacy-center mit echtem CRUD; SecurityGate, iron-session-Sitzungen, Scrypt-Passphrase, OTPAuth-TOTP und Einmalcodes, OS-geschützter Electron-Masterkey für verschlüsselte Sicherheitsdatei/Dokumente. Vollständige Backup-Tabellenregistrierung und AES-GCM-Export/Restore; Aktiv-Datenbank noch unverschlüsselt, nicht als umfassend verschlüsselt bezeichnen.

Tests bisher: 31 Unit-Tests bestanden (vor letztem zusätzlichen Vertragstest), zwei Finance-OS-Playwright-Abläufe bestanden (Importidempotenz, Pending→Booked→Undo, Abo-/Assetpersistenz, fehlende FX, doppelte Kontoverknüpfung, Privacy Mode). TypeScript/Lint hatten zuletzt kleinere Typ-/Importfehler, inzwischen behoben, erneut ausführen. Sicherheitsfunktionen (Login/MFA/Restore/Löschung) müssen noch eigene isolierte End-to-End-Tests erhalten.

Neue reine Rechenkerne: exact.ts (rationale BigInt-Arithmetik), health-score.ts (exakte vorgegebene Gewichtungen, lineare Kurven, Teilgewicht-Abdeckung, Score erst ab 50%), savings-math.ts, spending-budgets.ts, analysis-periods.ts. intelligence-state.ts bereitet deren Daten vor, ist noch nicht fertig integriert. Fehlende klassifizierte Einkommen dürfen nicht als negative Cashflow-Monate eingehen; dieser Punkt wurde bereits korrigiert. Keine frei erfundenen Datenabdeckungen oder Scores.

Nächste Schritte: typisierte /api/intelligence-Aktionen für Analyse, Sparziele, Datendeckung und lokale Tools; tatsächliche Analyse-, Sparziel-, Health- und Assistenz-Ansichten; Benachrichtigungen und Navigation integrieren. Datenschutz/Backup/Sitzungen mit Fehlerpfaden testen. Aktive DB-Verschlüsselung nur mit getesteter SDK-Unterstützung und sicherer Sicherungs-/Umschaltstrategie, bestehende Daten niemals ohne Nutzeraktion umschreiben. XML/CAMT Sammelbuchungen derzeit bewusst abgelehnt; keine stille falsche Aufteilung.

Aktive Baseline: öffentliches Repo SimonKoesi/MoreMoney. Automatischer iOS-Workflow darf nur Tests ausführen; IPA benötigt workflow_dispatch build_ipa=true UND neue Nutzerfreigabe. Letzte vollständige 0.5-Windows-Paketierung lief in eigenem release/windows/0.5.0/build-20261125, weil altes win-unpacked/MoreMoney.exe gesperrt war; keine fremden/Benutzerprozesse beenden. Neues großes Modulprojekt ist noch nicht als Setup freigegeben und noch nicht vollständig veröffentlicht.
