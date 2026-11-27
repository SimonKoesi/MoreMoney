# MASTERPROMPT – Finance Intelligence, Financial Health Score & Premium Navigation

## 1. Rolle und Zielsetzung

Du agierst gleichzeitig als:

- Senior Full-Stack-Entwickler
- Finanzsoftware-Architekt
- Data Scientist
- Experte für Finanzmathematik
- KI- und LLM-Entwickler
- Premium-UI/UX-Designer
- IT-Sicherheits- und Datenschutzexperte

Erweitere meinen bestehenden Finanzplaner zu einem intelligenten, professionellen Finance OS.

Implementiere drei vollständig funktionsfähige und miteinander vernetzte Kernbereiche:

1. Financial Health Score
2. KI-Finanzassistent mit intelligenten Insights
3. Zentrale, moderne und intelligente Navigation

Die Qualität der Finanzberechnungen, die tatsächliche Funktionalität, die Sicherheit und das visuelle Erscheinungsbild besitzen höchste Priorität.

Analysiere zunächst den bestehenden Code, die Projektstruktur, Datenbank, Architektur, Komponenten, Finanzberechnungen und das vorhandene Designsystem.

Nutze bestehende Funktionen und Datenmodelle weiter, anstatt unnötig parallele Systeme zu erstellen.

Entwickle keine statischen Mockups, keine fest codierten Bewertungen, keine zufälligen KI-Ergebnisse und keine funktionslosen Buttons.

Das Ergebnis soll sich wie eine hochwertige, ausgereifte Premium-Fintech-Anwendung anfühlen.

---

# 2. Financial Health Score

## 2.1 Grundprinzip

Entwickle einen mathematisch nachvollziehbaren Finanzgesundheitsindex zwischen 0 und 100 Punkten.

Der Score soll die finanzielle Stabilität, Liquidität, Belastbarkeit und langfristige Entwicklung des Nutzers bewerten.

Er darf nicht auf subjektiven KI-Einschätzungen oder zufällig generierten Zahlen basieren.

Sämtliche Berechnungen erfolgen über eine zentrale, deterministische und getestete Financial Health Engine.

Bei identischen Eingangsdaten muss immer derselbe Score entstehen.

Der Score ist ein eigener persönlicher Orientierungswert und darf nicht als offizieller Bonitätsscore, SCHUFA-Score oder wissenschaftlich validierte Finanzbewertung ausgegeben werden.

## 2.2 Gewichtung

Verwende folgendes versioniertes Standard-Bewertungsmodell:

| Bewertungsbereich | Gewichtung |
|---|---:|
| Liquidität und Notgroschen | 25 % |
| Cashflow und Sparquote | 25 % |
| Schulden und Kreditbelastung | 20 % |
| Budget und Ausgabenstabilität | 15 % |
| Finanzielle Zukunftsvorsorge | 10 % |
| Zahlungsverpflichtungen | 5 % |

Jeder Bereich wird separat zwischen 0 und 100 Punkten bewertet.

Gesamtscore = Summe aller gewichteten Teilbewertungen.

Runde ausschließlich das endgültige Ergebnis für die Benutzeroberfläche.

Speichere die exakten Werte intern.

Die Gewichtungen und Schwellenwerte sind dokumentierte Modellannahmen und keine universell gültigen wissenschaftlichen Grenzwerte.

Implementiere eine versionierte Konfiguration, sodass die Berechnungslogik später verbessert werden kann.

## 2.3 Liquidität und Notgroschen – 25 %

Berechne die finanzielle Widerstandsfähigkeit bei unerwarteten Ausgaben oder Einkommensausfällen.

Berücksichtige:

- Girokontoguthaben
- Tagesgeld
- Verfügbares Bargeld
- Kurzfristig verfügbare Rücklagen
- Reservierte finanzielle Verpflichtungen
- Notwendige monatliche Lebenshaltungskosten
- Kurzfristige Verbindlichkeiten

Nicht als sofort verfügbare Notfallreserve berücksichtigen:

- Immobilienwerte
- Fahrzeuge
- Nicht kurzfristig verfügbare Anlagen
- Zweckgebundene Sparbeträge
- Ungenutzte Kreditlinien
- Nicht realisierte zukünftige Einnahmen

Berechnung:

Notfallreserve = liquide Mittel abzüglich zweckgebundener Beträge und unmittelbar fälliger Verpflichtungen.

Reichweite = verfügbare Notfallreserve / durchschnittliche notwendige monatliche Ausgaben.

Verwende möglichst einen repräsentativen Zeitraum von sechs Monaten für die Berechnung notwendiger Ausgaben.

Standardbewertung:

| Finanzielle Reichweite | Punkte |
|---|---:|
| 0 Monate | 0 |
| 0,5 Monate | 15 |
| 1 Monat | 30 |
| 2 Monate | 50 |
| 3 Monate | 70 |
| 4 Monate | 82 |
| 5 Monate | 92 |
| 6 Monate oder mehr | 100 |

Interpoliere linear zwischen den definierten Schwellenwerten, um abrupte und unlogische Bewertungssprünge zu vermeiden.

Berücksichtige unterschiedliche Lebenssituationen:

- Angestellte
- Selbstständige
- Unregelmäßige Einkommen
- Familien
- Rentner
- Personen mit erhöhten finanziellen Verpflichtungen

Ermögliche ein individuell festgelegtes Notgroschenziel. Halte die Bewertungsgrundlage transparent und kennzeichne individuelle Abweichungen.

## 2.4 Cashflow und Sparquote – 25 %

Unterteile diesen Bereich intern in:

- Nachhaltiger monatlicher Überschuss: 55 %
- Stabilität des Cashflows: 25 %
- Tatsächliche Sparquote: 20 %

### Nachhaltiger Überschuss

Berechne den durchschnittlichen bereinigten monatlichen Überschuss anhand der letzten sechs vollständig erfassten Monate.

Bereinigter Cashflow = regelmäßige Nettoeinnahmen minus tatsächliche Lebenshaltungskosten, Steuern und verpflichtende Zahlungen einschließlich Kreditraten.

Vermeide die doppelte Berücksichtigung von Kreditraten oder anderen Zahlungen.

Schließe aus:

- Interne Kontoüberträge
- Kreditaufnahmen als vermeintliches Einkommen
- Verkäufe vorhandener Vermögenswerte als regelmäßiges Einkommen
- Nicht realisierte Kursgewinne
- Doppelte Transaktionen

Behandle einmalige Bonuszahlungen separat.

Berechne:

Überschussquote = nachhaltiger monatlicher Überschuss / regelmäßiges Nettoeinkommen × 100.

Standardbewertung:

| Überschussquote | Punkte |
|---|---:|
| −10 % oder weniger | 0 |
| 0 % | 25 |
| 5 % | 45 |
| 10 % | 65 |
| 15 % | 80 |
| 20 % | 90 |
| 30 % oder mehr | 100 |

Verwende lineare Interpolation.

### Cashflow-Stabilität

Berechne den Anteil vollständig erfasster Monate mit nichtnegativem bereinigtem Cashflow.

Berücksichtige wiederkehrende Defizite stärker als einmalige außergewöhnliche Ausgaben.

