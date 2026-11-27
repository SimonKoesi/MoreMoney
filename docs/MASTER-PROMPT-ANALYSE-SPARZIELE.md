# MASTERPROMPT – Einnahmen- und Ausgabenanalyse & Sparziel-Manager

## 1. Aufgabenstellung

Du agierst als erfahrener Senior Full-Stack-Entwickler, Finanzsoftware-Architekt und Premium-UI/UX-Designer.

Erweitere meinen bestehenden Finanzplaner um zwei vollständig funktionsfähige Module:

- Einnahmen- und Ausgabenanalyse
- Intelligenter Sparziel-Manager

Der Schwerpunkt liegt auf einer optisch außergewöhnlich hochwertigen, modernen und intuitiven Benutzeroberfläche, kombiniert mit intelligenten Finanzberechnungen und automatisierten Prozessen.

Das Ergebnis soll sich wie eine professionelle Premium-Fintech-Anwendung anfühlen, nicht wie ein einfaches Haushaltsbuch oder ein generisches Admin-Dashboard.

Analysiere zunächst die bestehende Projektstruktur, Datenbank, Komponenten, Navigation und das Designsystem. Integriere die Erweiterungen nahtlos, ohne bestehende Funktionen zu beschädigen oder vorhandene Daten zu verlieren.

Implementiere echte Funktionalität statt statischer Demonstrationen, funktionsloser Buttons oder fest codierter Beispieldaten.

---

# 2. Einnahmen- und Ausgabenanalyse

## 2.1 Zentrales Dashboard

Erstelle ein hochwertiges Analyse-Dashboard mit folgenden KPI-Karten:

- Gesamteinnahmen
- Gesamtausgaben
- Monatlicher Überschuss oder Fehlbetrag
- Verfügbares Restbudget
- Fixkosten
- Variable Ausgaben
- Sparquote
- Durchschnittliche tägliche Ausgaben
- Prognostizierte Ausgaben zum Monatsende

Jede KPI-Karte soll enthalten:

- Passendes minimalistisches Icon
- Prominent dargestellten Geldbetrag
- Verständliche Bezeichnung
- Prozentuale Veränderung zum Vergleichszeitraum
- Trendindikator
- Optional ein kleines Sparkline-Diagramm
- Tooltip zur Berechnungsgrundlage

Verwende positive und negative Farben kontextabhängig. Sinkende Ausgaben können beispielsweise positiv sein, sinkende Einnahmen dagegen negativ.

## 2.2 Interaktives Donut-Diagramm

Erstelle ein modernes, großes Donut-Diagramm für die Ausgabenverteilung.

Beispielhafte Kategorien und Beträge:

- Wohnen: 900 €
- Lebensmittel: 390 €
- Auto & Mobilität: 330 €
- Freizeit: 240 €
- Shopping: 170 €
- Sonstiges: 150 €

Gesamtausgaben: 2.180 €

Diese Werte dienen ausschließlich als Designreferenz. Die tatsächlichen Werte müssen dynamisch aus den vorhandenen Transaktionen berechnet werden.

Designanforderungen:

- Hochwertiges Ringdiagramm
- Abgerundete Segmentenden mit dezenten Zwischenräumen
- Harmonische, moderne Farbpalette
- Gesamtbetrag prominent in der Mitte
- Sanfte Ladeanimation
- Interaktive Segmente
- Hover- und Touch-Effekte
- Tooltips mit Betrag und prozentualem Anteil
- Legende mit Kategorien, Farbmarkierungen und Geldbeträgen
- Responsive Darstellung

Beim Anklicken einer Kategorie sollen sich automatisch die zugehörigen Transaktionen öffnen oder die Transaktionsliste entsprechend gefiltert werden.

Ordne jeder Kategorie eine konsistente Farbe und ein passendes Icon zu.

Beispielhafte Farbpalette:

- Wohnen: Indigo
- Lebensmittel: Emerald
- Mobilität: Blau
- Freizeit: Violett
- Shopping: Amber
- Sonstiges: Slate

Unterstütze individuell anpassbare Kategorien, Unterkategorien, Farben und Icons.

## 2.3 Einnahmen- und Ausgabenvergleich

