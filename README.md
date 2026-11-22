# MoreMoney für Windows


Lokaler Finanz-, Budget- und Projektplaner mit persönlicher Aktien-Watchlist. Zielartefakt: `release/0.4.0/MoreMoney-Setup-0.4.0.exe` für Windows x64. Ohne Cloud-Konto, Bankanbindung oder externe KI. Der Installer enthält die Laufzeit; Endnutzer brauchen kein Node.js.

[Aktien-Watchlist](docs/AKTIEN-WATCHLIST.md): eigene Aktien, Favoriten, Gruppen, Zielkurse und Verlauf; manuelle Kurse offline, optionale Onlineabrufe über einen eigenen Twelve-Data-Zugang.

## Benutzen

Setup-Datei starten, Installationsort wählen, MoreMoney öffnen. Ein Konto mit Anfangsbestand anlegen und danach Buchungen oder Budgets erfassen. Optional lassen sich in einer leeren Datenbank ausdrücklich markierte Demodaten laden. Eine abgehakte Position ist keine Zahlung; Zahlungen werden separat erfasst, einschließlich Teilzahlungen.

Finanzdaten und Bilder bleiben unter `%APPDATA%/finova/data` außerhalb des Installationsordners. Unter Einstellungen regelmäßig das vollständige JSON-Backup einschließlich Bilder herunterladen. Updates entfernen diese Daten nicht. Version 0.1 ist eine lokale Einzelbenutzer-App und darf nicht öffentlich als Server betrieben werden. Ohne Signatur kann Windows vor einem unbekannten Herausgeber warnen; es wird keine Signatur vorgetäuscht.

## Entwicklung

Node.js 24 LTS, npm und Windows x64. PowerShell bei blockierten npm-Skripten mit `npm.cmd` verwenden.

```powershell
npm.cmd ci
npx.cmd prisma generate
npm.cmd run dev
```

Web-Entwicklung nur auf `http://127.0.0.1:3000`; lokale Daten dann unter `data/`. Die App führt beim ersten Datenzugriff die versionierte Initialmigration aus. Keine echten Daten für Tests verwenden.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd run desktop:build
```

Bei einer Umgebung, die npm-Installationsskripte blockiert, die erforderliche Electron-Laufzeit gezielt mit `node node_modules/electron/install.js` installieren. Die Sicherheitsrichtlinie muss dafür nicht global deaktiviert werden. `node scripts/smoke-desktop.cjs` prüft anschließend die gepackte EXE zweimal mit separaten Testdaten, einschließlich Persistenz und Tokenzugriffsschutz.

Der Desktop-Build erzeugt erst Next.js Standalone, kopiert Assets und Migrationen und baut einen NSIS-Installer. Die Electron-Hülle startet einen lokalen, auf 127.0.0.1 beschränkten Dienst mit zufälligem Sitzungstoken, isoliertem Renderer und deaktiviertem Node-Zugriff. Projektdateien, Datenbank und Uploads niemals mit dem Entwicklungsserver ins Internet stellen.

Weiterentwicklung: [angepasster Master-Prompt](docs/MASTER-PROMPT.md), [Status und Grenzen](docs/STATUS.md), [Berechnungen](docs/BERECHNUNGEN.md), [Prüfprotokoll](docs/PRUEFUNGEN.md). UI-Muster werden im vorhandenen React-Stack umgesetzt; die mitgelieferten Python-Vorlagen dienen nur als Verhaltensreferenz.
