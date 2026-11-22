# Prüfprotokoll

Stand: 22. November 2026. Windows x64, Node 24.19.0.

Version 0.4: 14 Fach-/Validierungstests und vier Browserabläufe bestanden. Neu geprüft: Aktien anlegen, Favoritenfilter, Gruppen/Notizen/Ziele, zwei persistierte Tageskurse und Diagramm, exakte Mikroeinheiten, idempotente Tageskorrektur, Sperre nachträglicher Währungsänderung bei vorhandenen Kursen, Watchlist im Backup und unveränderte Konten/Transaktionen. Die schmale Watchlist-Ansicht wurde als Screenshot angesehen. Providerdaten werden mit isolierten Antwortbeispielen geprüft; mangels persönlichem API-Zugang wurde kein echter Onlinekursabruf durchgeführt.

Der Produktionsbuild und NSIS-Build für 0.4 sind erfolgreich. Desktop-Kompatibilitätstest: MoreMoney 0.3 erzeugt ein Testkonto in einem separaten Verzeichnis; MoreMoney 0.4 ergänzt Migration 002, findet das alte Konto unverändert und meldet die Watchlist-Tabellen als bereit. Auch nach einem weiteren Neustart bleiben Daten vorhanden; nicht authentifizierter API-Zugriff liefert 403.

Version 0.3: MoreMoney-Rebranding. Das Originalbild wurde unverändert als PNG übernommen (identische SHA256-Prüfsumme); das Windows-ICO enthält sieben Größen von 16 bis 256 Pixel. appId und der bisherige Datenspeicher `%APPDATA%/finova/data` bleiben erhalten. Die Browserprüfung umfasst zusätzlich Fenstertitel, Markenname und tatsächlich geladenes Icon.

Die gepackte Windows-EXE meldet MoreMoney als Produktname und Dateibeschreibung; ihr eingebettetes Icon wurde extrahiert und visuell geprüft. Kompatibilitätstest bestanden: FINOVA 0.2 legt ein Testkonto in einem isolierten Verzeichnis an, MoreMoney 0.3 liest denselben Datenbestand und findet ihn auch nach erneutem Neustart wieder. Echte Nutzerdaten wurden dabei nicht verändert.

- TypeScript Strict Mode: bestanden.
- ESLint: Anwendung geprüft; generierte Desktop-Stagingdateien sind ausgeschlossen.
- Vitest: neun Tests bestanden. Dezimalparser, Teilzahlungen, Restbudget, aktive Alternativen, Überzahlungen, Transfers, Fixkostenintervalle, Prognoselücke, Origin-/URL-/Betragsvalidierung.
- Playwright mit Edge: drei Tests bestanden. Konto/Budget/Position anlegen, unabhängige Checkliste ohne Buchung, Anzahlung und Restzahlung, persistenter Bild-Upload, Neuladen, schmale Ansicht ohne horizontales Überlaufen. Bausteinprüfung für Pflichtfeldfokus im Stepper, erhaltene Werte beim Zurückgehen, Abbruch ohne Buchung, native Radiofilter, Pfeiltasten/Home-End im Tab-Muster, verknüpftes Tabpanel, Direktaufruf, aktive Dockmarkierung nach Zurücknavigation sowie deaktivierte Animation bei reduzierter Bewegung. API-Test für wiederholte Buchung, atomare Transferseiten, fremde Origin, Löschschutz verknüpfter Zahlungen, ungültigen Upload und Bilddaten im JSON-Backup.
- Desktop- und Mobilansicht als Screenshots angesehen. Keine manuelle Screenreaderprüfung durchgeführt.
- Die Releaseversion 0.2 verwendet einen eigenen Ausgabeordner unter release/0.2.0. Dadurch wird eine eventuell noch geöffnete ältere Vorschau nicht überschrieben oder beendet. Desktoptests verwenden auch für die Electron-Instanz ein eigenes Benutzerverzeichnis.
- Next.js-Produktionsbuild: bestanden. Statische Oberfläche und dynamische APIs erzeugt.
- NSIS-Installer: tatsächlich erzeugt. Das endgültige Paket enthält die ausdrücklich kopierten Standalone-Servermodule und plattformspezifischen SQLite-/Bildmodule; ein eigener MoreMoney-Icon ist eingebettet.
- Gepackte MoreMoney.exe zweimal gestartet: Oberfläche geladen, Konto in separater SQLite-Datenbank angelegt und nach vollständigem Prozessneustart wiedergefunden. Zugriff auf den lokalen API-Dienst ohne Sitzungstoken liefert 403. Der Test meldete beide Starts erfolgreich. Eine vom Entwicklungswerkzeug geerbte ELECTRON_RUN_AS_NODE-Variable wird ausschließlich aus der Umgebung des Testprozesses entfernt.
- Produktive Abhängigkeiten: npm audit --omit=dev meldet null bekannte Befunde nach kompatiblem effect-Patch. Der vollständige Audit meldet sechs moderate Befunde in electron-builder/Packaging-Abhängigkeiten; sie betreffen Entwicklungs-/Buildwerkzeuge, nicht den separaten Desktop-Server. Kein ungeprüfter Major-Downgrade zur bloßen Bereinigung der Audit-Ausgabe.

Grenzen: Keine Signatur, kein öffentlicher Serverbetrieb, keine echte Bank-/Steuerprüfung. Eine vollständige interaktive Installation mit Windows-Dialogen und Deinstallation wird nicht als getestet behauptet. Der Desktop-Smoke-Test verwendet ausschließlich eine separate temporäre SQLite-Datenbank.