Dokumentiere außergewöhnliche Ereignisse, statt diese automatisch aus der Bewertung zu entfernen.

### Tatsächliche Sparquote

Ermittle den tatsächlich aus laufendem Einkommen finanzierten Vermögensaufbau.

Berücksichtige:

- Nettoeinzahlungen in Rücklagen
- Nettoinvestitionen
- Nachweislich angesparte Überschüsse
- Optional Kredittilgungsanteile als separat ausgewiesenen Vermögensaufbau

Einlagen aus bereits vorhandenem Vermögen dürfen nicht als neue Ersparnis gelten.

Verhindere Mehrfachzählungen zwischen Sparzielen, Tagesgeldkonten und Depots.

Definiere eine dokumentierte Bewertungskurve zwischen 0 % und 25 % Sparquote.

Bei fehlendem oder keinem regelmäßigen Einkommen muss ein sinnvoller Sonderfall verwendet werden, anstatt durch null zu dividieren oder willkürlich 0 Punkte zu vergeben.

## 2.5 Schulden und Kreditbelastung – 20 %

Bewerte nicht pauschal die Höhe aller Schulden, sondern insbesondere deren finanzielle Tragbarkeit.

Interne Gewichtung:

- Monatliche Schuldendienstquote: 60 %
- Belastung durch hochverzinste Schulden: 25 %
- Zahlungsrückstände: 15 %

Schuldendienstquote = verpflichtende monatliche Kreditraten / regelmäßiges monatliches Nettoeinkommen × 100.

Standardbewertung:

| Schuldendienstquote | Punkte |
|---|---:|
| 0 % | 100 |
| 10 % | 95 |
| 20 % | 80 |
| 30 % | 60 |
| 40 % | 35 |
| 50 % | 15 |
| 60 % oder mehr | 0 |

Verwende lineare Interpolation.

Berücksichtige zusätzlich:

- Dispokredite
- Kreditkartenschulden
- Konsumkredite
- Immobilienfinanzierungen
- Zinssätze
- Restschulden
- Zinsbindungsfristen
- Laufzeiten
- Zahlungsrückstände

Unterscheide zwischen besicherten Krediten und teuren unbesicherten Konsumschulden.

Ein tragbarer Immobilienkredit darf nicht allein aufgrund seiner absoluten Höhe zu einem schlechten Score führen.

Ermögliche eine konfigurierbare Definition hochverzinster Schulden.

Bewerte deren tatsächliche Belastung im Verhältnis zu Einkommen, Liquidität und Rückzahlungskapazität.

Keine Schulden ergeben grundsätzlich eine positive Bewertung, sofern die Daten vollständig sind.

Fehlende Schuldendaten dürfen jedoch nicht automatisch als Schuldenfreiheit interpretiert werden.

## 2.6 Budget und Ausgabenstabilität – 15 %

Interne Gewichtung:

- Fixkostenbelastung: 40 %
- Budgeteinhaltung: 35 %
- Stabilität notwendiger Ausgaben: 25 %

Berechne:

Fixkostenquote = regelmäßige notwendige Fixkosten / regelmäßiges Nettoeinkommen × 100.

Standardbewertung:

| Fixkostenquote | Punkte |
|---|---:|
| Bis 30 % | 100 |
| 40 % | 90 |
| 50 % | 75 |
| 60 % | 55 |
| 75 % | 25 |
| 90 % oder mehr | 0 |

Berücksichtige:

- Individuelle Budgets
- Regelmäßige Budgetüberschreitungen
- Ausgabentrends
- Schwankungen notwendiger Lebenshaltungskosten
- Steigende Fixkosten
- Wiederkehrende finanzielle Belastungen

Bewerte die Budgeteinhaltung betragsgewichtet und nicht einfach anhand der Anzahl eingehaltener Kategorien.

Überlappende Gesamt- und Unterbudgets dürfen nicht doppelt berücksichtigt werden.

Besonders sparsame Monate dürfen eine dauerhaft schlechte Ausgabenentwicklung nicht vollständig verdecken.

Unregelmäßige, aber erwartete Jahreskosten wie Versicherungen sollen angemessen periodisiert werden.

Fehlende individuelle Budgets werden als nicht bewertbar gekennzeichnet.

Notwendige Ausgaben wie medizinische Kosten dürfen nicht pauschal moralisch oder negativ bewertet werden.

## 2.7 Finanzielle Zukunftsvorsorge – 10 %

Bewerte, ob langfristige finanzielle Ziele realistisch geplant und finanziert sind.

Interne Gewichtung:

- Sparziel-Finanzierbarkeit: 40 %
- Tatsächliche Umsetzung der Sparpläne: 35 %
- Langfristige Vorsorgeplanung: 25 %

Berücksichtige:

- Aktive Sparziele
- Geplante und tatsächliche Sparraten
- Realistische Zieltermine
- Langfristige Rücklagen
- Altersvorsorge, sofern entsprechende Daten vorliegen
- Geplante größere Anschaffungen
- Deckung zukünftiger finanzieller Verpflichtungen

Berechne die Deckungsquote der Sparpläne:

Nachhaltig verfügbarer Sparbetrag / benötigter monatlicher Sparbetrag.

Eine vollständig finanzierbare Sparplanung erhält eine hohe Bewertung.

Verhindere, dass unrealistisch niedrige oder künstlich angelegte Sparziele den Score manipulieren.

Bewerte nicht einfach die Anzahl der Sparziele oder die absolute Vermögenshöhe.

Ein Nutzer ohne Aktien oder ETFs darf nicht automatisch eine schlechte Bewertung erhalten.

Eine bestimmte Anlageform darf nicht zwingend vorausgesetzt werden.

## 2.8 Zahlungsverpflichtungen – 5 %

Berücksichtige:

- Bekannte offene Rechnungen
- Überfällige Verpflichtungen
- Rücklastschriften
- Drohende Liquiditätsengpässe
- Nicht ausreichend gedeckte erwartete Zahlungen
- Kommende größere finanzielle Belastungen

Nutze ausschließlich bestätigte oder ausreichend belegte Informationen.

Keine erfundenen Zahlungsausfälle.

Keine Schlussfolgerung auf pünktliche Zahlungen, wenn keine Fälligkeitsinformationen vorliegen.

Erstelle eine nachvollziehbare Teilbewertung aus tatsächlich bekannten Zahlungsverpflichtungen und deren Deckung.

## 2.9 Umgang mit fehlenden Daten

Implementiere ein eigenständiges Datenqualitäts- und Datenabdeckungssystem.

Zeige an:

- Anzahl vollständig erfasster Monate
- Aktualität der Bankdaten
- Vollständigkeit bekannter Konten
- Vollständigkeit der Einkommensdaten
- Vollständigkeit der Verbindlichkeiten
- Anteil bewertbarer Finanzkennzahlen
- Fehlende Informationen

Erfinde niemals Finanzdaten.

Fehlende Daten dürfen weder automatisch als positive noch als negative Bewertung behandelt werden.

Berechne:

Datenabdeckung = Summe der Gewichte aller bewertbaren Einzelkennzahlen / Summe aller vorgesehenen Gewichte × 100.

Bei fehlenden Teilkennzahlen kann deren Gewicht innerhalb der verfügbaren Bewertung transparent neu normiert werden.

