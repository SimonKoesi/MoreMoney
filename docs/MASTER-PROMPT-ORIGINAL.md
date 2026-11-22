
# FINOVA – ULTIMATE MASTER PROMPT
# All-in-One Finance, Budget & Life Planner

Du bist ein Elite-Team aus:
- Senior Full-Stack-Entwicklern
- Softwarearchitekten
- Fintech-Spezialisten
- UX/UI-Designern
- Datenbankentwicklern
- QA- und Security-Engineers

Deine Aufgabe ist es, eine vollständige, professionelle,
moderne und langfristig erweiterbare Finanz-, Budget-
und Projektplaner-Webanwendung zu entwickeln.

PROJEKTNAME: FINOVA
SLOGAN: Dein Geld. Deine Pläne. Dein Überblick.

ZIEL:
Entwickle eine Anwendung, die sich funktional und
gestalterisch mit hochwertigen Fintech- und
Produktivitätsanwendungen messen kann.

Die App soll die Einfachheit eines guten Haushaltsbuchs,
die Flexibilität von Notion, die visuelle Qualität einer
Premium-Finanz-App und die Planungsmöglichkeiten eines
Projektmanagementsystems vereinen.

Das Ergebnis muss eine echte, benutzbare Anwendung
sein – keine Landingpage, kein UI-Mockup und keine
Sammlung funktionsloser Komponenten.

==================================================
01 – GRUNDPRINZIPIEN
==================================================

Die wichtigsten Regeln:

1. Maximale Individualisierbarkeit.
2. Keine verpflichtenden Budgetkategorien.
3. Beliebig viele Budgets, Projekte und Positionen.
4. Echte, persistente Datenspeicherung.
5. Finanzmathematisch korrekte Berechnungen.
6. Moderne, hochwertige Benutzeroberfläche.
7. Einfache Bedienung trotz großer Funktionsvielfalt.
8. Klare Trennung von Planung und tatsächlichen Zahlungen.
9. Alle wichtigen Bereiche sinnvoll miteinander verknüpfen.
10. Modularer Aufbau für zukünftige Erweiterungen.

Die Anwendung besteht aus zwei Hauptwelten:

A) MEINE FINANZEN
- Konten
- Einnahmen
- Gehalt
- Ausgaben
- Fixkosten
- Verträge
- Sparziele
- Vermögensübersicht
- Statistiken

B) MEINE PLÄNE
- Budgets
- Projekte
- Checklisten
- Wunschlisten
- Produkte
- Einkaufsvorhaben
- Moodboards
- Budgetvarianten
- Finanzielle Zukunftsplanung

Beide Bereiche sind miteinander verbunden.

Beispiel:
Eine geplante Couch erscheint in meinem
Einrichtungsbudget, aber erst eine tatsächlich
gebuchte Zahlung wird zur echten Ausgabe.

==================================================
02 – TECHNOLOGIE
==================================================

Verwende:

- Next.js mit App Router
- React
- TypeScript mit Strict Mode
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Recharts
- Prisma ORM
- SQLite für lokale Entwicklung
- Zod
- React Hook Form
- date-fns
- Vitest
- Playwright für wichtige E2E-Tests

Nutze aktuelle, miteinander kompatible stabile
Versionen.

Technische Anforderungen:

- Modularer Code
- Serverseitige Validierung
- Saubere Datenmodelle
- Wiederverwendbare Komponenten
- Typisierte APIs oder Server Actions
- Sichere Datei-Uploads
- Robuste Fehlerbehandlung
- Responsives Layout
- Dark Mode und Light Mode
- Deutsche Benutzeroberfläche
- Deutsche Zahlen- und Datumsformate
- EUR als Standardwährung

Die Anwendung muss zunächst lokal ohne
kostenpflichtige Cloud-Dienste funktionieren.

Bereite die Architektur für eine spätere
Mehrbenutzer- und Cloud-Version vor.

Finanzbeträge niemals mit unkontrollierten
JavaScript-Floating-Point-Operationen berechnen.

Verwende Integer-Cent-Beträge oder Decimal.

==================================================
03 – PREMIUM-DESIGN
==================================================

Erstelle ein modernes Fintech-Design.

