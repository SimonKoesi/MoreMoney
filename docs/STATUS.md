# Funktionsstand 0.1

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