Implementiere ein interaktives Balken- oder Flächendiagramm mit:

- Einnahmen
- Ausgaben
- Überschuss
- Sparquote
- Durchschnittswerten
- Optionalem Vergleich zum Vorjahr

Unterstütze folgende Zeiträume:

- Diese Woche
- Dieser Monat
- Letzter Monat
- Letzte 3 Monate
- Letzte 6 Monate
- Dieses Jahr
- Letztes Jahr
- Gesamter Zeitraum
- Benutzerdefinierter Zeitraum

Ermögliche eine tägliche, wöchentliche, monatliche und jährliche Gruppierung.

Beim Wechsel des Zeitraums sollen sich sämtliche KPI-Karten, Diagramme und Auswertungen automatisch aktualisieren.

## 2.4 Intelligente Kategorisierung

Ordne Transaktionen automatisch passenden Kategorien zu.

Berücksichtige:

- Zahlungsempfänger
- Verwendungszweck
- Betrag
- Vorherige Zuordnungen
- Wiederkehrende Zahlungen
- Individuelle Kategorisierungsregeln
- Daten der vorhandenen Bankanbindung

Beispiele:

- REWE, EDEKA und ALDI → Lebensmittel
- Shell und Aral → Mobilität
- Netflix und Spotify → Abonnements
- Arbeitgeber → Gehalt

Der Nutzer muss jede automatische Zuordnung korrigieren können.

Lerne aus manuellen Korrekturen, indem dauerhaft individuelle Regeln gespeichert werden.

Ermögliche das Aufteilen einer Transaktion auf mehrere Kategorien.

Interne Kontoüberträge dürfen nicht als Einnahmen oder Ausgaben doppelt erfasst werden.

## 2.5 Budget-Manager

Entwickle ein individuelles Budgetsystem.

Der Nutzer soll Budgets für folgende Bereiche erstellen können:

- Gesamtausgaben
- Einzelne Kategorien
- Unterkategorien
- Benutzerdefinierte Bereiche

Jedes Budget unterstützt:

- Name
- Kategorie
- Budgetbetrag
- Zeitraum
- Startdatum
- Wiederholung
- Individuelle Warnschwellen
- Optionalen Übertrag nicht verbrauchter Beträge

Visualisiere jedes Budget mit einer modernen Fortschrittsanzeige.

Zeige:

- Verbrauchtes Budget
- Gesamtes Budget
- Verbleibenden Betrag
- Prozentuale Auslastung
- Verbleibende Tage
- Durchschnittlich verfügbaren Betrag pro Tag
- Prognose zum Monatsende

Nutze folgende standardmäßige Statuslogik:

- Unter 70 %: Grün
- 70 bis unter 90 %: Gelb
- 90 bis 100 %: Orange
- Über 100 %: Rot

Ergänze verständliche Statustexte und Icons, damit die Information nicht ausschließlich durch Farben vermittelt wird.

Zeige Budgetüberschreitungen ausdrücklich an.

Ermögliche optionale Benachrichtigungen bei 75 %, 90 % und 100 % Budgetauslastung.

## 2.6 Wiederkehrende Zahlungen

Erkenne automatisch:

- Gehaltseingänge
- Miete
- Versicherungen
- Abonnements
- Kreditraten
- Daueraufträge
- Regelmäßige Sparbeträge
- Sonstige wiederkehrende Zahlungen

Zeige erkannte Zahlungen als bestätigbare Vorschläge an.

Erstelle eine Übersicht der erwarteten Einnahmen und Ausgaben für die kommenden Tage, Wochen und Monate.

Verknüpfe diese Funktion mit dem vorhandenen Abo-Manager und Finanzkalender.

Vermeide eine doppelte Berücksichtigung bereits gebuchter Zahlungen.

## 2.7 Intelligente Finanzanalyse

Erstelle einen Bereich namens „Finanz-Insights“.

Generiere verständliche, personalisierte Erkenntnisse anhand der tatsächlichen Finanzdaten.

Beispielhafte Erkenntnisse:

- Deine Lebensmittelausgaben sind diesen Monat um 12 % gesunken.
- Du hast bereits 85 % deines Freizeitbudgets verbraucht.
- Deine Fixkosten entsprechen 42 % deiner monatlichen Einnahmen.
- Deine Shopping-Ausgaben liegen über deinem Durchschnitt.
- Bei deinem aktuellen Ausgabeverhalten könntest du dein Monatsbudget überschreiten.
- Deine Sparquote hat sich gegenüber dem Vormonat verbessert.
- Deine Abonnementkosten sind gestiegen.

Erstelle die Erkenntnisse zunächst regelbasiert und nachvollziehbar. Eine externe KI-Anbindung ist optional und darf keine sensiblen Finanzdaten ohne geeignete Rechtsgrundlage und transparente Nutzerinformation übertragen.

Zeige zu jeder Erkenntnis die zugrunde liegenden Daten an.

## 2.8 Finanz-Heatmap

Erstelle eine interaktive Kalender-Heatmap für tägliche Ausgaben.

Anforderungen:

- Kalenderdarstellung für das gesamte Jahr
- Farbintensität abhängig von der Ausgabenhöhe
- Anzeige ausgabenfreier Tage
- Tooltip mit Datum, Gesamtbetrag und Transaktionsanzahl
- Klick auf einen Tag öffnet die zugehörigen Transaktionen
- Filter nach Kategorie
- Monats- und Jahresansicht
- Anpassbare Farbskala

Die Darstellung soll sich an modernen Activity-Heatmaps orientieren.

## 2.9 Jahresübersicht und Finance Wrapped

Erstelle eine ausführliche Jahresauswertung mit:

- Gesamteinnahmen
- Gesamtausgaben
- Jahresüberschuss
- Durchschnittlicher Sparquote
- Durchschnittlichen Monatsausgaben
- Teuerstem Monat
- Sparsamstem Monat
- Größter Ausgabenkategorie
- Anzahl der Transaktionen
- Anzahl ausgabenfreier Tage
- Entwicklung gegenüber dem Vorjahr
- Erreichten Sparzielen
- Vermögensentwicklung

Erstelle zusätzlich eine visuell hochwertige, optionale „Finance Wrapped“-Ansicht.

Verwende große typografische Kennzahlen, moderne Diagramme und dezente Übergangsanimationen.

## 2.10 Filter und Transaktionsübersicht

Implementiere eine leistungsfähige Filterfunktion:

- Zeitraum
- Kategorie
- Unterkategorie
- Bankkonto
- Betrag von/bis
- Zahlungsempfänger
- Einnahme oder Ausgabe
- Wiederkehrende Zahlungen
- Zahlungsmethode
- Individuelle Tags
- Suchbegriff

Unterstütze Sortierung, Mehrfachauswahl, Massenbearbeitung und gespeicherte Filter.

Ermögliche CSV-, Excel- und PDF-Exporte.

---

# 3. Intelligenter Sparziel-Manager

## 3.1 Sparziel-Dashboard

Erstelle einen eigenständigen Bereich „Meine Sparziele“.

Das Dashboard soll folgende Kennzahlen enthalten:

- Insgesamt angespartes Kapital
- Summe aller Sparziele
- Gesamtfortschritt
- Anzahl aktiver Sparziele
- Anzahl erreichter Sparziele
- Monatliche Gesamtsparrate
- Nächstes voraussichtlich erreichtes Sparziel
- Noch benötigtes Kapital

Visualisiere den Gesamtfortschritt durch eine große, moderne Fortschrittsanzeige.

Unterstütze aktive, pausierte, abgeschlossene und archivierte Sparziele.

## 3.2 Premium-Sparzielkarten

Gestalte jedes Sparziel als individuell gestaltete, hochwertige Dashboard-Karte.

Beispielhafte Sparziele:

- Neues Auto: 8.500 € von 15.000 € – 57 %
- Urlaub: 1.800 € von 2.500 € – 72 %
- Notgroschen: 4.200 € von 6.000 € – 70 %
- Eigenheim: 12.000 € von 50.000 € – 24 %

Diese Werte dienen ausschließlich als Designreferenz.

Jede Karte enthält:

