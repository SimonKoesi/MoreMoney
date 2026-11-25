# Funktionsstand 0.5

Neu in 0.5: getrennte Plattformverzeichnisse für Windows und native iOS-App, entfernte Demo-Funktion sowie gezielte Bereinigung des alten Beispieldatensatzes mit Erhalt eigener Einträge. Responsive Prüfmatrix für kleine Displays, große Schrift und Textkollisionen. Echte macOS-Kompilierung und native Simulator-Tests; eine unsignierte IPA wird als eigenes Artefakt erzeugt. Die IPA ist für Sideloadly vorbereitet; signiert wird dort mit eigener Apple-ID. Native Funktionsunterschiede sind in platforms/ios/README.md beschrieben; keine automatische Synchronisierung.

Neu in 0.4: persönliche Aktien-Watchlist mit Favoriten, Gruppen, Notizen, exakten Zielkursen und gespeichertem Kursverlauf. Manuelle Tageswerte funktionieren offline; optionaler Twelve-Data-Adapter für bewusste Einzelabrufe über eigenen Zugang. Die Watchlist wird mitgesichert und erzeugt keine Kontobuchungen. Details: [AKTIEN-WATCHLIST.md](AKTIEN-WATCHLIST.md).

Neu in 0.3: MoreMoney als Programmname, bereitgestelltes Icon in Oberfläche und Windows-Setup; bisherige Datenspeicher und Installations-ID bleiben kompatibel.

Neu in 0.2: zweistufige Buchungserfassung mit Validierung und erhaltenen Eingaben, Dock für Mobilnavigation, direkte Budget-/Bereichsrouten mit Zurücknavigation, native Radiofilter, vollständig tastaturbedienbare Budgettabs und wiederverwendbare Aufgabencheckboxen. Oberfläche gestrafft; ausführliche Prognoseannahmen aufklappbar. Bausteinauswahl: [ELEMENTE-EVALUIERUNG.md](ELEMENTE-EVALUIERUNG.md).

## Implementiert

- Windows-Desktop-Hülle und NSIS-Buildkonfiguration; lokaler Next.js-Dienst, persistente SQLite-Datenbank, Initialmigration, Integer-Cent-Logik.
- Dashboard mit echten Daten, Cashflow-Diagramm plus zugänglicher Datentabelle, Zeitraumwahl, ein-/ausblendbaren Kennzahlen, Planungswert und letzten Buchungen.
- Konten mit Anfangsbestand und Archivierung; Einnahmen/Ausgaben erfassen und löschen, Suche und Artfilter; atomare Transfers mit idempotenten Buchungsanforderungen.
- Freie Budgets ohne Pflichtkategorien, Archivierung, strukturelle Duplizierung, Positionen anlegen/bearbeiten/löschen, Menge, Notiz, unabhängige Checkliste und Bestellstatus.
- Mehrere Teilzahlungen mit korrekter Budgetprognose, Listen-/Galerie-/Checklisten-/Kanban-Darstellung, mehrere Bilder, Produktlinks, Produktalternativen mit aktiver Auswahl.
- Projekte und Aufgaben, Sparziele mit manuell erfasstem Fortschritt, wiederkehrende Planwerte, transparente Liquiditätssimulation, Theme/Reserve, globale Suche, CSV-Buchungsexport, vollständiger JSON-Export einschließlich Bilder.

## Teilweise

- Checklisten- und Listenansicht nutzen denselben kompakten Editor; noch keine eigenen Kategoriesummen oder erweiterte Tabellenkonfiguration.
- Konten und Buchungen besitzen noch keine nachträgliche Bearbeitung; Korrektur von Buchungen derzeit per Löschen und neu Erfassen. Budgets nur als Namen/Betrag anlegen und archivieren, noch kein vollständiger Budgeteditor.
- Duplizierte Budgets übernehmen Positionen, aber keine Bilder/Links/Alternativen und keine Zahlungen.
- Sparziele: manuelle Zuordnung statt Beitragsbuch mit Kontoverknüpfung. Wiederkehrende Zahlungen: Intervall und nächste Fälligkeit statt automatischer Kalender-/Vertragsverwaltung.
- Ein-/Ausblenden von Dashboard-Karten vorhanden, freie Reihenfolge noch nicht. Basisfilter vorhanden, noch keine persistierten komplexen Filter.

## Offen – nicht als fertige Oberfläche angeboten

JSON-Wiederherstellung und Importvorschau, CSV-Import, Moodboards, Wunschlistenmodul, Szenariovarianten, Vorlagenverwaltung, Beleg-/Garantieverwaltung, Vertragskündigungsfristen, Kalender und Benachrichtigungen, Unterkategorien, Massenbearbeitung, Unteraufgaben, Drag-and-drop, Undo, vollständige Finanzstatistiken, Nettoentwicklung, steuerjahrspezifisch verifizierter Brutto-Netto-Rechner, Mehrbenutzerbetrieb, Authentifizierung, Cloud-Synchronisierung, KI und automatische Updates.

Diese Version priorisiert den nutzbaren lokalen Kern gemäß der Phasenregel des ursprünglichen Master-Prompts. Die offenen Bereiche sind keine funktionslosen Menüeinträge. Installer- und Laufzeitprüfung werden getrennt im Prüfprotokoll festgehalten.

Native iOS-Kursalarme sind umgesetzt: Ab-/Bis-Schwelle, lokale Mitteilungen nach neuen Kurswerten, deduplizierter Bereichswechsel, optionaler Twelve-Data-Abruf und iOS-gesteuerte Hintergrundaktualisierung. Echtzeit-Push über Server, garantierte Abrufintervalle und physische iPhone-Installation sind nicht geprüft bzw. nicht enthalten.

Neu: Namensvorschläge für Aktien und ETFs, automatische Kursbeobachtung über eigenen Twelve-Data-Zugang und Ratenkäufe/Darlehen mit festem Sollzins, Tilgungsplan, Zinsanteilen und Restschuld. Bestätigte Ratenzahlungen werden ohne Duplikate gebucht; das Anlegen allein verändert keinen Kontostand. Profilblock „Mein persönlicher Bereich“ entfernt. Details: docs/FINANZIERUNGEN.md und docs/AKTIEN-WATCHLIST.md.