Stil:
- Minimalistisch
- Hochwertig
- Professionell
- Elegant
- Übersichtliches Dashboard
- Großzügige Abstände
- Weiche Schatten
- Abgerundete Karten
- Dezente Animationen
- Einheitliche Typografie
- Aussagekräftige Icons

Standard-Theme:
Dunkles Navy/Anthrazit.

Akzentfarben:
Türkis, Blau oder Violett.

Statusfarben:
Grün für positive Werte.
Orange für Warnungen.
Rot für kritische Werte.

Erstelle:
- Desktop-Sidebar
- Mobile Navigation
- Header mit Schnellaktionen
- Globalen Suchdialog
- Theme-Umschalter
- Toast-Meldungen
- Skeleton-Loader
- Dialoge
- Drawer
- Kontextmenüs
- Tabellen
- Galerieansichten
- Fortschrittsbalken
- Diagramme

Verwende keine unpassenden Stockfotos
und keine überladenen Oberflächen.

==================================================
04 – NAVIGATION
==================================================

Sidebar:

ÜBERSICHT
- Dashboard
- Finanzkalender
- Benachrichtigungen

FINANZEN
- Konten
- Einnahmen & Gehalt
- Ausgaben
- Fixkosten & Verträge
- Sparziele
- Statistiken

PLANUNG
- Meine Budgets
- Projekte
- Wunschlisten
- Finanzsimulationen
- Vorlagen

SYSTEM
- Einstellungen
- Datenimport & Export

Alle Bereiche müssen miteinander verknüpft sein.

Navigation vollständig responsiv gestalten.

==================================================
05 – HAUPTDASHBOARD
==================================================

Entwickle ein intelligentes, individuell
anpassbares Dashboard.

KPI-Karten:

- Monatliches Nettoeinkommen
- Gesamteinnahmen
- Tatsächliche Ausgaben
- Fixkosten
- Variable Ausgaben
- Verfügbares Geld
- Kontostand gesamt
- Sparquote
- Monatliche Sparrate
- Geplante Ausgaben
- Offene Rechnungen
- Aktive Budgets
- Laufende Projekte
- Erreichte Sparziele
- Budgetüberschreitungen

Diagramme:
- Einnahmen vs. Ausgaben
- Cashflow pro Monat
- Ausgaben nach Kategorien
- Fixkostenanteil
- Sparentwicklung
- Kontostandsentwicklung
- Budgetverbrauch
- Monats- und Jahresvergleich

Zeiträume:
- Dieser Monat
- Letzter Monat
- Letzte 3 Monate
- Letzte 6 Monate
- Letzte 12 Monate
- Dieses Jahr
- Individueller Zeitraum

Dashboard-Widgets:

Nutzer sollen Widgets:
- Einblenden
- Ausblenden
- Verschieben
- Neu anordnen

können.

Zusätzliche Bereiche:

"Deine nächsten Zahlungen"
"Deine aktiven Projekte"
"Deine wichtigsten Sparziele"
"Deine Budgetwarnungen"
"Deine letzten Transaktionen"

Verwende ausschließlich echte gespeicherte
Daten oder klar gekennzeichnete Demodaten.

==================================================
06 – KONTEN UND FINANZBESTÄNDE
==================================================

Nutzer können mehrere Konten verwalten.

Kontotypen:
- Girokonto
- Tagesgeld
- Sparkonto
- Bargeld
- Kreditkarte
- Sonstiges

Funktionen:
- Konto erstellen
- Anfangsbestand eintragen
- Konto bearbeiten
- Konto archivieren
- Transaktionen zuordnen
- Geld zwischen Konten verschieben
- Kontostand berechnen
- Kontoentwicklung anzeigen

Wichtig:

Transfers zwischen eigenen Konten dürfen
nicht als Einkommen oder Konsumausgabe zählen.

Unterscheide:
- Tatsächlicher Kontostand
- Geplante zukünftige Zahlungen
- Reservierte Budgets
- Verfügbarer Betrag

Reservierte Budgets reduzieren nicht automatisch
den echten Kontostand.

==================================================
07 – GEHALTSRECHNER UND EINNAHMEN
==================================================

Erstelle einen umfassenden Bereich für Einkommen.

Einkommensarten:
- Angestelltengehalt
- Nebenjob
- Selbstständigkeit
- Bonus
- Einmalzahlung
- Sonstige Einnahmen

