# MoreMoney 0.5.1

## Bankkonten und Depots

Das Bankenverzeichnis sucht nach Name, Ort, PLZ, BLZ, BIC oder Bankengruppe. MoreMoney lädt die aktuell gültige TXT-Datei auf Anfrage und speichert sie lokal. Bei einem Netzfehler lässt sich die TXT-Datei manuell auswählen. Die Verbindungsaktion verlangt eine eindeutige Entsprechung beim eingerichteten Anbieter. [Deutsche Bundesbank](https://www.bundesbank.de/de/aufgaben/unbarer-zahlungsverkehr/serviceangebot/bankleitzahlen/download-bankleitzahlen-602592)

| Institute | Verfügbarkeit in MoreMoney |
| --- | --- |
| Regionale Sparkassen | Suche im Verzeichnis. Lesende Kontoinformation nach Anbieterfreigabe. Enable Banking dokumentiert die Anbindung ohne Kreditkartenkonten. |
| Regionale Volksbanken und Raiffeisenbanken | Suche im Verzeichnis. Lesende Kontoinformation nach Anbieterfreigabe. Die Genossenschaftsgruppe ist mit Sandbox dokumentiert. |
| Commerzbank, Deutsche Bank, Postbank, HypoVereinsbank, ING, DKB | Der Anbieter dokumentiert die Institute. MoreMoney verwendet die für die konkrete Anwendungs-ID verfügbaren Angebote. |
| Targobank, Santander, Sparda-Banken, PSD Banken, BBBank, GLS Bank, UmweltBank | Onlinezugriff je Institut unbestätigt. Dateiimport für kompatible Kontoauszüge. |
| comdirect, Consorsbank, norisbank, 1822direkt, C24, N26, Revolut, bunq, Tomorrow, Openbank | Onlinezugriff je Institut unbestätigt. Dateiimport für kompatible Kontoauszüge. |
| Trade Republic | Kontoinformation beim Anbieter dokumentiert. Eingeschränkte Umsatzdetails. Depotbestand über die MoreMoney-CSV-Vorlage. |
| Scalable Capital | Transaktions-CSV laut Broker verfügbar. MoreMoney importiert Bestände im eigenen Format. |
| Interactive Brokers | Offizielle Reporting- und Portfolio-APIs vorhanden. Direkter Anschluss ausstehend. Bestandsimport über die MoreMoney-Vorlage. |
| finanzen.net ZERO, flatex, DEGIRO, Smartbroker+, Traders Place, Deka, Union Investment, Fidelity | Direkte Live-Anbindung noch unverifiziert. Bestandsimport nach Umwandlung in die MoreMoney-Vorlage. |
| PayPal, Klarna | Direkte Live-Anbindung noch unverifiziert. Bankbuchungen können den Zahlungsdienstleister ausweisen. |
| Coinbase, Kraken, Binance | Offizielle Kontodaten-APIs vorhanden. Direkter Anschluss ausstehend. Manuelle Vermögenswerte verfügbar. |

[Enable Banking Deutschland](https://enablebanking.com/docs/markets/de/) · [Scalable Capital zum Export](https://help.scalable.capital/en/account-management-f3197dc7/can-i-export-information-about-my-portfolio-such-as-a-cs-4f77cde3) · [Interactive Brokers](https://www.interactivebrokers.com/docs/web-api/account-management/resources/developer-tool-kit) · [Coinbase](https://coinbase.github.io/coinbase-advanced-py/coinbase.rest.html) · [Kraken](https://docs.kraken.com/api/docs/rest-api/get-account-balance/) · [Binance](https://developers.binance.com/en/docs/catalog)

Die Live-Prüfung der konkreten Konten steht aus. Einrichtung, Anwendungs-ID, PEM und HTTPS-Rücksprungadresse stehen in der [Anleitung](BANKANBINDUNG.md). Enable Banking bietet eine Sandbox und eingeschränkte Aktivierung für eigene Konten an. In der allgemeinen Produktion richten sich die Kosten nach Volumen und Mindestabrechnung. FinTS verlangt eine Produktregistrierung. Weitere Anbieter und öffentliche Bereitstellung brauchen gesonderte Prüfung. [Enable Banking zu Preisen](https://enablebanking.com/docs/faq#how-much-does-it-cost-to-use-the-enable-banking-api) · [FinTS-Registrierung](https://www.fints.org/de/hersteller/produktregistrierung) · [finAPI-Preise](https://www.finapi.io/preise/)

Der optionale Bankabruf läuft bei sichtbaren Bankkonten. Die nächste planmäßige Aktualisierung ist nach sechs Stunden fällig. Fehler lösen exponentielle Wartezeiten von höchstens 60 Minuten aus. Die fünf jüngsten Versuche bleiben je Verbindung sichtbar. Der letzte gültige Kontostand bleibt verfügbar. Der Zugriff umfasst gebuchten Saldo und gebuchte Umsätze.

**Vermögen → Depots** verarbeitet Depotname, Bewertungsdatum, ISIN, Stückzahl, Gesamteinstandswert, Gesamtmarktwert, Währung und Kategorie. Vorschau und Korrektur erfolgen vor dem Import. Dieselbe ISIN im gleichen Depot aktualisiert die bestehende Position. Ältere Stände werden übersprungen. Fehlende Positionen bleiben erfasst und lassen sich archivieren. Bereits manuell erfasste Positionen vor dem Import abgleichen.

Depotergebnis ist importierter Marktwert minus Einstandswert in derselben Währung. PDF-Abrechnungen, Trades, Dividenden, Splits, Benchmark, Zeit- und Geldgewichtung brauchen eigene Importformate und Daten. Watchlist-Kurse und Depotstückzahlen stammen aus getrennten Quellen. [Twelve Data Handelsplätze und Tarifabdeckung](https://twelvedata.com/exchanges)

## Buchungen und Händler

Der lokale Abgleich nutzt Aliasnamen, normalisierte Buchungsfelder und Zahlungsdienstleister-Präfixe. Ein eindeutiger Alias wird angezeigt. Widersprüchliche oder unscharfe Hinweise werden zur Prüfung angeboten. Der Matchwert bewertet die Evidenz der Zuordnung. Einzelkorrekturen und eigene Regeln haben Vorrang. Die Regelvorschau zählt passende Einträge in den jüngsten 5.000 Buchungen. Im Qualitätscenter lassen sich Regeln entfernen.

Eigene PNG-, JPEG- und WebP-Logos werden geprüft und lokal als kleines PNG gespeichert. Ohne Bild erscheinen Initialen oder Symbole. Externe Markendienste sind nicht verbunden. Ihre Cache-Rechte und Bedingungen unterscheiden sich je Produkt. [Logo.dev](https://www.logo.dev/pricing) · [Brandfetch](https://brandfetch.com/terms?mode=dev)

Migration 008 ergänzt originalPurpose in Transaction sowie MerchantLabel und DataQualitySnapshot. Neue Bankimporte halten den Verwendungszweck getrennt von bearbeitbaren Notizen. Historische Buchungen behalten ihre vorhandenen Felder. Vor der additiven SQLite-Migration erstellt der Laufzeit-Migrator eine Sicherung. Export, Wiederherstellung und Datenlöschung erfassen die neuen Tabellen.

## Datenqualität und Dashboard

| Bereich | Gewicht | Rechnung |
| --- | ---: | --- |
| Vollständigkeit | 30 % | Gültige Kernfelder je gebuchter Zeile. Fehlende Wechselkurse fließen ein. |
| Aktualität | 25 % | Bankkonto 1 Tag, Depot-CSV 30 Tage, sonstige Bewertung 90 Tage. Danach linearer Rückgang bis zum Doppelten der Frist. Fehlgeschlagene Abrufe und abgelaufene Freigaben zählen mit null. |
| Konsistenz | 25 % | Positive Beträge, gültiges Buchungsdatum und passende Kontowährung. |
| Kategorisierung | 10 % | Erfasste Kategorien und eindeutige Händlerzuordnung bei Ausgaben. |
| Duplikatprüfung | 10 % | Konto, Tag, Richtung, Betrag, Währung und normalisierter Empfänger. Abzug nach Gruppengröße und Betragsklasse. |

Der Index normiert auf prüfbare Bereiche. Diese ergeben höchstens 80 Punkte Abdeckung. Bestätigte Vollständigkeit der Konten und Schulden trägt je 10 Punkte bei. Unter 50 % bleibt der Index leer, unter 80 % erscheint er als vorläufig. Bei einer Stichprobe von 5.000 Buchungen liegt die Abdeckung höchstens bei 79 %. Ähnliche Buchungen und mögliche Kontoüberträge werden zur Prüfung angezeigt.

Der Health Score behält seine eigene Gewichtung. Veraltete Onlinekonten sperren die davon abhängigen Teilbewertungen. Der frei verfügbare 14-Tage-Betrag im Dashboard setzt bestätigte Konten und Verpflichtungen, bewertbare Guthaben und aktuelle Daten voraus. Er berücksichtigt zweckgebundene Beträge, bekannte Zahlungen und die Sicherheitsreserve.

## Grenzen

Die App verwendet lokal SQLite. Verschlüsselte Anbieterdaten, der diskrete Modus und die bestehende Sitzungssperre schützen die Bankverbindung und die neuen Ansichten. Eine Verschlüsselung der gesamten Datenbank, Mehrbenutzerbetrieb, Broker-Live-Anschlüsse, automatisierte Markenlogos, separate native iOS-Ansichten und ein vollständiger Finance-OS-Audit bleiben offen. Für diese Erweiterung sind keine neuen Umgebungsvariablen erforderlich.

Die vollständige Finance-OS-2.0-Roadmap enthält weitere unvollständige Bereiche. Dazu gehören Portfolio-Renditen mit historischen Mittelflüssen, Dividenden und Benchmarks, eine durchgängige globale Finanzautomatisierung, ein persönlicher Inflationsindex und ein Jahresrückblick.

## Prüfprotokoll

- 54 Unit-Tests bestanden, darunter Bankadapter, Depotdaten, Händlererkennung und Qualitätsbewertung.
- 22 Edge-Browsertests bestanden, inklusive Layoutprüfung an 30 Viewports sowie Bildbackup, Einkaufsliste, Depotimport und Datenschutz.
- 4 gezielte WebKit-Browsertests bestanden. Die responsive Webansicht wurde mit iPhone-Maßen geprüft. Die native App und die bankseitige App-Weiterleitung auf einem realen iPhone stehen aus.
- Der Parser las 13.742 Einträge der offiziell veröffentlichten Bankleitzahlendatei. Die Live-Freigabe persönlicher Konten steht aus. Die Bankfreigabe im Browsertest nutzt simulierte Anbieterantworten.
- Der gepackte Desktop-Build startete zweimal nach einem Start mit Version 0.5.0. Die synthetische SQLite-Datenbank blieb erhalten. Der lokale Dienst wies Zugriffe ohne gültigen App-Token ab.
