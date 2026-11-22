# Bausteinauswahl für FINOVA 0.2

Die bereitgestellte ELEMENTE.md dient als Anforderungskatalog. Ihre Verweise auf Skills/Projektdateien werden durch die mitgelieferten Programmierstandards erfüllt; daraus entsteht kein Auftrag, ungeeignete Effekte einzubauen. Implementierung im React-Stack, ohne Übernahme fremden React-Bits-Quellcodes.

| Baustein | Entscheidung und tatsächliche Verwendung |
| --- | --- |
| Stepper | Ersetzt das lange Buchungsformular durch Buchung und Zuordnung. Pflichtfelder werden beim Weitergehen geprüft, Werte bleiben beim Zurückgehen erhalten. Speichern erfolgt einmal am Ende; Abbruch bleibt direkt erreichbar. |
| Dock | Ersetzt auf schmalen Fenstern die ausschließliche Hamburgernavigation durch vier stabile Hauptziele. Die übrigen Bereiche bleiben über das Menü erreichbar. Hash-Routen, Direktaufruf und Zurücknavigation steuern dieselbe aktive Markierung; Scrollpositionen werden pro Ziel erhalten. Safe Area und unterster Inhalt sind berücksichtigt. |
| JellyRadio | Ersetzt die bisherigen losen Filterbuttons für Zeitraum und Buchungsart durch native, gemeinsam beschriftete Radiogruppen. Genau eine Option ist gewählt; Auswahl wirkt sofort auf echte gespeicherte Daten. Tastaturbedienung, Fokus, aktive Unterstreichung und zusätzlicher Auswahlpunkt. |
| RubberSegment | Ersetzt die bisherigen Ansichtsknöpfe durch ein vollständiges Tab-Muster mit verknüpftem Panel, Pfeiltasten, Home/End und einem Tabstop. Alle Ansichten verwenden weiterhin dieselben Positionen. Kein erforderliches Ziehen und keine Eingabesperre während eines Effekts. |
| SpringCheck | Ersetzt die Aufgaben-/Positionscheckboxen durch ein wiederverwendbares natives Kontrollkästchen mit kurzem Häkchenfeedback innerhalb stabiler Trefferfläche. Aufgabenstatus bleibt unabhängig von Bestellungen und Zahlungen. Bei Speicherfehlern wird der tatsächliche Datenstand erneut geladen. |
| Folder | Die bestehenden Budgetkarten öffnen tatsächliche Sammlungen mit Anzahl, Symbol und eigener Detailroute. Keine dekorative Ordnerklappe; sie würde die Finanzplanung nicht verbessern. Keine Verschiebe- oder Berechtigungssimulation ohne vorhandenen Adapter. |
| GlassSurface | Trägt die kompakte Mobilnavigation mit zurückhaltendem Material. Nahezu deckende Fläche hält Zahlen lesbar; reduzierte Transparenz und hoher Kontrast erzwingen deckendes Material. Kein behaupteter Sichtschutz durch Blur. |
| MagicBento | Das vorhandene responsive Dashboard bleibt: echte Kennzahlen, hervorgehobene Buchungsaktion, unterschiedliche Inhaltsgrößen. Reine Informationskarten bleiben nicht interaktiv. Die Reihenfolge in DOM und Tastatur bleibt konsistent. |
| SplitFlapText | Kein Klappeffekt für Geldbeträge: Zahlen müssen sofort vollständig vergleichbar sein. Stabile Ziffernbreite bleibt erhalten. Ein Countdown hat derzeit keinen fachlichen Zweck. |
| HoldButton | Nicht eingebaut. Gewöhnliche Buchungen und Archivierung sind häufige/reversible Aktionen. Ein Haltezwang wäre eine zusätzliche Hürde. Seltene echte Datenlösch-/Wiederherstellungsaktionen können später eine gemeinsame bestätigte Aktion verwenden. |
| CodeSlots | Nicht eingebaut. Die lokale Einzelbenutzer-App besitzt keinen Verifizierungscode-Ablauf. Künstliche Anmeldung würde Funktion und Datenverarbeitung unnötig erweitern. |

Bewegung: kurze Farb-/Opazitätswechsel und ein einmaliges Häkchenfeedback. Kein Mausvergrößern der Navigation, keine Loopanimation, keine Zählanimation und keine verschobenen Trefferflächen. `prefers-reduced-motion` schaltet Feedbackanimationen ab. Die Auswahl ergänzt keine neuen Erklärungstexte im Programm.
