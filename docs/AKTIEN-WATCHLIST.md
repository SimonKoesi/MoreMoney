# Persönliche Aktien-Watchlist

Unter Aktien-Watchlist Aktien und ETFs mit Name, Börsensymbol und Währung anlegen. Optional Börse, Gruppe, Notiz und einen Zielkurs hinzufügen. Favoriten, Suchbegriff und Gruppe filtern ausschließlich die eigene Liste. Unterstützte Kurswährungen: EUR, USD, GBP und CHF. Die Watchlist verändert keine Kontostände, Budgets oder Finanztransaktionen.

Kurse lassen sich ohne Konto bei einem externen Dienst manuell mit Handelstag erfassen. Ein erneuter Eintrag für denselben Handelstag ersetzt den bisherigen manuellen Tageswert. Der Verlauf enthält gespeicherte Beobachtungen, keine behauptete vollständige Börsenhistorie. Angezeigte Prozentveränderung: letzter gegenüber vorherigem gespeichertem Eintrag, nicht automatisch Tagesrendite. Quelle und Handelstag stehen beim Kurs.

Kurse und Ziele werden exakt in Millionsteln als validierte Ganzzahlzeichenfolgen gespeichert; Kursarithmetik nutzt BigInt. Diagramme und Ausgabe dürfen diese Werte für die reine Darstellung in Zahlen umwandeln. Zielmarkierungen vergleichen die exakten Werte. Ein Ziel ist ein persönlicher Beobachtungswert, keine Kaufempfehlung und kein automatischer Handel.

Sobald Kurse vorhanden sind, bleiben Symbol, Börse und Währung der Aktie unverändert. Für ein anderes Instrument eine neue Aktie anlegen. Das verhindert, dass ein vorhandener USD-Verlauf nachträglich als EUR-Verlauf erscheint. Notiz, Gruppe, Name und Ziel bleiben bearbeitbar.

## Optionaler Online-Kursabruf

Unter **Aktien-Watchlist → Kursdienst** den eigenen Twelve-Data-Schlüssel eingeben und **Namenssuche und automatische Kurse erlauben** wählen. Der Schlüssel wird lokal verschlüsselt gespeichert. Alternativ kann der Serverbetreiber `MOREMONEY_TWELVE_DATA_KEY` in der lokalen Startumgebung setzen und die Marktdatenfreigabe im Datenschutzcenter erteilen. Der Schlüssel ist weder Teil des JSON-Backups noch von API-Antworten.

Bei geöffneter Windows-App werden die beobachteten Werte auch auf anderen Seiten automatisch aktualisiert. Pro Instrument liegt zwischen automatischen Versuchen mindestens ein Abstand von fünf Minuten. Die App verarbeitet Instrumente nacheinander. Einzelabrufe bleiben möglich. Die Namenssuche ab zwei Zeichen bietet Aktien und ETFs mit Symbol, Börse, Typ und Währung an. Eine Auswahl übernimmt die Stammdaten. Suchtext oder Symbol, optionale Börse und der eigene API-Schlüssel gehen an Twelve Data. Datenabdeckung, Verzögerung und Nutzungslimits hängen vom eigenen Tarif und Börsenrechten ab. Die Watchlist speichert den echten Anbieterwert mit Quelle und Handelstag. Sie zeigt keine unerfassten Kurse an. Der Windows-Abruf pausiert bei aktivem diskretem Modus und endet beim Schließen der App.

Der allgemeine Marktdatenzugang wird vom Nutzer eingerichtet. Mit dem öffentlichen Demozugang des Anbieters wurden Namenssuche und Beispielkurs für Apple Inc. geprüft. [Twelve Data Dokumentation](https://twelvedata.com/docs) · [Tarife und Datenabdeckung](https://twelvedata.com/pricing)

Die versionierte Datenbankmigration 002 ergänzt Tabellen und Indizes, ohne bestehende Finanzdaten umzuschreiben. Die Watchlist samt Kursverlauf ist im JSON-Backup enthalten. API-Schlüssel werden daraus ausgeschlossen.

Auf iOS den Schlüssel unter **Mehr** im Geräte-Schlüsselbund speichern. Hintergrundaktualisierung ohne Push hängt von iOS ab. Für Kursalarme bei geschlossener App ist die getrennte [Push-Anbindung](../platforms/push/README.md) verfügbar. Sie benötigt den eingerichteten Relay und eine eigene Apple-Signierung.