- Individuelles Icon oder optionales Titelbild
- Name des Sparziels
- Aktuell angesparten Betrag
- Zielbetrag
- Prozentualen Fortschritt
- Animierten Fortschrittsbalken
- Noch fehlenden Betrag
- Monatliche Sparrate
- Voraussichtliches Erreichungsdatum
- Optionales Wunschdatum
- Status der Zielerreichung
- Priorität
- Schnellaktion für eine Einzahlung
- Kontextmenü zum Bearbeiten, Pausieren oder Archivieren

Verwende individuell einstellbare Akzentfarben.

Beispiele:

- Auto: Blau
- Urlaub: Türkis oder Emerald
- Notgroschen: Violett
- Eigenheim: Gold oder Amber

Die Sparzielkarten sollen auf Desktop in einem responsiven Grid und auf Mobilgeräten übersichtlich untereinander dargestellt werden.

Ermögliche alternativ eine kompakte Listenansicht.

## 3.3 Sparziele erstellen und verwalten

Erstelle einen modernen, geführten Dialog zum Anlegen eines Sparziels.

Folgende Angaben sollen möglich sein:

- Name
- Beschreibung
- Kategorie
- Zielbetrag
- Bereits angesparter Betrag
- Monatliche Sparrate
- Startdatum
- Optionales Wunschdatum
- Priorität
- Zugeordnetes Bankkonto
- Farbe
- Icon
- Eigenes Titelbild
- Automatische oder manuelle Besparung
- Optionale Verzinsung

Biete vorbereitete Vorlagen an:

- Neues Auto
- Urlaub
- Eigenheim
- Notgroschen
- Hochzeit
- Altersvorsorge
- Elektronik
- Führerschein
- Weiterbildung
- Möbel
- Finanzielle Freiheit
- Individuelles Sparziel

Der Nutzer muss sämtliche Angaben jederzeit bearbeiten können.

## 3.4 Intelligente Sparzielberechnung

Berechne automatisch:

Fortschritt = angesparter Betrag / Zielbetrag × 100

Restbetrag = Zielbetrag − angesparter Betrag

Benötigte Monate = Restbetrag / monatliche Sparrate, auf volle Monate aufgerundet.

Berechne alternativ die benötigte monatliche Sparrate anhand des gewünschten Zieldatums und der verbleibenden geplanten Einzahlungstermine.

Berücksichtige optional Zinsen beziehungsweise Renditeannahmen, sofern diese aktiviert wurden.

Berücksichtige außerdem:

- Unregelmäßige Einzahlungen
- Einmalige Sonderzahlungen
- Entnahmen
- Pausierte Sparraten
- Änderungen des Zielbetrags
- Unterschiedliche Sparintervalle
- Bereits erreichte Ziele

Behandle Sonderfälle wie eine Sparrate von 0 €, bereits überschrittene Zielbeträge und vergangene Wunschtermine korrekt.

Zeige bei fehlenden Eingaben keine unrealistischen Prognosen an.

## 3.5 Zielerreichungsstatus

Erstelle ein intelligentes Statussystem:

- Im Zeitplan
- Dem Zeitplan voraus
- Hinter dem Zeitplan
- Sparrate fehlt
- Pausiert
- Ziel erreicht

Vergleiche die tatsächliche Sparentwicklung mit dem geplanten Verlauf.

Zeige beispielsweise:

„Bei deiner aktuellen Sparrate erreichst du dein Ziel voraussichtlich im Dezember 2027.“

Oder:

„Um dein Wunschdatum zu erreichen, müsstest du monatlich zusätzlich 75 € sparen.“

Kommuniziere Empfehlungen neutral und ohne unnötigen Druck.

## 3.6 Interaktiver Sparziel-Simulator

Implementiere einen interaktiven Simulator für jedes Sparziel.

Der Nutzer kann über Slider oder Eingabefelder folgende Werte verändern:

- Monatliche Sparrate
- Zielbetrag
- Wunschdatum
- Einmalige Sonderzahlung
- Startkapital
- Optionale Verzinsung

Aktualisiere sämtliche Berechnungen in Echtzeit.

Zeige:

- Neues voraussichtliches Erreichungsdatum
- Benötigte monatliche Sparrate
- Eingezahltes Kapital
- Mögliche Zinserträge
- Zeitersparnis gegenüber dem bisherigen Plan
- Visualisierten Sparverlauf