Jede Einnahme:
- Titel
- Betrag
- Datum
- Wiederholungsintervall
- Einkommensquelle
- Verknüpftes Konto
- Kategorie
- Notiz

GEHALTSRECHNER:

Nutzer wählen:

[ ] Bruttogehalt eingeben
[ ] Nettogehalt eingeben

Bei Brutto:
- Monats- oder Jahresbrutto
- Steuerjahr
- Steuerklasse
- Bundesland
- Kirchensteuer
- Krankenversicherung
- Zusatzbeitrag
- Rentenversicherung
- Pflegeversicherung
- Arbeitslosenversicherung
- Relevante Angaben zu Kindern
- Weitere notwendige Parameter

Ermittle einen nachvollziehbaren geschätzten
Nettobetrag nach deutschen Regeln.

WICHTIG:
Verwende nur dokumentierte und zum gewählten
Steuerjahr passende Berechnungsparameter.

Keine erfundenen Steuersätze.

Wenn eine verlässliche Berechnung nicht möglich
ist, kennzeichne das Ergebnis als Schätzung
und erkläre die Unsicherheit.

Trenne:
- Geschätztes Netto
- Tatsächliches Netto

Tatsächliches Netto hat für die persönliche
Budgetplanung Vorrang.

Bei Nettoeingabe:
Den tatsächlichen Nettobetrag direkt speichern.

Zusätzlich:
- Gehaltserhöhungen simulieren
- Mehrere Jobs verwalten
- Jahresgehalt darstellen
- Gehaltsentwicklung visualisieren
- Zukünftige Einkommensänderungen planen

==================================================
08 – INDIVIDUELLE BUDGETS
==================================================

Dies ist eine Kernfunktion.

Nutzer können unbegrenzt viele Budgets anlegen.

Beispiele:
- Wohnungseinrichtung
- Urlaub
- Auto
- Hochzeit
- Gaming-PC
- Renovierung
- Lebensmittel
- Geburtstag
- Sonstige Projekte

Diese Beispiele dürfen nicht verpflichtend sein.

Jedes Budget besitzt:

- Name
- Beschreibung
- Icon
- Farbe
- Gesamtbetrag
- Zeitraum
- Startdatum
- Enddatum
- Status
- Tags
- Optionale Sparzielverknüpfung
- Optionale Projektverknüpfung
- Budgetwarnschwellen

Budgets enthalten:
- Kategorien
- Unterkategorien
- Positionen
- Bilder
- Links
- Notizen
- Checklisten
- Aufgaben

Budgetanzeigen:

- Gesamtbudget
- Geplante Kosten
- Tatsächlich bezahlt
- Noch offene Planbeträge
- Erwartete Gesamtkosten
- Verbleibendes Budget
- Budgetüberschreitung
- Einsparungen
- Fortschritt

Ermögliche:
- Positionen hinzufügen
- Positionen bearbeiten
- Positionen löschen
- Positionen duplizieren
- Kategorien verschieben
- Positionen sortieren
- Massenbearbeitung
- Budget duplizieren
- Budget archivieren

==================================================
09 – PRODUKTE UND BUDGETPOSITIONEN
==================================================

Jede Budgetposition muss sehr flexibel sein.

Es gibt verschiedene Positionstypen:

- Produkt
- Dienstleistung
- Allgemeine Ausgabe
- Aufgabe
- Reservierter Betrag
- Benutzerdefinierte Position

Felder:
- Name
- Beschreibung
- Kategorie
- Geplanter Preis
- Tatsächlicher Preis
- Menge
- Einheit
- Priorität
- Status
- Händler
- Produktlink
- Weitere Links
- Bilder
- Notizen
- Kaufdatum
- Geplantes Kaufdatum
- Lieferdatum
- Garantieinformationen
- Verknüpfte Transaktionen
- Optionale Tags

Zusätzlich:
- Erledigt-Checkbox
- Bestellstatus
- Zahlungsstatus

Die Checkbox darf nicht automatisch eine
Finanztransaktion erzeugen.

Aufgabenstatus, Bestellstatus und Zahlungsstatus
müssen unabhängig funktionieren.

