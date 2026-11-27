# Bankanbindung in MoreMoney für Windows

Die Einrichtung unten beschreibt Version 0.5.1. In 0.5.2 ist sie in der Oberfläche ausgeblendet. Lokale Konten und Dateiimport sind weiterhin verfügbar. Bereits erteilte Onlinefreigaben lassen sich im Datenschutz widerrufen.

MoreMoney kann über Enable Banking Kontostände und gebuchte Umsätze abrufen. In der Bankauswahl erscheinen die deutschen Institute, die der Anbieter für die hinterlegte Anwendung zurückgibt. Bei Sparkassen und Volksbanken/Raiffeisenbanken die konkrete regionale Bank auswählen. [Länderinformationen und Bankbesonderheiten](https://enablebanking.com/docs/markets/de/)

## Eigenes Konto einrichten

1. Im [Enable-Banking-Portal](https://enablebanking.com/cp/applications) eine eigene Produktionsanwendung mit Kontoinformationszugriff einrichten. Die dort geforderten Angaben und die zulässigen Rücksprungadressen hängen von der Umgebung ab. Die private PEM-Datei beim Registrieren einmal lokal speichern. Die Anwendungs-ID steht im Portal und im Namen der generierten Datei.
2. Im Anbieterportal die Anwendung über die Freigabe der eigenen Konten aktivieren. Der eingeschränkte Modus kann nur diese freigegebenen Konten lesen. Die App kauft und aktiviert keine kostenpflichtigen Zugänge. [Eigene Konten freigeben](https://enablebanking.com/docs/api/linked-accounts/) · [Anwendung registrieren](https://enablebanking.com/docs/api/control-panel/)
3. **Bankkonten → Bankanbindung einrichten** öffnen. Anwendungs-ID, die im Anbieterportal registrierte HTTPS-Rücksprungadresse und die PEM-Datei auswählen. Die App prüft die Einstellungen gegen den Anbieter. Diese Datei gehört in die lokale Einrichtung, nicht in den Chat. MoreMoney speichert Schlüssel und Freigaben verschlüsselt außerhalb der normalen Backup-Daten.
4. **Bank verbinden** auswählen, die regionale Bank suchen und die Freigabe im Browser durchführen. Die Online-Banking-PIN und TAN gibst du gegebenenfalls auf der Seite deiner Bank beziehungsweise im Freigabeablauf des Anbieters ein. Kopiere nach der Freigabe die vollständige Rücksprungadresse aus der Browser-Adressleiste zurück in MoreMoney. Verwende eine Rücksprungadresse, die unter deiner Kontrolle steht und den vertraulichen Einmalcode weder weiterleitet noch protokolliert. MoreMoney prüft die Rücksprungadresse und die laufende Freigabe, bevor der Code zum Anbieter geht. [Autorisierungsablauf des Anbieters](https://enablebanking.com/docs/api/quick-start/)
5. Das gewünschte Konto auswählen. Die erste Synchronisierung lädt den gebuchten Kontostand und bis zu 90 Tage verfügbarer Umsätze. Weitere Abrufe unter **Synchronisieren**. Das Trennen beendet die gespeicherte Freigabe beim Anbieter und behält bisherige Buchungen.

Eine Sandbox-Anwendung zeigt ein Testkonto im Bereich **Bankanbindung**. Testumsätze fließen nicht in die lokalen Echtkonten ein. Ein neues Onlinekonto erhält eine eigene Historie. Falls dasselbe Konto bereits manuell geführt wird, die Vermögensberücksichtigung bewusst festlegen. Eine automatische Zusammenführung manueller und synchronisierter Buchungen gibt es derzeit nicht.

## Trade Republic

Wenn der Anbieter dein Trade-Republic-Geldkonto in der Auswahl anbietet und freigibt, kannst du es über denselben Ablauf verbinden. Der Anbieter dokumentiert eingeschränkte Umsatzdetails. Depotpositionen, Stückzahlen und Wertpapierorders sind über diesen Kontoinformationszugang nicht verfügbar. Einzelne Wertpapiere und ETFs kannst du in der Watchlist beobachten oder im Vermögensbereich als Besitz erfassen. [Trade Republic beim Kontodatenanbieter](https://enablebanking.com/docs/markets/de/#trade-republic) · [Depot und Verwahrung bei Trade Republic](https://support.traderepublic.com/de-de/850-Wo-werden-meine-Wertpapiere-verwahrt)

Mehrere Depotpositionen kannst du als Bestandsdatei unter **Vermögen → Depots → Depot-CSV importieren** übernehmen. Die Downloadvorlage zeigt die benötigten Felder. [Kompatibilitätsmatrix und Importregeln](FINANCE-OS-2-UPGRADE.md)