Verändere bestehende Sparziele erst dauerhaft, wenn der Nutzer die Simulation ausdrücklich übernimmt.

## 3.7 Sparverlaufsdiagramm

Erstelle ein hochwertiges interaktives Liniendiagramm mit:

- Tatsächlichem Sparverlauf
- Geplantem Sparverlauf
- Prognostiziertem Sparverlauf
- Horizontaler Zielbetragslinie
- Markierung des Wunschdatums
- Einzahlungen und Sonderzahlungen
- Erreichten Meilensteinen

Stelle tatsächliche Daten mit einer durchgezogenen Linie und prognostizierte Daten mit einer gestrichelten Linie dar.

Verwende dezente Flächenfüllungen und interaktive Tooltips.

Unterstütze verschiedene Zeiträume und eine Detailansicht einzelner Einzahlungen.

## 3.8 Virtuelle Spartöpfe

Implementiere virtuelle Spartöpfe innerhalb der Anwendung.

Ein Nutzer kann vorhandenes Geld gedanklich verschiedenen Sparzielen zuordnen, ohne dass tatsächlich eine Banküberweisung durchgeführt wird.

Zeige eindeutig an:

- Tatsächliches Kontoguthaben
- Bereits zugeordnetes Kapital
- Noch nicht zugeordnetes Kapital
- Frei verfügbares Guthaben

Verhindere, dass derselbe Geldbetrag mehreren Sparzielen gleichzeitig zugeordnet wird.

Virtuelle Spartöpfe dürfen das tatsächliche Nettovermögen nicht künstlich erhöhen.

Ermögliche das Umbuchen zwischen virtuellen Spartöpfen und das Auflösen einer Zuordnung.

## 3.9 Automatische Sparverteilung

Erstelle eine optionale intelligente Sparverteilung.

Der Nutzer kann einen monatlich verfügbaren Sparbetrag definieren.

Dieser Betrag kann auf unterschiedliche Ziele verteilt werden:

- Gleichmäßig
- Prozentual
- Nach Priorität
- Nach gewünschtem Zieldatum
- Nach verbleibendem Kapitalbedarf
- Individuell

Zeige bei jeder Änderung eine Vorschau der Auswirkungen auf alle Sparziele.

Wenn ein Sparziel vollständig erreicht wurde, kann dessen bisherige Sparrate nach ausdrücklicher Zustimmung auf andere Ziele verteilt werden.

Die gesamte geplante Sparrate muss mit dem verfügbaren Finanzbudget abgeglichen werden.

Warne vor nicht finanzierbaren Sparplänen.

Führe keine echten Banküberweisungen durch. Die automatische Sparverteilung ist zunächst eine interne Planungs- und Zuordnungsfunktion.

## 3.10 Sparhistorie

Speichere sämtliche Sparzielbewegungen:

- Einzahlungen
- Sonderzahlungen
- Entnahmen
- Umbuchungen
- Änderungen der Sparrate
- Änderungen des Zielbetrags
- Statusänderungen
- Zielerreichung

Erstelle eine übersichtliche Timeline mit Datum, Betrag und Beschreibung.

Ermögliche die Korrektur fehlerhafter Einträge mit nachvollziehbarer Änderungshistorie.

## 3.11 Meilensteine und Motivation

Implementiere dezente Fortschritts-Meilensteine:

- Erste Einzahlung
- 10 % erreicht
- 25 % erreicht
- 50 % erreicht
- 75 % erreicht
- 90 % erreicht
- 100 % erreicht

Bei einem erreichten Sparziel kann eine kurze, hochwertige Erfolgsanimation angezeigt werden.

Optional:

- Dezenter Konfetti-Effekt
- Persönliche Erfolgsnachricht
- Erreichungsdatum
- Tatsächliche Spardauer
- Vergleich mit ursprünglichem Wunschdatum
- Übersicht aller abgeschlossenen Sparziele

Vermeide übertriebene Gamification, aufdringliche Belohnungssysteme und negative Bestrafungen.

---

# 4. Modulübergreifende Vernetzung