==================================================
10 – PRODUKTBILDER UND LINKS
==================================================

Jede Position kann mehrere Bilder besitzen.

Funktionen:
- Bilddateien hochladen
- Drag & Drop
- Bildvorschau
- Mehrere Bilder speichern
- Titelbild auswählen
- Bilder löschen
- Bilder austauschen
- Galerieansicht
- Bild-Zoom

Unterstütze:
- JPG
- PNG
- WebP

Validiere Uploads serverseitig.

Speichere die Dateien dauerhaft und sicher.

Produktlinks:

Jede Position kann beliebig viele Links besitzen.

Felder:
- URL
- Händlername
- Preis
- Versandkosten
- Letzte Preisprüfung
- Notiz

Links sollen direkt geöffnet werden können.

Optionaler Produktimport:

Falls eine geeignete öffentliche oder
autorisierte Schnittstelle verfügbar ist,
können Produktinformationen übernommen werden.

Keine unzuverlässige automatische
Produktdatenerfassung vortäuschen.

Manuelle Eingaben müssen immer funktionieren.

==================================================
11 – PRODUKTALTERNATIVEN
==================================================

Nutzer können mehrere Alternativen
für eine Anschaffung speichern.

Beispiel:

SOFA
- Alternative A: 699 €
- Alternative B: 899 €
- Alternative C: 1.299 €

Jede Alternative:
- Name
- Händler
- Link
- Bilder
- Preis
- Versandkosten
- Gesamtpreis
- Eigenschaften
- Notizen

Erstelle eine Vergleichsansicht.

Der Nutzer kann eine Alternative auswählen.

Nur die aktive Alternative wird in die
geplanten Kosten übernommen.

Nicht ausgewählte Alternativen bleiben
als Optionen verfügbar.

==================================================
12 – BUDGETANSICHTEN
==================================================

Jedes Budget benötigt mehrere Ansichten.

1. Tabellenansicht
2. Galerieansicht
3. Checklistenansicht
4. Kanban-Ansicht
5. Kategorienansicht
6. Kostenübersicht

Galeriekarten zeigen:
- Produktbild
- Name
- Händler
- Preis
- Status
- Priorität
- Checkbox

Kanban-Spalten können sein:
- Wunschliste
- Geplant
- Bestellt
- Geliefert
- Erledigt

Ansichten müssen auf dieselben gespeicherten
Daten zugreifen.

==================================================
13 – PROJEKTMANAGEMENT
==================================================

Erstelle ein vollständiges Projektmodul.

Beispiele:
- Wohnung einrichten
- Umzug
- Urlaub
- Renovierung
- Führerschein
- Veranstaltung
- Eigenes Projekt

Jedes Projekt:
- Name
- Beschreibung
- Farbe
- Icon
- Startdatum
- Enddatum
- Status
- Fortschritt
- Optionales Budget
- Aufgaben
- Unteraufgaben
- Checklisten
- Notizen
- Links
- Anhänge

Aufgaben können:
- Erstellt
- Bearbeitet
- Abgehakt
- Verschoben
- Dupliziert
- Gelöscht

werden.

Ansichten:
- Liste
- Kanban
- Kalender
- Fortschritt

Projektfortschritt dynamisch berechnen.

==================================================
14 – MOODBOARDS
==================================================

Erstelle visuelle Pinnwände.

Nutzer können:
- Bilder hochladen
- Produktbilder übernehmen
- Inspirationen sammeln
- Notizen platzieren
- Produktpositionen verknüpfen
- Bilder sortieren
- Moodboards erstellen

Beispiele:
- Wohnzimmerstil
- Traumküche
- Schlafzimmer
- Gartengestaltung
- Hochzeitsdekoration

Moodboards dürfen keine Finanztransaktionen
erzeugen.

==================================================
15 – AUSGABEN UND TRANSAKTIONEN
==================================================

Erstelle ein vollständiges Transaktionssystem.

Felder:
- Titel
- Betrag
- Datum
- Kategorie
- Konto
- Zahlungsart
- Beschreibung
- Notiz
- Budgetverknüpfung
- Projektverknüpfung
- Positionsverknüpfung
- Optionaler Beleg

Aktionen:
- Hinzufügen
- Bearbeiten
- Löschen
- Duplizieren
- Filtern
- Suchen
- Sortieren
- Importieren
- Exportieren

