# Prüfprotokoll

Stand: 22. November 2026. Windows x64, Node 24.19.0.

- TypeScript Strict Mode: bestanden.
- ESLint: Anwendung geprüft; generierte Desktop-Stagingdateien sind ausgeschlossen.
- Vitest: neun Tests bestanden. Dezimalparser, Teilzahlungen, Restbudget, aktive Alternativen, Überzahlungen, Transfers, Fixkostenintervalle, Prognoselücke, Origin-/URL-/Betragsvalidierung.
- Playwright mit Edge: zwei Tests bestanden. Konto/Budget/Position anlegen, unabhängige Checkliste ohne Buchung, Anzahlung und Restzahlung, persistenter Bild-Upload, Neuladen, schmale Ansicht ohne horizontales Überlaufen. API-Test für wiederholte Buchung, atomare Transferseiten, fremde Origin, Löschschutz verknüpfter Zahlungen, ungültigen Upload und Bilddaten im JSON-Backup.
- Desktop- und Mobilansicht als Screenshots angesehen. Keine manuelle Screenreaderprüfung durchgeführt.
- Next.js-Produktionsbuild: bestanden. Statische Oberfläche und dynamische APIs erzeugt.
- NSIS-Installer: tatsächlich erzeugt. Das endgültige Paket enthält die ausdrücklich kopierten Standalone-Servermodule und plattformspezifischen SQLite-/Bildmodule; ein eigener FINOVA-Icon ist eingebettet.
- Gepackte FINOVA.exe zweimal gestartet: Oberfläche geladen, Konto in separater SQLite-Datenbank angelegt und nach vollständigem Prozessneustart wiedergefunden. Zugriff auf den lokalen API-Dienst ohne Sitzungstoken liefert 403. Der Test meldete beide Starts erfolgreich. Eine vom Entwicklungswerkzeug geerbte ELECTRON_RUN_AS_NODE-Variable wird ausschließlich aus der Umgebung des Testprozesses entfernt.
- Produktive Abhängigkeiten: npm audit --omit=dev meldet null bekannte Befunde nach kompatiblem effect-Patch. Der vollständige Audit meldet sechs moderate Befunde in electron-builder/Packaging-Abhängigkeiten; sie betreffen Entwicklungs-/Buildwerkzeuge, nicht den separaten Desktop-Server. Kein ungeprüfter Major-Downgrade zur bloßen Bereinigung der Audit-Ausgabe.

Grenzen: Keine Signatur, kein öffentlicher Serverbetrieb, keine echte Bank-/Steuerprüfung. Eine vollständige interaktive Installation mit Windows-Dialogen und Deinstallation wird nicht als getestet behauptet. Der Desktop-Smoke-Test verwendet ausschließlich eine separate temporäre SQLite-Datenbank.
