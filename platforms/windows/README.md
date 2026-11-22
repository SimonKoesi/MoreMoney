# Windows-Setup

Electron-Einstieg: `desktop/main.cjs`. Die gemeinsamen Next.js-/React-Dateien unter `src/` und das Prisma-Schema im Repository-Stamm bilden diese Windows-Anwendung.

Im Repository-Stamm `npm.cmd ci` und `npm.cmd run desktop:build` ausführen. Die Ausgabe liegt unter `release/windows/<Version>/MoreMoney-Setup-<Version>.exe`. Daten verbleiben aus Kompatibilitätsgründen unter `%APPDATA%/finova/data`.

Die iPhone-App ist separat unter `platforms/ios` implementiert. Es gibt keine automatische Synchronisierung oder ungefragte Cloudübertragung zwischen Geräten.