Unterstütze Teilzahlungen.

Eine Budgetposition kann mehrere
Zahlungen besitzen.

Beispiel:
Sofa kostet 1.000 €.

Anzahlung: 200 €
Restzahlung: 800 €

Tatsächlich bezahlt: 1.000 €.

Keine doppelte Zählung der beiden
Zahlungen und des Produktpreises.

==================================================
16 – FIXKOSTEN UND VERTRÄGE
==================================================

Nutzer verwalten wiederkehrende Zahlungen.

Beispiele:
- Miete
- Strom
- Wasser
- Internet
- Handy
- Versicherungen
- Streaming
- Mitgliedschaften

Felder:
- Name
- Betrag
- Konto
- Kategorie
- Intervall
- Fälligkeit
- Vertragsbeginn
- Vertragsende
- Kündigungsfrist
- Notizen

Intervalle:
- Wöchentlich
- Monatlich
- Quartalsweise
- Halbjährlich
- Jährlich
- Benutzerdefiniert

Zeige:
- Monatliche Fixkosten
- Jährliche Fixkosten
- Kommende Abbuchungen
- Kündigungstermine
- Anteil am Netto

Geplante wiederkehrende Zahlungen und echte
Transaktionen dürfen nicht doppelt zählen.

==================================================
17 – SPARZIELE
==================================================

Beliebig viele Sparziele erstellen.

Felder:
- Name
- Zielbetrag
- Gesparter Betrag
- Zieltermin
- Sparrate
- Priorität
- Farbe
- Icon
- Verknüpftes Konto

Funktionen:
- Fortschrittsbalken
- Sparhistorie
- Zielprognose
- Erforderliche Sparrate
- Sparbeträge buchen
- Sparziele pausieren
- Sparziele abschließen

Transfers auf eigene Sparkonten sind
keine Konsumausgaben.

==================================================
18 – BUDGETVARIANTEN
==================================================

Nutzer können Planvarianten vergleichen.

Beispiel:
Wohnungseinrichtung

Sparversion: 4.000 €
Standardversion: 7.000 €
Premiumversion: 12.000 €

Funktionen:
- Varianten erstellen
- Positionen pro Variante auswählen
- Gesamtpreise vergleichen
- Auswirkungen simulieren
- Variante übernehmen

Simulationen verändern keine echten
Finanzdaten ohne Bestätigung.

==================================================
19 – KAUFPLANUNG
==================================================

Plane Anschaffungen über Monate hinweg.

Beispiel:
Januar: Bett
Februar: Sofa
März: Fernseher

Zeige:
- Geplante Ausgaben je Monat
- Tatsächliche Zahlungen
- Verfügbaren Cashflow
- Reservierte Beträge
- Budgetüberschreitungen

Geplante Käufe dürfen nicht als
bereits bezahlte Ausgaben erscheinen.

==================================================
20 – KANN ICH MIR DAS LEISTEN?
==================================================

Implementiere einen interaktiven
Kauf-Simulator.

Nutzer wählen:
- Produkt oder Projekt
- Kaufpreis
- Kaufdatum
- Zahlungsmodell

Berücksichtige:
- Aktuelle Kontostände
- Erwartete Einnahmen
- Fixkosten
- Geplante Ausgaben
- Sparziele
- Sicherheitsreserve
- Einmalige Zahlungen

Ergebnisse:
- Voraussichtlich verfügbarer Betrag
- Finanzielle Lücke
- Notwendige Sparzeit
- Möglicher Kaufmonat
- Einfluss auf die Liquidität
- Einfluss auf andere Ziele

Kennzeichne Prognosen als Prognosen.

Zeige:
- Verwendete Annahmen
- Berechnung
- Unsicherheiten

Keine unbegründeten Aussagen zur
finanziellen Leistbarkeit.

==================================================
21 – FINANZSIMULATIONEN
==================================================

Erstelle einen Szenario-Planer.

Beispiele:
- 300 € mehr Gehalt
- 200 € höhere Miete
- 1.000 € Einmalausgabe
- 500 € monatlich sparen
- Umzug in drei Monaten

Zeige:
- Entwicklung über 3 Monate
- 6 Monate
- 12 Monate
- 24 Monate
- Individuellen Zeitraum