Verknüpfe die neuen Funktionen mit allen bereits vorhandenen Modulen.

- Bankanbindung
- Abo-Manager
- Vermögensübersicht
- Datenschutzcenter
- Transaktionsverwaltung
- Finanzkalender
- Bestehendes Hauptdashboard

Beispiele:

- Importierte Banktransaktionen aktualisieren automatisch die Ausgabenanalyse.
- Abonnements werden als wiederkehrende Fixkosten berücksichtigt.
- Einsparungen durch gekündigte Abonnements können einem Sparziel zugeordnet werden.
- Überschüssiges Monatsbudget kann als zusätzliche Sparrate vorgeschlagen werden.
- Bankkonten können mit virtuellen Spartöpfen verbunden werden.
- Sparziele werden in zukünftigen Finanzprognosen berücksichtigt.
- Sparzielzuordnungen verändern nicht das tatsächliche Nettovermögen.
- Der globale Privacy Mode blendet alle sensiblen Beträge aus.

Verwende eine zentrale Datenbasis und vermeide doppelte Buchungen oder widersprüchliche Finanzberechnungen.

---

# 5. Premium UI/UX Design

Dieser Abschnitt besitzt besonders hohe Priorität.

Orientiere dich hinsichtlich visueller Qualität und Benutzerfreundlichkeit an modernen Anwendungen wie Apple Wallet, Revolut, Linear, Copilot Money und hochwertigen Fintech-Dashboards, ohne deren Design direkt zu kopieren.

## Visuelle Gestaltung

- Modernes, minimalistisches Premium-Design
- Großzügige Abstände
- Klare visuelle Hierarchie
- Hochwertige Typografie
- Prominente Finanzkennzahlen
- Konsistente Kartenlayouts
- Abgerundete Ecken
- Dezente Rahmen und Schatten
- Harmonische Akzentfarben
- Übersichtliche Navigation
- Intuitive Interaktionen
- Konsistentes Icon-System

Vermeide generische Admin-Templates, übermäßige Farbverläufe, grelle Farben, übertriebenes Glassmorphism und unnötig verschachtelte Karten.

## Typografie

Verwende eine moderne Schriftart wie Inter oder eine bereits im Projekt vorhandene hochwertige Schriftart.

- Große Finanzkennzahlen: 28–40 px
- Seitenüberschriften: 24–32 px
- Kartenüberschriften: 15–18 px
- Sekundärinformationen: 12–14 px
- Tabellarische Ziffern für Geldbeträge

Passe die Größen responsiv an.

## Karten und Layout

- Border-Radius zwischen 12 und 20 px
- Konsistente Innenabstände
- Feine Rahmen
- Dezente Hover-Effekte
- Einheitliche Kartenhöhen innerhalb zusammengehöriger Bereiche
- Responsive Grid-Systeme
- Keine unnötigen Leerflächen
- Keine überladenen Informationsbereiche

## Diagramme

Sämtliche Diagramme müssen professionell gestaltet sein:

- Interaktive Tooltips
- Animierte Übergänge
- Abgerundete Balken
- Dezente Gitternetzlinien
- Verständliche Achsenbeschriftungen
- Konsistente Farbzuordnung
- Responsive Skalierung
- Unterstützung von Light Mode und Dark Mode
- Tastatur- und Touch-Bedienung
- Alternative textliche Darstellung wichtiger Werte

Verwende vorhandene Chart-Bibliotheken oder integriere eine geeignete Bibliothek passend zum bestehenden Technologie-Stack.

## Animationen

Implementiere dezente Microinteractions:

- Animierte Fortschrittsbalken
- Sanftes Einblenden von Karten
- Flüssige Diagrammaktualisierungen
- Hover-Animationen
- Animierte Filterwechsel
- Dezente Erfolgsanimationen
- Skeleton Loading während Datenabrufen

Animationen müssen performant sein und die Systemeinstellung für reduzierte Bewegung berücksichtigen.

## Dark Mode

Erstelle einen hochwertigen Dark Mode.

Verwende beispielsweise:

- Seitenhintergrund: #0B0F19
- Kartenhintergrund: #131A28
- Sekundäre Flächen: #1C2536
- Rahmen: #263244
- Primärer Text: #F1F5F9
- Sekundärer Text: #94A3B8
- Primärer Akzent: #818CF8
- Positive Werte: #34D399
- Warnungen: #FBBF24
- Negative Werte: #F87171

Diese Farben dienen als Orientierung. Das vorhandene Designsystem hat Vorrang, sofern bereits ein konsistentes System existiert.

Verwende Design-Tokens für sämtliche Farben, Abstände, Schriftgrößen und Rundungen.

## Responsive Design

Desktop:

- Mehrspaltige Dashboard-Layouts
- Große interaktive Diagramme
- Zwei bis vier Sparzielkarten pro Reihe
- Übersichtlich angeordnete KPI-Karten

Tablet:

- Flexible zweispaltige Layouts
- Angepasste Navigation
- Touch-optimierte Interaktionen

Smartphone:

- Einspaltiges Layout
- Optimierte Diagramme
- Große Touch-Flächen
- Kompakte Kennzahlen
- Einfach erreichbare Hauptaktionen
- Kein horizontaler Seitenüberlauf

## Empty States und Fehlerzustände

Erstelle ansprechende Zustände für:

- Noch keine Transaktionen
- Noch keine Sparziele
- Keine Ergebnisse für gewählte Filter
- Fehlende Bankanbindung
- Ladefehler
- Fehlende Prognosedaten
- Erreichte Sparziele

Jeder Zustand soll dem Nutzer eine verständliche nächste Handlung anbieten.

---

# 6. Technische Anforderungen

- Bestehenden Technologie-Stack berücksichtigen
- Wiederverwendbare Komponenten entwickeln
- Saubere Datenbankmodelle erstellen
- Finanzberechnungen zentralisieren
- Keine fest codierten Beispieldaten in der Produktivansicht
- Präzise Dezimalberechnungen für Geldbeträge
- Deutsche Zahlen- und Datumsformatierung
- Euro als Standardwährung
- Unterstützung weiterer Währungen
- Persistente Benutzereinstellungen
- Sichere Datenverarbeitung
- Vollständige Integration des globalen Privacy Mode
- Automatische Aktualisierung relevanter Ansichten
- Performante Diagramme
- Effiziente Datenbankabfragen
- Fehlerbehandlung
- Automatisierte Tests

Sensible Finanzdaten dürfen nicht in Logs, ungeschützten Caches oder externen Analysewerkzeugen erscheinen.

Teste besonders:

- Budgetberechnungen
- Monats- und Jahreswechsel
- Sparzielprognosen
- Änderungen von Sparraten
- Erreichte und pausierte Sparziele
- Interne Kontoüberträge
- Virtuelle Spartöpfe
- Doppelte Zuordnungen
- Fremdwährungen
- Fehlende Daten
- Responsive Darstellung
- Dark Mode
- Privacy Mode

---

# 7. Abschluss und Umsetzung

Setze sämtliche Funktionen tatsächlich im bestehenden Projekt um.

Arbeite systematisch:

1. Bestehende Anwendung analysieren.
2. Datenmodelle und Finanzberechnungen vorbereiten.
3. Einnahmen- und Ausgabenanalyse implementieren.
4. Budget-Manager integrieren.
5. Sparziel-Manager implementieren.
6. Sparziel-Simulator erstellen.
7. Virtuelle Spartöpfe integrieren.
8. Alle Module miteinander verknüpfen.
9. Premium-UI und responsive Ansichten optimieren.
10. Funktionen und Berechnungen testen.
11. Fehler beheben.
12. Abschließende Dokumentation erstellen.

Prüfe abschließend, dass sämtliche Buttons, Filter, Diagramme, Eingabefelder, Berechnungen und Dialoge tatsächlich funktionieren.

Liefere eine Zusammenfassung der implementierten Funktionen, geänderten Dateien, Testergebnisse und bekannten Einschränkungen.

Das Endergebnis soll ein optisch hochwertiges, intuitives und intelligentes Finanzdashboard sein, das dem Nutzer nicht nur seine bisherige finanzielle Entwicklung zeigt, sondern ihn aktiv bei der Planung seiner finanziellen Zukunft unterstützt.