Verwende beispielsweise folgende Darstellungsregeln:

- Unter 50 % Datenabdeckung: kein Gesamtscore
- 50 bis unter 80 %: vorläufiger Score
- Ab 80 %: regulärer Score mit sichtbarer Datenabdeckung

Setze die Datenabdeckung nicht mit einer statistischen Wahrscheinlichkeit oder einer wissenschaftlich bestimmten Konfidenz gleich.

Veraltete Daten müssen entsprechend gekennzeichnet und bei Bedarf von der Berechnung ausgeschlossen werden.

Vergleiche historische Scores nur dann direkt, wenn die Bewertungsmethode und Datenabdeckung ausreichend vergleichbar sind.

## 2.10 Kritische Finanzwarnungen

Erstelle zusätzlich zum Gesamtscore unabhängige Warnindikatoren für:

- Negativen verfügbaren Kontostand
- Fehlenden finanziellen Puffer
- Wiederkehrenden negativen Cashflow
- Bekannte überfällige Rechnungen
- Hohe kurzfristige Kreditbelastungen
- Voraussichtlich ungedeckte notwendige Zahlungen

Eine kritische Warnung darf nicht durch gute Bewertungen in anderen Bereichen verborgen werden.

Zeige beispielsweise:

„Dein Gesamtscore ist stabil, allerdings besteht in den kommenden 14 Tagen ein möglicher Liquiditätsengpass.“

Verwende keine versteckten oder undokumentierten Score-Abzüge.

## 2.11 Score-Klassifizierung

Verwende folgende neutral formulierte Kategorien:

| Score | Bewertung |
|---|---|
| 0–19 | Kritischer Handlungsbedarf |
| 20–39 | Finanziell angespannt |
| 40–59 | Verbesserungspotenzial |
| 60–74 | Solide |
| 75–89 | Sehr stabil |
| 90–100 | Besonders widerstandsfähig |

Kommuniziere sachlich und lösungsorientiert.

Keine beschämenden Formulierungen und keine unnötige Angsterzeugung.

## 2.12 Score-Historie

Speichere:

- Gesamtscore
- Einzelbewertungen
- Berechnungsdatum
- Berechnungsversion
- Datenabdeckung
- Relevante Eingangskennzahlen
- Gründe für Veränderungen

Erstelle automatische Snapshots in sinnvollen Intervallen und bei wesentlichen Finanzänderungen.

Zeige:

- Monatsentwicklung
- Jahresentwicklung
- Höchsten bisherigen Score
- Veränderung zum Vormonat
- Veränderung zum Vorjahr
- Positive und negative Einflussfaktoren

Historische Scores dürfen bei Änderungen der Bewertungsformel nicht unbemerkt überschrieben werden.

## 2.13 Intelligenter Score-Simulator

Erstelle einen interaktiven Simulator.

Der Nutzer kann simulieren:

- Höhere monatliche Sparrate
- Gehaltserhöhung
- Reduzierte Fixkosten
- Kredittilgung
- Sondertilgung
- Aufbau eines Notgroschens
- Größere Anschaffungen
- Neue Kreditaufnahme
- Einkommensausfall

Berechne den Score über dieselbe Financial Health Engine neu.

Zeige:

- Aktuellen Score
- Simulierten Score
- Veränderung in Punkten
- Betroffene Bewertungsbereiche
- Finanzielle Auswirkungen
- Zugrunde liegende Annahmen

Eine Simulation darf die tatsächlichen Finanzdaten niemals ohne ausdrückliche Bestätigung verändern.

## 2.14 Persönlicher Verbesserungsplan

Erstelle priorisierte Maßnahmen zur Verbesserung der finanziellen Stabilität.

Beispiele:

- Notgroschen um 1.800 € erhöhen
- Monatliche Fixkosten um 80 € reduzieren
- Hochverzinste Schulden abbauen
- Sparrate anpassen
- Finanzierungslücke bei einem Sparziel schließen

Priorisiere Maßnahmen nicht ausschließlich nach Score-Punkten, sondern nach tatsächlichem Nutzen, Dringlichkeit, finanzieller Machbarkeit und möglichen Risiken.

Berechne den möglichen Score-Effekt jeder Maßnahme anhand einer isolierten Simulation.

Zeige keine garantierten Score-Verbesserungen.

## 2.15 Premium-Design des Financial Health Dashboards

Erstelle ein hochwertiges Dashboard mit:

- Großem animiertem Score-Ring
- Prominenter Punktzahl
- Verständlicher Statusbeschreibung
- Veränderung zum vorherigen Zeitraum
- Sichtbarer Datenabdeckung
- Sechs individuell gestalteten Bewertungsbereichen
- Interaktiven Fortschrittsbalken
- Score-Historie als Liniendiagramm
- Persönlichem Verbesserungsplan
- Interaktivem Score-Simulator
- Separaten Finanzwarnungen

Beim Anklicken eines Bewertungsbereichs öffnet sich eine Detailansicht mit:

- Exakter Teilbewertung
- Gewichtung
- Verwendeten Finanzdaten
- Berechnungsformel
- Bewertungskurve
- Einfluss auf den Gesamtscore
- Individuellen Verbesserungsmöglichkeiten

Jede Bewertung muss bis zu ihren Eingangsdaten nachvollziehbar sein.

---

# 3. KI-Finanzassistent – Finance Intelligence

## 3.1 Grundkonzept

Entwickle einen intelligenten, datenbasierten Finanzassistenten, der sämtliche relevanten Module des Finanzplaners versteht und miteinander verbinden kann.

Der Assistent ist kein generischer Chatbot.

Er soll tatsächliche Finanzdaten analysieren, konkrete Zusammenhänge erkennen, Berechnungen durchführen und personalisierte Handlungsmöglichkeiten aufzeigen.

Der Assistent muss unterscheiden zwischen:

- Tatsächlichen Finanzdaten
- Bestätigten zukünftigen Zahlungen
- Schätzungen
- Prognosen
- Modellrechnungen
- Allgemeinem Finanzwissen

Er darf niemals fehlende Daten erfinden.

## 3.2 Hybride KI-Architektur

Verwende eine mehrschichtige Architektur.

### Ebene 1 – Financial Data Engine

Zentrale Aufbereitung sämtlicher Finanzdaten:

- Transaktionen
- Bankkonten
- Kontostände
- Einnahmen
- Ausgaben
- Budgets
- Abonnements
- Sparziele
- Vermögenswerte
- Kredite
- Finanzkalender
- Financial Health Score
- Historische Entwicklungen

### Ebene 2 – Financial Calculation Engine

Deterministische Berechnung aller Finanzkennzahlen.

Die KI darf wichtige Geldbeträge, Sparprognosen, Kreditberechnungen und Score-Werte nicht frei schätzen.

Sämtliche Berechnungen werden über getestete Backend-Funktionen durchgeführt.

### Ebene 3 – Insight Engine

Regelbasierte und statistische Erkennung relevanter Finanzentwicklungen.

Diese Ebene funktioniert auch ohne externes Sprachmodell.

### Ebene 4 – LLM-Assistent

Das Sprachmodell dient zum:

- Verstehen von Nutzerfragen
- Auswählen geeigneter Finanzwerkzeuge
- Erklären berechneter Ergebnisse
- Erkennen relevanter Zusammenhänge
- Formulieren verständlicher Handlungsmöglichkeiten
- Erstellen personalisierter Zusammenfassungen

Implementiere eine Provider-Abstraktion für unterschiedliche KI-Anbieter und optional lokale Sprachmodelle.

Prüfe bei der Integration die tatsächliche API-Dokumentation des ausgewählten Anbieters.

Erfinde keine Schnittstellen.

## 3.3 Sichere Finanzwerkzeuge

Stelle dem Assistenten strukturierte, serverseitig abgesicherte Funktionen zur Verfügung.

Beispielhafte interne Funktionsnamen:

- getFinancialOverview()
- getIncomeSummary()
- getExpenseSummary()
- comparePeriods()
- getCategoryBreakdown()
- getBudgetStatus()
- getRecurringPayments()
- getUpcomingPayments()
- getSubscriptionSummary()
- getNetWorth()
- getSavingsGoals()
- forecastCashflow()
- calculateAffordablePurchase()
- simulateSavingsGoal()
- calculateDebtPayoff()
- calculateHealthScore()
- explainHealthScore()
- simulateHealthScore()
- detectFinancialAnomalies()
- getFinancialInsights()

Diese Funktionen sollen auf die vorhandenen Datenmodelle zugreifen.

Verwende strukturierte Parameter und validierte Rückgabewerte.

Alle Werkzeuge müssen serverseitig auf den angemeldeten Nutzer begrenzt sein.

Erlaube dem Sprachmodell keinen unbeschränkten Datenbankzugriff, keine beliebigen SQL-Abfragen und keinen direkten Zugriff auf Bankzugangsdaten.

## 3.4 Persönlicher Finanzchat

Erstelle eine hochwertige Chatoberfläche.

Der Nutzer soll beispielsweise fragen können:

- Wie viel Geld habe ich diesen Monat ausgegeben?
- Warum habe ich weniger Geld als letzten Monat?
- Welche Ausgaben sind besonders stark gestiegen?
- Wo kann ich realistisch 200 € im Monat sparen?
- Kann ich mir ein Auto für 15.000 € leisten?
- Wann erreiche ich mein Urlaubsziel?
- Wie verbessere ich meinen Financial Health Score?
- Welche Abonnements kosten mich am meisten?
- Wie hoch sind meine tatsächlichen Fixkosten?
- Wie entwickelt sich mein Vermögen?
- Was passiert bei drei Monaten ohne Einkommen?
- Wie wirkt sich eine Gehaltserhöhung aus?
- Wie viel kann ich zusätzlich sparen?
- Welche größeren Zahlungen stehen demnächst an?
- Wie hat sich meine finanzielle Situation im letzten Jahr verändert?

Der Assistent muss geeignete Finanzwerkzeuge verwenden, bevor er konkrete Aussagen über die persönlichen Finanzen trifft.

Bei komplexen Fragen soll er mehrere Datenbereiche miteinander verbinden.

## 3.5 Antwortqualität

Strukturiere Finanzantworten sinnvoll.

Je nach Anfrage sollen Antworten enthalten:

- Direkte Antwort
- Relevante Kennzahlen
- Betrachteten Zeitraum
- Berechnungsgrundlage
- Verständliche Erklärung
- Konkrete Handlungsmöglichkeiten
- Unsicherheiten und Annahmen
- Verlinkung zur entsprechenden Finanzansicht

Beispiel:

„Du könntest deine monatlichen Ausgaben möglicherweise um 185 € reduzieren. Davon entfallen 45 € auf überprüfbare Abonnements, 80 € auf überdurchschnittliche Shopping-Ausgaben und 60 € auf variable Freizeitausgaben.“

Solche Aussagen dürfen ausschließlich aus nachvollziehbaren Daten und realistischen Szenarien entstehen.

Unterscheide bestätigte Einsparungen von potenziellen Einsparungen.

Erkenne notwendige Ausgaben und schlage keine pauschale Kürzung wesentlicher Lebenshaltungskosten vor.

## 3.6 Dynamische Antwortkomponenten

Der Finanzassistent soll nicht ausschließlich Text ausgeben.

Implementiere strukturierte, interaktive Antwortkomponenten:

- KPI-Karten
- Donut-Diagramme
- Liniendiagramme
- Balkendiagramme
- Vergleichstabellen
- Budgetanzeigen
- Sparzielkarten
- Score-Ringe
- Finanz-Timelines
- Kauf-Simulatoren
- Cashflow-Prognosen
- Interaktive Szenario-Vergleiche

Das Sprachmodell liefert validierte strukturierte Daten für erlaubte Komponenten.

Die Anwendung rendert diese über einen sicheren Component Renderer.

Führe niemals frei generierten HTML-, JavaScript- oder SQL-Code des Sprachmodells aus.

## 3.7 Intelligente Insight Engine

Entwickle ein System, das relevante finanzielle Veränderungen automatisch erkennt.

Unterstütze insbesondere folgende Insight-Typen:

### Einnahmen

- Gehaltsveränderungen
- Ausbleibende erwartete Einnahmen
- Schwankende Einnahmen
- Sonderzahlungen
- Veränderung des regelmäßigen Nettoeinkommens

### Ausgaben

- Überdurchschnittliche Monatsausgaben
- Ungewöhnlich hohe Einzeltransaktionen
- Steigende Ausgabenkategorien
- Sinkende Ausgaben
- Veränderung der Fixkosten
- Neue wiederkehrende Zahlungen

### Abonnements

- Preiserhöhungen
- Neue Abonnements
- Potenzielle doppelte Abonnements
- Auslaufende Testphasen
- Kommende Kündigungsfristen
- Potenzielles Einsparvolumen

### Budgets

- Erreichen relevanter Warnschwellen
- Drohende Budgetüberschreitungen
- Dauerhaft zu niedrig angesetzte Budgets
- Ungenutzte Budgetbeträge
- Positive Ausgabenentwicklung

### Sparziele

- Erreichte Meilensteine
- Abweichungen vom Zeitplan
- Finanzierbare zusätzliche Sparraten
- Erreichte Sparziele
- Nicht ausreichend finanzierte Ziele
- Möglichkeiten zur Neuverteilung von Sparraten

### Vermögen

- Nettovermögensveränderungen
- Sinkende Liquidität
- Konzentration einzelner Vermögenswerte
- Vermögensmeilensteine
- Veränderung der Verbindlichkeiten
- Auffällige Veränderungen der Vermögensstruktur

### Finanzgesundheit

- Relevante Score-Veränderungen
- Verbesserung einzelner Bewertungsbereiche
- Verschlechterung der Liquidität
- Zunehmende Kreditbelastung
- Konkrete Verbesserungspotenziale

### Zukunftsplanung

- Voraussichtliche Liquiditätsengpässe
- Große kommende Abbuchungen
- Ungewöhnlich hohe erwartete Monatskosten
- Mögliche Unterdeckung von Sparplänen
- Positive finanzielle Entwicklungen

## 3.8 Hochwertige Anomalieerkennung

Implementiere nachvollziehbare statistische Verfahren.

Berücksichtige:

- Persönliche historische Durchschnittswerte
- Median
- Median Absolute Deviation
- Gleitende Durchschnitte
- Saisonale Muster
- Zahlungsempfänger
- Wiederkehrende Transaktionen
- Kategorie
- Zeitraum
- Einkommensveränderungen

Verwende geeignete robuste Verfahren für unterschiedliche Datenmengen.

Beispielsweise kann eine ungewöhnliche Ausgabe erkannt werden, wenn sie deutlich oberhalb des persönlichen historischen Medians liegt und eine relevante absolute Mindestabweichung überschreitet.

Berücksichtige zu kleine Stichproben und Fälle ohne ausreichende historische Streuung.

Vermeide falsche Warnungen durch:

- Urlaub
- Weihnachten
- Jährliche Versicherungszahlungen
- Einmalige größere Anschaffungen
- Kontoüberträge
- Rückerstattungen
- Kreditaufnahmen
- Doppelte Buchungen
- Saisonale Ausgaben

Kennzeichne Auffälligkeiten als Hinweise und nicht automatisch als Betrug oder Fehler.

## 3.9 Vergleichslogik

Vergleiche Zeiträume fair und nachvollziehbar.

Ein laufender Monat darf nicht ohne Kennzeichnung mit einem vollständig abgeschlossenen Monat verglichen werden.

Bevorzugte Vergleiche:

- Monat bis heute gegen denselben Zeitraum des Vormonats
- Abgeschlossener Monat gegen abgeschlossenen Monat
- Kalenderjahr bis heute gegen denselben Vorjahreszeitraum
- Saisonale Vorjahresvergleiche
- Persönlicher Durchschnitt der letzten drei, sechs oder zwölf Monate

Zeige immer den verwendeten Vergleichszeitraum.

Berücksichtige Rückerstattungen, Kategorieänderungen und fehlende Importdaten.

## 3.10 Insight-Priorisierung

Jeder Insight erhält strukturierte Eigenschaften:

- Eindeutige ID
- Kategorie
- Titel
- Beschreibung
- Erstellungsdatum
- Betroffener Zeitraum
- Finanzielle Auswirkungen
- Dringlichkeit
- Relevanz
- Datenqualität
- Zugehörige Quelldaten
- Empfohlene Handlung
- Verknüpfte Finanzansicht
- Status

Priorisiere Insights anhand von:

- Finanzieller Auswirkung
- Dringlichkeit
- Datenqualität
- Persönlicher Relevanz
- Umsetzbarkeit
- Aktualität

Verwende eine dokumentierte und konfigurierbare Priorisierungslogik.

Kritische Liquiditätswarnungen erhalten Vorrang.

Verhindere doppelte oder nahezu identische Hinweise.

Ergänze Cooldown-Zeiträume, damit Nutzer nicht ständig dieselben Warnungen erhalten.

## 3.11 Persönlicher Action Center

Erstelle einen zentralen Bereich mit konkreten Handlungsmöglichkeiten.

Beispiele:

- Abonnement überprüfen
- Budget anpassen
- Sparrate simulieren
- Kommende Zahlung einplanen
- Transaktion korrigieren
- Bankverbindung aktualisieren
- Notgroschen aufbauen
- Kreditbelastung analysieren

Jede Handlung soll direkt zum passenden Modul führen.

Der Assistent darf Änderungen vorbereiten, aber keine Budgets, Sparziele, Verträge oder andere Finanzdaten ohne ausdrückliche Bestätigung verändern.

Vor jeder Änderung:

1. Vorgeschlagene Änderung anzeigen.
2. Finanzielle Auswirkungen berechnen.
3. Betroffene Daten auflisten.
4. Bestätigung des Nutzers einholen.
5. Änderung serverseitig validieren.
6. Änderung nachvollziehbar dokumentieren.

Keine selbstständigen Überweisungen, Kündigungen, Käufe oder Kreditabschlüsse.

## 3.12 Automatische Finanzberichte

Erstelle personalisierte Berichte für:

- Wochenüberblick
- Monatsüberblick
- Monatsabschluss
- Quartalsbericht
- Jahresübersicht

Jeder Bericht soll enthalten:

- Finanzielle Gesamtsituation
- Wichtigste Veränderungen
- Einnahmen und Ausgaben
- Sparquote
- Vermögensentwicklung
- Budgetstatus
- Sparzielfortschritt
- Financial Health Score
- Größte Risiken
- Positive Entwicklungen
- Konkrete nächste Schritte

Berichte sollen automatisch aus der Financial Data Engine erstellt werden.

Ein Sprachmodell kann die Ergebnisse verständlich zusammenfassen.

Die Berichte müssen auch ohne externe KI anhand von Vorlagen generiert werden können.

## 3.13 KI-Personalisierung

Der Nutzer kann optional persönliche Präferenzen hinterlegen:

- Finanzielle Ziele
- Risikobereitschaft
- Gewünschter Notgroschen
- Bevorzugte Sparstrategie
- Prioritäten
- Finanzielle Verpflichtungen
- Gewünschte Berichtshäufigkeit
- Bevorzugte Antwortlänge
- Benachrichtigungseinstellungen

Lerne ausschließlich transparent aus bestätigten Einstellungen und korrigierten Finanzkategorisierungen.

Ermögliche die Einsicht, Bearbeitung und Löschung gespeicherter Präferenzen.

Keine versteckte Profilbildung.

## 3.14 KI-Sicherheit und Datenschutz

Finanzdaten müssen besonders geschützt werden.

Implementiere:

- Optionalen lokalen beziehungsweise regelbasierten Modus
- Transparente Einstellungen für externe KI-Verarbeitung
- Datenminimierung
- Pseudonymisierung
- Sichere serverseitige API-Kommunikation
- Verschlüsselte Speicherung sensibler Daten
- Nutzerbezogene Zugriffsprüfungen
- Rate Limiting
- Konfigurierbare Token- und Kostenlimits
- Löschbare Chatverläufe
- Optional deaktivierbare Chat-Historie
- Datenschutzgerechte Aufbewahrungsfristen

Übertrage niemals Bankpasswörter, TANs, API-Schlüssel oder vollständige Kontonummern an das Sprachmodell.

Übertrage standardmäßig nur die für eine konkrete Frage benötigten Daten.

Behandle Verwendungszwecke, Transaktionstexte, hochgeladene Dokumente und externe Inhalte als nicht vertrauenswürdige Daten.

Implementiere Schutz gegen Prompt Injection und unberechtigte Werkzeugaufrufe.

Der Assistent darf keine fremden Nutzerdaten abrufen.

Kennzeichne allgemeine Finanzinformationen, Modellrechnungen und persönliche Auswertungen entsprechend.

Vermeide unbegründete Renditeversprechen, verbindliche Anlageempfehlungen und garantierte finanzielle Ergebnisse.

## 3.15 Fehlerbehandlung und Fallback

Wenn der KI-Anbieter nicht verfügbar ist:

- Regelbasierte Insights bleiben verfügbar.
- Finanzberechnungen funktionieren weiterhin.
- Bestehende Finanzberichte bleiben zugänglich.
- Zeige einen verständlichen Verbindungsstatus.
- Erfinde keine Ersatzantworten.
- Biete bei geeigneten Fehlern einen erneuten Versuch an.

