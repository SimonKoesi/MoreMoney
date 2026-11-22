# Persönliche Aktien-Watchlist

Unter Aktien-Watchlist beliebige Aktien mit Name, Börsensymbol und Währung anlegen. Optional Börse, Gruppe, Notiz und einen Zielkurs hinzufügen. Favoriten, Suchbegriff und Gruppe filtern ausschließlich die eigene Liste. Unterstützte Kurswährungen: EUR, USD, GBP und CHF. Die Watchlist verändert keine Kontostände, Budgets oder Finanztransaktionen.

Kurse lassen sich ohne Konto bei einem externen Dienst manuell mit Handelstag erfassen. Ein erneuter Eintrag für denselben Handelstag ersetzt den bisherigen manuellen Tageswert. Der Verlauf enthält gespeicherte Beobachtungen, keine behauptete vollständige Börsenhistorie. Angezeigte Prozentveränderung: letzter gegenüber vorherigem gespeichertem Eintrag, nicht automatisch Tagesrendite. Quelle und Handelstag stehen beim Kurs.

Kurse und Ziele werden exakt in Millionsteln als validierte Ganzzahlzeichenfolgen gespeichert; Kursarithmetik nutzt BigInt. Diagramme und Ausgabe dürfen diese Werte für die reine Darstellung in Zahlen umwandeln. Zielmarkierungen vergleichen die exakten Werte. Ein Ziel ist ein persönlicher Beobachtungswert, keine Kaufempfehlung und kein automatischer Handel.

Sobald Kurse vorhanden sind, bleiben Symbol, Börse und Währung der Aktie unverändert. Für ein anderes Instrument eine neue Aktie anlegen. Das verhindert, dass ein vorhandener USD-Verlauf nachträglich als EUR-Verlauf erscheint. Notiz, Gruppe, Name und Ziel bleiben bearbeitbar.

## Optionaler Online-Kursabruf

Der Adapter unterstützt einen eigenen Twelve-Data-Zugang. In der lokalen Startumgebung `MOREMONEY_TWELVE_DATA_KEY` sicher setzen und MoreMoney neu starten. Den Schlüssel nicht ins Repository oder in den Chat schreiben. Der Desktop-Dienst liest ihn nur serverseitig; er gehört weder zum JSON-Backup noch zu API-Antworten. Erst dann erscheint „Kurs abrufen“.

Ein Abruf wird ausschließlich auf Knopfdruck durchgeführt. Dabei gehen Symbol, optionale Börse und der eigene API-Schlüssel an api.twelvedata.com. Haushaltsdaten und Notizen werden nicht übertragen. Datenabdeckung, Verzögerung und Nutzungslimits hängen vom eigenen Tarif und Börsenrechten ab. Die App verspricht keine Echtzeitdaten und bucht keinen Tarif. Keine automatischen Hintergrundabrufe; gleiche Aktie frühestens nach einer Minute erneut abrufen. Falsche Währung/Instrumentdaten, Fehler und Änderungen während des Abrufs werden verworfen. Bereits gespeicherte Kurse bleiben bei einem Fehler erhalten.

Quelle: [Twelve Data Dokumentation](https://twelvedata.com/docs), [Tarife und Datenabdeckung](https://twelvedata.com/pricing). Der kostenlose Tarif ist begrenzt; ein API-Schlüssel wird nicht mitgeliefert. Ohne konfigurierten Zugang wurde der Adapter mit isolierten Beispieldaten geprüft; ein echter Onlineabruf wird nicht als durchgeführt behauptet.

Die versionierte Datenbankmigration 002 ergänzt Tabellen und Indizes, ohne bestehende Finanzdaten umzuschreiben. Die Watchlist samt Kursverlauf ist im JSON-Backup enthalten. API-Schlüssel werden daraus ausgeschlossen.