Vergleiche mehrere Szenarien.

Simulationen niemals ungefragt
in echte Datensätze übernehmen.

==================================================
22 – FINANZKALENDER
==================================================

Kalender für:
- Gehaltseingänge
- Rechnungen
- Fixkosten
- Vertragsfristen
- Kaufplanung
- Budgetfristen
- Projektaufgaben
- Sparziele

Ansichten:
- Monat
- Woche
- Liste

Jeder Eintrag verweist auf seinen
ursprünglichen Datensatz.

==================================================
23 – STATISTIKEN
==================================================

Erstelle einen professionellen
Analysebereich.

Visualisierungen:
- Einnahmen/Ausgaben
- Kategorien
- Konten
- Sparquote
- Cashflow
- Fixkostenanteil
- Budgetnutzung
- Projektkosten
- Geplante vs. tatsächliche Kosten
- Entwicklung über Zeit

Filter:
- Kategorie
- Konto
- Zeitraum
- Budget
- Projekt
- Transaktionstyp

Unterstütze CSV-Export relevanter Daten.

==================================================
24 – BELEGE UND DOKUMENTE
==================================================

Nutzer können Dokumente hinterlegen:

- Rechnungen
- Kassenbons
- Garantien
- Kaufbelege
- Verträge
- Bedienungsanleitungen

Formate:
- PDF
- JPG
- PNG
- WebP

Funktionen:
- Hochladen
- Anzeigen
- Herunterladen
- Löschen
- Positionen zuordnen

Optional:
OCR zur Erkennung von Beträgen,
Datum und Händler.

OCR-Ergebnisse müssen vor Speicherung
vom Nutzer geprüft werden können.

==================================================
25 – INTELLIGENTE HINWEISE
==================================================

Baue ein regelbasiertes Hinweis-System.

Beispiele:

"Dein Freizeitbudget ist zu 85 % verbraucht."

"Für deine Wohnungseinrichtung fehlen
noch 1.250 €."

"Eine Rechnung ist in fünf Tagen fällig."

"Deine Fixkosten machen 48 % deines
Nettoeinkommens aus."

"Mit deiner aktuellen Sparrate erreichst
du dein Ziel voraussichtlich im August."

Hinweise nur auf Basis echter Daten.

Ergänze konfigurierbare Warnschwellen.

==================================================
26 – KI-ASSISTENT (OPTIONAL)
==================================================

Bereite eine spätere KI-Funktion vor.

Mögliche Fragen:
- Wo kann ich Geld sparen?
- Welche Budgets sind zu hoch?
- Wie viel kann ich monatlich investieren?
- Welche Projekte sind finanzierbar?
- Welche Produkte fehlen noch?
- Wie kann ich mein Budget optimieren?

Wichtig:
Die Kernanwendung muss vollständig
ohne KI funktionieren.

Externe KI-Dienste nur mit ausdrücklicher
Konfiguration und Zustimmung verwenden.

Keine sensiblen Finanzdaten ungefragt
an externe Dienste senden.

KI-Vorschläge müssen von tatsächlichen
Berechnungen unterscheidbar bleiben.

==================================================
27 – VORLAGEN
==================================================

Erstelle ein flexibles Vorlagensystem.

Beispiele:
- Wohnungseinrichtung
- Umzug
- Urlaub
- Autokauf
- Hochzeit
- Renovierung
- Monatliches Haushaltsbudget

Nutzer können:
- Vorlagen erstellen
- Vorlagen bearbeiten
- Vorlagen speichern
- Vorlagen duplizieren
- Vorlagen löschen
- Vorlagen verwenden

Vorlagen sind optional.

Die App muss komplett ohne Vorlagen
verwendbar sein.

==================================================
28 – EINSTELLUNGEN
==================================================

Einstellungen:
- Benutzername
- Standardwährung
- Theme
- Standardansicht
- Zahlenformat
- Datumsformat
- Kategorien
- Icons
- Farben
- Warnschwellen
- Sicherheitsreserve
- Dashboard-Konfiguration

Zusätzlich:
- Datenexport
- Datenimport
- Datensicherung
- Daten wiederherstellen
- Lokale Daten löschen

Kritische Aktionen mit Bestätigung.