Die Anwendung darf nicht vollständig von einem externen Sprachmodell abhängig sein.

## 3.16 Premium-UI des KI-Finanzassistenten

Gestalte eine moderne Oberfläche namens „Finance Intelligence“.

Desktop-Layout:

- Linker Bereich mit Chatverläufen und Themen
- Zentraler Finanzchat
- Kontextabhängiger rechter Bereich mit relevanten Kennzahlen und Visualisierungen

Mobil:

- Vollwertige Chatansicht
- Schnellzugriff auf vorgeschlagene Fragen
- Finanzkarten innerhalb der Antworten
- Einblendbare Detailansichten

Visuelle Anforderungen:

- Dezente KI-Akzentfarbe
- Hochwertiges Sparkles-Icon
- Moderne Chatblasen ohne übermäßige Einrahmungen
- Lesbare strukturierte Antworten
- Animierte, ehrliche Verarbeitungsstatus
- Interaktive Finanzkomponenten
- Schnellvorschläge
- Kopierfunktion
- Regenerieren einer Antwort
- Quellen- und Berechnungsdetails
- Verlinkungen zu Finanzmodulen

Zeige bei Finanzantworten optional:

„Basierend auf 248 Transaktionen aus dem Zeitraum Januar bis Juni.“

Der Nutzer soll nachvollziehen können, worauf eine Aussage basiert.

Implementiere optional ein globales KI-Panel, das aus jeder Finanzansicht geöffnet werden kann.

Das Panel soll den Kontext der aktuellen Seite verstehen, beispielsweise das ausgewählte Sparziel oder die aktuell betrachtete Ausgabenkategorie.

---

# 4. Zentrale Navigation – Finance OS

## 4.1 Zielsetzung

Entwickle eine professionelle, intelligente und skalierbare Navigation für die gesamte Finanzanwendung.

Die Navigation soll sich wie die eines modernen persönlichen Betriebssystems für Finanzen anfühlen.

Vermeide eine unstrukturierte Ansammlung von Menüpunkten.

Ordne zusammengehörige Funktionen logisch und verständlich.

## 4.2 Navigationsstruktur

Verwende folgende Struktur als Orientierung und passe sie an tatsächlich vorhandene Module an.

### Übersicht

- Dashboard
- Financial Health
- Finanz-Insights

### Finanzen

- Bankkonten
- Transaktionen
- Einnahmen und Ausgaben
- Budgets
- Abonnements
- Finanzkalender

### Vermögen

- Vermögensübersicht
- Sparziele
- Investments
- Kredite und Schulden

### Planung

- Zukunftsprognose
- Simulatoren
- Geplante Anschaffungen
- Finanz-Roadmap
- Berichte

### Verwaltung

- Dokumententresor
- Versicherungen
- Datenschutz und Sicherheit
- Einstellungen

### Finance Intelligence

Der KI-Finanzassistent erhält einen besonders gut erreichbaren, eigenständigen Navigationspunkt.

Zeige ausschließlich tatsächlich implementierte und verfügbare Module.

Keine toten Links oder unbrauchbaren Menüeinträge.

## 4.3 Desktop-Sidebar

Entwickle eine moderne vertikale Sidebar.

Anforderungen:

- Breite ausgeklappt ungefähr 248–280 px
- Breite eingeklappt ungefähr 64–80 px
- Dezente Trennlinie zum Inhaltsbereich
- Hochwertige Icons
- Klarer aktiver Navigationszustand
- Ein- und ausklappbare Kategorien
- Persistenter Navigationszustand
- Scrollbarer Menübereich
- Fixierter Benutzerbereich am unteren Ende
- Optional frei konfigurierbare Favoriten

Die Sidebar soll sich flüssig ein- und ausklappen lassen.

Im kompakten Zustand werden Icons mit verständlichen Tooltips angezeigt.

Vermeide übermäßig große Menüabstände und unnötig dominante Navigationsfarben.

## 4.4 Globale Topbar

Erstelle eine einheitliche Kopfzeile.

Diese enthält abhängig von der Bildschirmgröße:

- Breadcrumb-Navigation
- Globales Suchfeld
- Schnellaktionen
- Synchronisierungsstatus
- Benachrichtigungen
- Privacy Mode
- Theme-Umschaltung
- Benutzerprofil

Der Privacy Mode muss global alle sensiblen Geldbeträge ausblenden können.

Zeige bei verbundenen Bankkonten den tatsächlichen Synchronisierungsstatus und den Zeitpunkt der letzten erfolgreichen Aktualisierung.

## 4.5 Command Palette

Implementiere eine globale Command Palette, erreichbar über Strg+K beziehungsweise Cmd+K.

Unterstütze:

- Seiten suchen
- Transaktionen suchen
- Sparziele suchen
- Abonnements suchen
- Bankkonten suchen
- Finanzberichte finden
- Einstellungen öffnen
- KI-Assistenten aufrufen
- Schnellaktionen ausführen

Beispiele:

- Neue Transaktion hinzufügen
- Neues Sparziel erstellen
- Neues Budget erstellen
- Bankkonto verbinden
- Konten synchronisieren
- Privacy Mode aktivieren
- Monatsbericht öffnen

Implementiere:

- Tastaturnavigation
- Unscharfe Suche
- Zuletzt verwendete Aktionen
- Relevanzsortierung
- Gruppierte Suchergebnisse
- Barrierearme Bedienung

Berücksichtige den Privacy Mode auch in Suchergebnissen und Suchverläufen.

## 4.6 Intelligente globale Suche

Die Suche soll sämtliche berechtigten Finanzbereiche durchsuchen können.

Beispiele:

- Netflix
- Urlaub
- Transaktionen über 100 €
- Versicherungen
- Lebensmittel November
- Offene Sparziele
- Kreditraten

Zeige passende Ergebnisse gruppiert nach Modulen.

Ermögliche direkte Navigation zur jeweiligen Detailansicht.

Nutze serverseitige Nutzerautorisierung und effiziente Suchindizes.

## 4.7 Mobile Navigation

Entwickle eine speziell für Smartphones optimierte Navigation.

Verwende eine Bottom Navigation mit maximal fünf Hauptbereichen:

- Übersicht
- Transaktionen
- Vermögen
- KI-Assistent
- Mehr

Weitere Module werden über eine übersichtliche mobile Menüansicht erreicht.

Anforderungen:

- Ausreichend große Touch-Flächen
- Berücksichtigung der Safe Areas
- Klarer aktiver Zustand
- Flüssige Übergänge
- Kein horizontaler Seitenüberlauf
- Direkte Erreichbarkeit wichtiger Aktionen
- Kontextbezogene Seitentitel

Verwende keine verkleinerte Desktop-Sidebar als einzige mobile Navigation.

## 4.8 Personalisierbare Navigation

Ermögliche:

- Module als Favoriten markieren
- Favoriten umsortieren
- Nicht benötigte Module ausblenden
- Kategorien einklappen
- Zuletzt verwendete Seiten anzeigen
- Standard-Startseite definieren
- Kompakten Navigationsmodus aktivieren
- Individuelle Schnellaktionen konfigurieren

Speichere die Einstellungen nutzerbezogen.

