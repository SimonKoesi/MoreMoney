# FINOVA – Entwicklungsauftrag für die Windows-Desktop-App

Entwickle FINOVA: „Dein Geld. Deine Pläne. Dein Überblick.“ Verbindliches Endartefakt ist ein tatsächlich gebauter Windows-x64-Installer `FINOVA-Setup-<Version>.exe`, keine reine Website. Verwende die persönlichen Programmierstandards aus AGENTS.md und bedarfsabhängig den Skill ui-bausteine. Rollen sind Perspektiven für Produkt, Architektur, UI, Entwicklung und QA; sie verlangen keine Agentendelegation.

## Ziel und Architektur

Eine offline nutzbare Einzelbenutzer-Finanz-, Budget- und Projektplanungs-App ohne Cloud-Konto oder kostenpflichtigen Dienst. Next.js App Router, React, striktes TypeScript, Tailwind, zugängliche shadcn-/Radix-Muster, Lucide, Recharts, Prisma und SQLite. Electron kapselt den lokalen Server und erzeugt über electron-builder einen NSIS-Installer. Ausschließlich stabile kompatible Versionen verwenden und per Lockfile fixieren.

Der lokale Server bindet ausschließlich 127.0.0.1. Die Desktop-App authentifiziert interne Zugriffe mit einem pro Start zufälligen Sitzungstoken; Mutationen überprüfen zusätzlich Origin. Renderer: kein Node-Zugriff, Kontextisolierung, Sandbox, keine fremde Navigation. Externe Produktlinks dürfen nur HTTP(S) öffnen. Keine ungefragte Veröffentlichung der Einzelbenutzer-App.

SQLite, Uploads und spätere Backups liegen außerhalb des Installationsverzeichnisses im Benutzerprofil. Updates und Deinstallation dürfen Finanzdaten nicht ungefragt löschen. Datenbankänderungen benötigen versionierte, transaktionale Migrationen. Der Installer muss Node und Laufzeit mitbringen; Endnutzer benötigen kein Terminal und keine separat installierte Entwicklungsumgebung.

## Verbindliche Finanzregeln

- Alle Beträge als Integer-Cent; dezimale Eingaben ohne unkontrollierte Float-Arithmetik parsen. Deutsches Format, EUR.
- Kontostand = Anfangsbestand + gebuchte Einnahmen − Ausgaben ± eigene Transfers. Beide Transferseiten atomar speichern und nicht in Konsum-/Einkommensstatistik zählen.
- Planung, Bestellstatus, Aufgabenstatus und Zahlungen sind unabhängig. Abhaken und Moodboards erzeugen niemals Buchungen.
- Tatsächlich bezahlt wird ausschließlich aus verknüpften Zahlungen summiert. Teilzahlungen nicht zusätzlich mit einem Produktpreis zählen.
- Offener Plan pro Position = max(0, aktive geplante Gesamtkosten − Positionszahlungen). Erwartete Gesamtkosten = bezahlt + offene Pläne; tatsächlicher Budgetrest und prognostizierter Rest getrennt anzeigen. Direkte Budgetzahlungen zusätzlich genau einmal einbeziehen.
- Nur die ausgewählte Produktalternative zählt im Plan. Reserven reduzieren den Planungswert, niemals automatisch einen Kontostand.
- Wiederkehrende Zahlungen sind bis zur tatsächlichen Buchung Planwerte. Buchungsanforderungen mit stabilen Idempotenzschlüsseln gegen Wiederholung schützen.
- Prognosen zeigen Annahmen und Auslassungen. Keine ungesicherte Aussage zur Leistbarkeit. Kein erfundener Brutto-Netto-Rechner: erst nach dokumentierter, steuerjahrspezifischer Berechnungsgrundlage ergänzen; tatsächliches Netto hat Vorrang.

## Gestaltung und Bausteinauswahl

Ruhiges Navy/Anthrazit mit einem Türkis-Akzent, konsistente Abstände, systemnahe Typografie, klarer Fokus, Light/Dark Mode. Pro Ansicht ein Titel und höchstens eine hervorgehobene Hauptaktion. Der Slogan gehört zur Marke, nicht als wiederholter Untertitel in jede Ansicht.

MagicBento-Muster für responsive Übersichten; Dock-Prinzip für konsistente Hauptnavigation; RubberSegment für direkte Ansichtswechsel; JellyRadio für Einzelauswahlfilter; SpringCheck für echte unabhängige Checkboxzustände; Folder-Prinzip für Budgets/Projekte. Kein Zwang, alle elf Bausteine einzubauen: CodeSlots hat ohne Authentifizierungsablauf keinen Zweck, ein HoldButton ist für gewöhnliche Aktionen ungeeignet. Effekte bleiben kurz und optional; native Semantik, Tastatur und reduzierte Bewegung gehen vor Dekoration.

Alle sichtbaren Aktionen müssen funktionieren. Sinnvolle Leerzustände und optional ausdrücklich gekennzeichnete Demodaten. Keine erfundenen Kennzahlen, funktionslosen Navigationspunkte oder vorgetäuschten Premiumfunktionen. Entwürfe bleiben bei Validierungs-/Speicherfehlern erhalten. Bilder serverseitig anhand Dateisignatur, Typ und Größe prüfen; UUID-Dateinamen und kontrollierte Speicherpfade verwenden.

## Umsetzung in überprüfbaren Phasen

1. **Installierbarer Kern:** Projektsetup, Designsystem, lokale Datenbank/Migration, Einstellungen, Konten, Einnahmen, Ausgaben, Transfers, Dashboard, freie Budgets, Positionen, Checklisten, Teilzahlungen und getrennte Prognosewerte.
2. **Visuelle Planung:** persistente Bilder, sichere Produktlinks, Galerie, Alternativen, unabhängiger Bestellstatus, Projekte/Aufgaben. Alle Ansichten greifen auf dieselben Daten zu.
3. **Finanzplanung:** wiederkehrende Planwerte, Sparziele, transparente Kauf-/Liquiditätssimulation. Danach Kalender, Verträge mit Fristen, Einkommensentwicklung und Szenarien.
4. **Erweiterungen:** vollständige Backup-Wiederherstellung mit Vorschau/Validierung, CSV-Import, Moodboards, Budgetvarianten, Vorlagen, Belege, Benachrichtigungen und Dashboard-Reihenfolge. Originalanforderungen bleiben als Roadmap in MASTER-PROMPT-ORIGINAL.md erhalten.
5. **Freigabe pro Version:** Typecheck, Lint, finanzielle Regressionstests, wichtige E2E-Abläufe, DB-Persistenz nach Neustart, Dateivalidierung, responsive Ansicht, Produktionsbuild und tatsächlicher Desktop-Starttest. Installer erzeugen, Hash dokumentieren, Quellcode in einem neuen privaten GitHub-Repository committen und pushen. Keine echten Finanzdaten oder Zugangsdaten committen.

Qualität nicht bis zur letzten Phase aufschieben. Liefere eine klar abgegrenzte benutzbare Version und dokumentiere in STATUS.md vollständig/teilweise/offen. Arbeite selbstständig; gib nur tatsächlich ausgeführte Prüfungen als bestanden an. Verändere keine anderen Projekte. Ein öffentliches Hosting, Bankanbindung, externe KI-Übermittlung und kostenpflichtige Signierung sind ohne gesonderten Auftrag nicht umfasst.