==================================================
29 – IMPORT UND EXPORT
==================================================

Implementiere:

CSV-Export:
- Einnahmen
- Ausgaben
- Budgets
- Budgetpositionen
- Sparziele

JSON-Backup:
- Sämtliche relevanten Nutzerdaten
- Relationen
- Einstellungen
- Projekte
- Verknüpfungen

Dateianhänge müssen bei vollständigen
Backups berücksichtigt werden.

Beim Import:
- Dateiformat prüfen
- Schema validieren
- Version prüfen
- Import-Vorschau anzeigen
- Konflikte behandeln
- Bestätigung verlangen

Niemals ungefragt Daten überschreiben.

==================================================
30 – DATENBANK
==================================================

Erstelle ein konsistentes Prisma-Schema.

Benötigte Entitäten:

UserSettings
Account
Income
Transaction
Category
Budget
BudgetCategory
BudgetItem
BudgetItemAlternative
BudgetScenario
Project
ProjectTask
ProjectChecklist
Wishlist
ProductLink
ProductImage
Moodboard
MoodboardItem
SavingsGoal
SavingsContribution
RecurringPayment
Contract
Transfer
FinancialScenario
Attachment
Notification
Template

Ergänze benötigte Relationstabellen.

Jeder Datensatz erhält:
- Eindeutige ID
- Erstellungsdatum
- Änderungsdatum

Berücksichtige:
- Referenzielle Integrität
- Sichere Löschregeln
- Valide Statuswerte
- Teilzahlungen
- Archivierung
- Wiederkehrende Vorgänge
- Idempotente Buchungen
- Relationen zwischen Produkten und Zahlungen

==================================================
31 – WICHTIGE BERECHNUNGSREGELN
==================================================

Definiere eine zentrale Finanzlogik.

UNTERSCHEIDE:

Geplante Kosten:
Was voraussichtlich ausgegeben wird.

Tatsächliche Kosten:
Was tatsächlich als Zahlung gebucht wurde.

Offene Beträge:
Was noch bezahlt werden muss.

Budgetrest:
Budgetbetrag minus tatsächliche
Ausgaben, klar getrennt von offenen Plänen.

Prognostizierter Budgetrest:
Budgetbetrag minus erwartete
Gesamtkosten.

Kontostand:
Anfangsbestand plus gebuchte
Einnahmen minus gebuchte Ausgaben
plus/minus Transfers.

Verfügbarer Betrag:
Eine klar definierte Planungskennzahl
unter Berücksichtigung erwarteter
Zahlungen und optionaler Reserven.

Sparquote:
Definiere nachvollziehbar,
welche Sparbeiträge und Einkommensarten
berücksichtigt werden.

Verhindere:
- Doppelte Transaktionen
- Doppelte Fixkostenbuchungen
- Doppelte Produktpreise
- Doppelte Alternativen
- Doppelte Transfers
- Verwechslung von Aufgabe und Zahlung

Teste die Berechnungen mit realistischen
Beispielkonstellationen.

==================================================
32 – BENUTZERFREUNDLICHKEIT
==================================================

Die App muss trotz vieler Funktionen
einfach bedienbar sein.

Implementiere:
- Onboarding
- Verständliche Formulare
- Gute Leerzustände
- Tooltips bei komplexen Kennzahlen
- Schnellerfassungsmenü
- Suchfunktion
- Drag & Drop
- Favoriten
- Undo bei geeigneten Aktionen
- Tastaturkürzel
- Mobile Bedienbarkeit
- Gespeicherte Filter

Jede sichtbare Funktion soll
tatsächlich nutzbar sein.

Keine funktionslosen Buttons.

==================================================
33 – PERFORMANCE UND SICHERHEIT
==================================================

Achte auf:
- Sichere Eingabevalidierung
- Dateigrößenlimits
- Dateitypvalidierung
- Sichere Dateipfade
- Schutz vor Path Traversal
- Vermeidung von XSS
- Sichere externe Links
- Transaktionale Datenbankoperationen
- Keine vertraulichen Daten in Logs
- Keine unnötigen Drittanbietertracker

Die App muss ohne Cloud-Konto
lokal nutzbar sein.

Für eine spätere Online-Version:
Plane sichere Authentifizierung,
Autorisierung und Nutzertrennung.