Die Standardnavigation soll auch ohne individuelle Konfiguration verständlich bleiben.

## 4.9 Kontextbezogene Navigation

Verknüpfe zusammengehörige Finanzbereiche über Deep Links.

Beispiele:

- Klick auf einen Financial Health Teilscore öffnet die zugehörige Finanzanalyse.
- Klick auf einen Abo-Insight öffnet das betroffene Abonnement.
- Klick auf eine Budgetwarnung öffnet das entsprechende Budget.
- Klick auf ein Diagrammsegment öffnet gefilterte Transaktionen.
- Klick auf ein Sparziel öffnet dessen Detailansicht.
- Klick auf eine KI-Analyse öffnet die zugrunde liegenden Finanzdaten.

Erhalte ausgewählte Zeiträume und Filter nach Möglichkeit beim Navigieren.

Unterstütze sinnvolle Zurück-Navigation und dauerhaft adressierbare Detailansichten.

## 4.10 Benachrichtigungscenter

Erstelle ein zentrales Benachrichtigungscenter.

Kategorien:

- Finanzwarnungen
- Budgets
- Abonnements
- Sparziele
- Bankverbindungen
- Financial Health
- KI-Insights
- Sicherheit

Unterstütze:

- Gelesen und ungelesen
- Priorität
- Filtern
- Archivieren
- Individuelle Einstellungen
- Direkte Navigation zum relevanten Modul

Zeige ungelesene relevante Benachrichtigungen zurückhaltend an.

Vermeide permanente rote Warnmarkierungen für unwichtige Informationen.

Sicherheits- und Liquiditätswarnungen dürfen dagegen nicht durch gewöhnliche Meldungen untergehen.

---

# 5. Gemeinsames Premium-Designsystem

## 5.1 Designrichtung

Das gesamte Finance OS soll hochwertig, ruhig, modern und professionell aussehen.

Orientiere dich an der visuellen Qualität moderner Premium-Fintech-Anwendungen sowie an der Klarheit von Linear und Apple-Produkten.

Kopiere keine bestehende Anwendung direkt.

Erstelle eine eigenständige Designsprache.

Vermeide:

- Generische Admin-Dashboards
- Übermäßiges Glassmorphism
- Unnötig grelle Farben
- Überladene Diagramme
- Zu viele verschachtelte Karten
- Überdimensionierte Überschriften
- Übertriebene Animationen
- Unnötige Farbverläufe

## 5.2 Dark Mode

Verwende folgende beispielhafte Design-Tokens:

| Element | Farbe |
|---|---|
| Seitenhintergrund | #0B0F19 |
| Sidebar | #0E1420 |
| Karten | #131A28 |
| Sekundäre Flächen | #1C2536 |
| Rahmen | #263244 |
| Primärer Text | #F1F5F9 |
| Sekundärer Text | #94A3B8 |
| Primärer Akzent | #818CF8 |
| Positive Werte | #34D399 |
| Warnungen | #FBBF24 |
| Negative Werte | #F87171 |
| Informationsfarbe | #60A5FA |

Passe die Farben an das bestehende Designsystem an.

Erstelle einen gleichwertig hochwertigen Light Mode.

## 5.3 Typografie und Abstände

Verwende eine hochwertige moderne Schriftart wie Inter oder die bereits vorhandene Projektschrift.

- Seitenüberschriften: 26–32 px
- Zentrale Finanzkennzahlen: 32–44 px
- Financial Health Score: 48–64 px
- Kartenüberschriften: 15–18 px
- Fließtext: 14–16 px
- Sekundärinformationen: 12–14 px

Nutze tabellarische Ziffern für Geldbeträge und Finanzkennzahlen.

Verwende ein konsistentes 4- beziehungsweise 8-Pixel-Abstandssystem.

Karten:

- Border-Radius 12–20 px
- Feine Rahmen
- Dezente Schatten
- Einheitliche Innenabstände
- Konsistente Hover-Zustände
- Klar erkennbare interaktive Elemente

## 5.4 Diagramme und Visualisierungen

Sämtliche Diagramme müssen:

- Responsiv sein
- Interaktive Tooltips besitzen
- Konsistente Farben verwenden
- Verständliche Beschriftungen enthalten
- Tastatur- und Touch-Bedienung unterstützen
- Fehlende Daten korrekt darstellen
- Prognosen visuell von tatsächlichen Werten unterscheiden
- Light Mode und Dark Mode unterstützen
- Den globalen Privacy Mode berücksichtigen

Verwende dezente Gitternetzlinien, saubere Kurven und abgerundete Fortschrittsanzeigen.

Vermeide irreführende Achsenskalierungen.

## 5.5 Animationen und Microinteractions

Implementiere hochwertige, dezente Animationen:

- Animierter Financial Health Score
- Fließende Fortschrittsbalken
- Sanfte Diagrammaktualisierungen
- Flüssiges Ein- und Ausklappen der Sidebar
- Subtile Hover-Effekte
- Skeleton Loading
- Dezente Chat-Antwortanimationen
- Übergänge bei Filterwechseln

Berücksichtige die Systemeinstellung für reduzierte Bewegung.

Animationen sollen die Benutzerfreundlichkeit verbessern und nicht vom Inhalt ablenken.

## 5.6 Barrierefreiheit

Berücksichtige:

- Ausreichende Farbkontraste
- Screenreader-kompatible Beschriftungen
- Tastaturnavigation
- Sichtbare Fokuszustände
- Verständliche Fehlermeldungen
- Ausreichend große Klickflächen
- Alternative Textdarstellungen von Diagrammen

Bewertungszustände dürfen nicht ausschließlich durch Farben vermittelt werden.

---

# 6. Modulübergreifende Vernetzung

Alle drei neuen Module müssen vollständig mit dem bestehenden Finanzplaner verbunden werden.

Beispiele:

- Neue Banktransaktionen aktualisieren relevante Finanzkennzahlen.
- Änderungen an Sparzielen beeinflussen die Finanzplanung.
- Die Financial Health Engine berechnet bei relevanten Änderungen einen aktualisierten Score.
- Die Insight Engine erkennt wesentliche Veränderungen.
- Der KI-Assistent erklärt, warum sich der Score verändert hat.
- Der Assistent kann Verbesserungsszenarien berechnen.
- Die Navigation führt direkt zu den zugrunde liegenden Finanzdaten.
- Das Benachrichtigungscenter zeigt wichtige Entwicklungen.
- Der Privacy Mode schützt sämtliche Ansichten einschließlich KI-Antworten und Suchergebnissen.

Verwende eine zentrale Datenbasis.

Verhindere redundante Finanzberechnungen, doppelte Transaktionen und widersprüchliche Ergebnisse.

Financial Health Dashboard, KI-Assistent und Finanzberichte müssen dieselben zentral berechneten Kennzahlen verwenden.

---

# 7. Technische Umsetzung

Erstelle eine modulare, wartbare und typsichere Architektur.

Beispielhafte interne Module:

- FinancialDataService
- FinancialCalculationEngine
- HealthScoreEngine
- ScoreSimulationService
- DataQualityEngine
- InsightEngine
- AnomalyDetectionService
- InsightRankingService
- AIAssistantService
- AIProviderAdapter
- FinanceToolRegistry
- FinancialReportService
- NotificationService
- NavigationService
- GlobalSearchService
- PrivacyService

