# MoreMoney Push

Der getrennte Dienst prüft aktivierte iPhone-Kursalarme auch bei geschlossener App. Ein Dienst wird mit einem iPhone gekoppelt. Er erhält den Apple-Gerätetoken, Symbol, Börse, Währung, Richtung und Zielkurs. Die Sperrbildschirm-Nachricht enthält weder das Symbol noch einen Geldbetrag. Die Registrierungsdatei ist verschlüsselt.

## Einrichtung

1. Für die App-ID `de.moremoney.ios` im eigenen Apple-Developer-Team Push Notifications aktivieren. Ein passendes Signierungsprofil für das iPhone und einen APNs-Schlüssel für den betreffenden APNs-Dienst erstellen. Die iOS-Projekteinstellung `MOREMONEY_APNS_ENV` muss dem Profil entsprechen (`development` oder `production`).
2. Den Relay auf einem eigenen laufenden Host mit Node.js 24 ausführen. Er bindet standardmäßig ausschließlich an `127.0.0.1:8787`. Einen HTTPS-Reverse-Proxy für `/v1/device` davor setzen. Keine Autorisierungsheader oder Anfragekörper protokollieren. Das Datenverzeichnis und die Schlüssel nur für den Dienst freigeben.
3. Die unten genannten Variablen in der Serverumgebung setzen und `node platforms/push/relay.mjs` starten. Für Kopplung und Speicherung zwei unabhängige Zufallswerte verwenden. `node -p "require('node:crypto').randomBytes(32).toString('hex')"` erzeugt einen davon. Die Schlüssel gehören weder ins Repository noch in die Chat-Nachricht.
4. In der signierten iPhone-App unter **Mehr → Kursalarme per Push** die HTTPS-Adresse und den Kopplungsschlüssel eingeben. Mitteilungen erlauben und kontrollieren, dass der Status **Verbunden** erscheint. Bestehende Kursalarme aus der iPhone-Watchlist werden übertragen. **Verbindung trennen** entfernt die Registrierung auf dem Server.

| Umgebungsvariable | Verwendung |
| --- | --- |
| `MOREMONEY_PUSH_PAIRING_KEY` | Starker Kopplungsschlüssel für den HTTPS-Endpunkt |
| `MOREMONEY_PUSH_STORAGE_KEY` | Separater 256-Bit-Schlüssel in Hex für den verschlüsselten Zustand |
| `MOREMONEY_APNS_TEAM_ID`, `MOREMONEY_APNS_KEY_ID` | Apple-Team und Schlüssel-ID |
| `MOREMONEY_APNS_KEY_FILE` | Pfad zur privaten `.p8`-Datei auf dem Host |
| `MOREMONEY_APNS_ENV` | `development` oder `production`, passend zum iPhone-Profil |
| `MOREMONEY_APNS_TOPIC` | Optional, standardmäßig `de.moremoney.ios` |
| `MOREMONEY_TWELVE_DATA_KEY` | Serverzugang für den Kursabruf |
| `MOREMONEY_PUSH_STATE_FILE` | Optionaler Pfad für den verschlüsselten Zustand |
| `MOREMONEY_PUSH_INTERVAL_MS`, `MOREMONEY_PUSH_PORT` | Optional, standardmäßig 5 Minuten und 8787 |

Der Dienst prüft bis zu 30 aktive Regeln. Pro Durchlauf wird dasselbe Instrument nur einmal abgerufen. Limits und Verzögerungen hängen vom Twelve-Data-Zugang ab. Bei Netzausfall werden Änderungen beim nächsten erfolgreichen Öffnen oder Synchronisieren des iPhones übernommen. Der Server ersetzt die letzte Registrierung bei erneuter Kopplung. APNs stellt nach eigener Verfügbarkeit zu.

`node --test platforms/push/relay.test.mjs` prüft Kopplung, Trennen und Kursübergänge ohne echte Marktdaten oder Mitteilungen. Separat ist eine signierte Installation auf einem echten Gerät mit eigenen APNs-Daten zu prüfen.

[Apple-Registrierung](https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns) · [Apple-Serveranfragen](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns) · [Twelve Data](https://twelvedata.com/docs)