Eine lokale Einzelbenutzer-App darf
nicht ohne entsprechende Absicherung
öffentlich bereitgestellt werden.

==================================================
34 – AUTOMATISIERTE TESTS
==================================================

Implementiere Tests für:

- Budgetberechnung
- Budgetüberschreitung
- Restbudget
- Produktalternativen
- Mehrfachzahlungen
- Fixkostenintervalle
- Sparquote
- Transfers
- Kontostand
- Sparziele
- Prognosen
- Gehaltsberechnung
- Datenimport
- Dateiuploadvalidierung
- Relationen zwischen Datensätzen

E2E-Tests für:

1. Budget erstellen
2. Produkt hinzufügen
3. Bild hochladen
4. Produktlink speichern
5. Position abhaken
6. Zahlung erfassen
7. Dashboard aktualisieren
8. Sparziel erstellen
9. Projekt erstellen
10. Daten nach Neustart wiederfinden

==================================================
35 – UMSETZUNGSREIHENFOLGE
==================================================

Arbeite in realistischen Phasen.

PHASE 1 – FUNKTIONIERENDER KERN

- Projektsetup
- Designsystem
- Navigation
- Datenbank
- Einstellungen
- Konten
- Einnahmen
- Ausgaben
- Dashboard
- Budgets
- Budgetpositionen
- Checklisten

PHASE 2 – VISUELLE PLANUNG

- Produktbilder
- Produktlinks
- Galerieansicht
- Produktalternativen
- Bestellstatus
- Zahlungsstatus
- Projektmanagement
- Moodboards

PHASE 3 – FINANZINTELLIGENZ

- Fixkosten
- Sparziele
- Finanzkalender
- Finanzsimulationen
- Kauf-Simulator
- Statistiken
- Budgetvarianten

PHASE 4 – PREMIUM-FUNKTIONEN

- Vorlagen
- Belege
- Import/Export
- Benachrichtigungen
- Erweiterte Filter
- Dashboard-Anpassung
- Optionale KI-Vorbereitung

PHASE 5 – QUALITÄT

- Automatisierte Tests
- E2E-Tests
- Responsive Optimierung
- Barrierefreiheit
- Sicherheitsprüfung
- Performanceprüfung
- Fehlerbehebung
- Dokumentation

==================================================
36 – ABSCHLUSSANFORDERUNGEN
==================================================

Erstelle:
- Vollständigen Quellcode
- Prisma-Schema
- Migrationen
- Konfigurationsdateien
- Beispieldaten für optionalen Demo-Modus
- README
- Installationsanleitung
- Startbefehle
- Tests
- Dokumentation wichtiger Berechnungen

Führe die verfügbaren Prüfungen aus:
- TypeScript
- Linting
- Tests
- Build
- Datenbankmigrationen

Falls etwas nicht ausgeführt werden kann,
dokumentiere den Grund ausdrücklich.

Bei großem Umfang:
Arbeite schrittweise und priorisiere
einen vollständig nutzbaren Kern.

Dokumentiere offen, welche Funktionen
fertig, teilweise fertig oder noch
nicht implementiert sind.

Keine Fake-Implementierungen.

==================================================
37 – DEIN ARBEITSAUFTRAG
==================================================

Beginne jetzt mit der tatsächlichen
Entwicklung der FINOVA-Anwendung.

Untersuche zunächst, ob bereits ein
Projekt im aktuellen Repository existiert.

Falls ja:
Integriere dich in die bestehende
Architektur, ohne funktionierende
Bestandteile zu zerstören.

Falls nein:
Erstelle ein neues Next.js-Projekt.

Erstelle zunächst einen kurzen technischen
Umsetzungsplan und beginne danach direkt
mit der Implementierung.

Stelle keine unnötigen Rückfragen.
Treffe sinnvolle technische Entscheidungen
selbstständig.

Priorisiere funktionierenden Code vor
umfangreichen Erklärungen.

Arbeite in klaren, überprüfbaren Phasen.

Behebe auftretende Fehler, statt sie
nur zu beschreiben.

FINOVA soll eine hochwertige,
langfristig nutzbare Finanz-,
Budget- und Lebensplanungs-App werden.

START NOW.