Die Namen dienen als Orientierung und sollen an das bestehende Projekt angepasst werden.

Anforderungen:

- Präzise Dezimalberechnungen
- Versionierte Bewertungsmodelle
- Nachvollziehbare Berechnungsergebnisse
- Validierte KI-Werkzeugaufrufe
- Sichere Backend-Kommunikation
- Nutzerbezogene Datenisolierung
- Effizientes Caching
- Automatische Cache-Invalidierung bei Finanzänderungen
- Hintergrundprozesse für tatsächlich benötigte Analysen
- Idempotente Insight-Erstellung
- Dokumentierte API-Schnittstellen
- Sichere Datenbankmigrationen
- Angemessene Fehlerbehandlung

Berechne Finanzkennzahlen nicht unnötig bei jedem Rendering der Benutzeroberfläche neu.

Verwende keine externen KI-Dienste ohne geeignete Konfiguration.

Echte API-Schlüssel dürfen niemals im Quellcode gespeichert werden.

---

# 8. Tests und Qualitätskontrolle

## Financial Health Engine

Erstelle umfangreiche automatisierte Tests für:

- Exakte Gewichtungen
- Berechnungsformeln
- Lineare Interpolation
- Grenzwerte
- Fehlende Daten
- Datenabdeckung
- Negative Kontostände
- Negative Einkommen
- Einkommen von 0 €
- Fehlende Ausgabenhistorie
- Schuldenfreiheit
- Hohe Kreditbelastungen
- Unregelmäßige Einkommen
- Interne Kontoüberträge
- Doppelte Transaktionen
- Fremdwährungen
- Außergewöhnliche Ausgaben
- Score-Simulationen
- Historische Berechnungsversionen

Teste folgende Eigenschaften:

- Der Score bleibt immer zwischen 0 und 100.
- Identische Eingaben erzeugen identische Ergebnisse.
- Steigende verfügbare Rücklagen verschlechtern unter sonst gleichen Bedingungen nicht den Liquiditätsscore.
- Steigende Kreditbelastungen verbessern unter sonst gleichen Bedingungen nicht den Schuldenscore.
- Fehlende Daten führen nicht automatisch zu einer guten Bewertung.
- Kontoüberträge verändern nicht künstlich die Finanzgesundheit.
- Rundungsfehler beeinflussen keine relevanten Berechnungen.

## KI-Assistent

Erstelle eine Evaluationssuite mit synthetischen Finanzprofilen und Fragen mit bekannten korrekten Antworten.

Teste:

- Korrektheit konkreter Geldbeträge
- Richtige Auswahl von Finanzwerkzeugen
- Vergleichszeiträume
- Finanzielle Simulationen
- Fehlende Daten
- Widersprüchliche Daten
- Falsche Annahmen des Nutzers
- Vermeidung erfundener Finanzdaten
- Datenschutz
- Prompt Injection
- Unberechtigte Datenzugriffe
- Fehlerhafte Tool-Ergebnisse
- API-Ausfälle
- Nicht bestätigte Änderungsaktionen

Vergleiche ausgegebene Finanzkennzahlen automatisiert mit den Ergebnissen der Financial Calculation Engine.

Teste sowohl die sprachliche Qualität als auch die faktische Richtigkeit.

## Insight Engine

Teste:

- Gehaltsveränderungen
- Preiserhöhungen
- Wiederkehrende Zahlungen
- Saisonale Ausgaben
- Budgetüberschreitungen
- Fehlende Buchungen
- Ungewöhnliche Ausgaben
- Liquiditätsprognosen
- Vermeidung doppelter Insights
- Unvollständige Vergleichszeiträume
- Falsch positive Warnungen

## Navigation und UI

Teste:

- Sämtliche Navigationspunkte
- Deep Links
- Desktop- und Mobilansicht
- Command Palette
- Globale Suche
- Tastaturnavigation
- Benachrichtigungen
- Persistente Einstellungen
- Dark Mode
- Light Mode
- Privacy Mode
- Barrierefreiheit
- Lade- und Fehlerzustände

Prüfe die Oberfläche anhand gerenderter Screenshots für unterschiedliche Bildschirmgrößen.

---

# 9. Umsetzungsreihenfolge

Arbeite strukturiert und setze die Funktionen tatsächlich um.

Phase 1:
Bestehende Anwendung und Finanzdaten analysieren.

Phase 2:
Zentrale Finanzberechnungen und Datenqualitätsprüfung entwickeln.

Phase 3:
Financial Health Engine einschließlich Tests implementieren.

Phase 4:
Financial Health Dashboard, Detailansichten und Simulator entwickeln.

Phase 5:
Insight Engine und Anomalieerkennung implementieren.

Phase 6:
KI-Finanzassistent mit sicheren Finanzwerkzeugen entwickeln.

Phase 7:
Interaktive KI-Antwortkomponenten und persönliche Finanzberichte integrieren.

Phase 8:
Zentrale Navigation, globale Suche und Command Palette umsetzen.

Phase 9:
Alle Module miteinander vernetzen.

Phase 10:
Premium-Design, Animationen und responsive Ansichten optimieren.

Phase 11:
Sicherheitsprüfung, Berechnungstests und KI-Evaluation durchführen.

Phase 12:
Fehler beheben und technische Dokumentation abschließen.

---

# 10. Abschlussanforderungen

Liefere nicht nur einen Plan, sondern implementiere die Funktionen im tatsächlichen Projekt.

Erhalte vorhandene Daten und Funktionen.

Führe keine destruktiven Änderungen ohne ausdrückliche Freigabe durch.

Frage nur dann nach, wenn externe Zugangsdaten, kostenpflichtige Dienste, irreversible Änderungen oder wesentliche sicherheitskritische Entscheidungen erforderlich sind.

Liefere abschließend:

- Übersicht aller implementierten Funktionen
- Geänderte und neue Dateien
- Architekturübersicht
- Vollständige Financial Health Berechnungsdokumentation
- Bewertungsformeln und Gewichtungen
- Begründung aller Modellannahmen
- KI-Provider-Konfiguration
- Benötigte Umgebungsvariablen
- Sicherheitskonzept
- Testergebnisse
- Ergebnisse der KI-Evaluation
- Bekannte Einschränkungen
- Noch notwendige Einrichtungsschritte

Kennzeichne eindeutig, welche Funktionen vollständig implementiert, getestet, extern konfigurationsabhängig oder noch nicht verfügbar sind.

Behaupte keine erfolgreich durchgeführten Tests, wenn diese nicht tatsächlich ausgeführt wurden.

## Oberstes Qualitätsziel

Die Anwendung soll nicht nur schön aussehen, sondern finanziell korrekte, nachvollziehbare und tatsächlich hilfreiche Entscheidungen unterstützen.

Der Financial Health Score muss mathematisch konsistent sein.

Der KI-Assistent muss auf echten Finanzdaten und geprüften Berechnungen basieren.

Die Navigation muss sämtliche Funktionen zu einem einheitlichen, hochwertigen Finance OS verbinden.

Korrektheit, Sicherheit, Datenschutz und tatsächlicher Nutzen haben immer Vorrang vor optischen Effekten.