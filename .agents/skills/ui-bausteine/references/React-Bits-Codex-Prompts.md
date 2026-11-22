# React Bits → Codex-Auftrag für elf Python-Bausteine

Lies diese Datei vollständig und führe alle elf Aufträge aus. Lege **pro Baustein eine eigene Markdown-Datei mit vollständigem, lauffähigem Python-Code** an. Prüfe Projektanweisungen wie `AGENTS.md`, `SKILL.md` und `KI-ROLLEN.md`, falls vorhanden. Nutze bei einem bestehenden Python-Projekt dessen UI-Framework und passende vorhandene Widgets. Verwende für eigenständige Desktop-Beispiele **Tkinter mit ttk und der Python-Standardbibliothek**.

Die Aufgaben orientieren sich am Aufbau von „Copy for AI“ aus dem Beispiel. Die Links führen zur offiziellen React-Bits-Demo, zu ihrem Nutzungsbeispiel und ihrer Props-Tabelle im Repository sowie zum Originalquellcode der Variante **JavaScript + CSS** im Registry-JSON. Auf der Komponentenseite erhältst du über **Copy for AI** den Originalprompt für die gewählte Variante. Die Python-Aufträge hier sind eigenständig nutzbar. Links dienen als Referenz für Verhalten und Darstellung. Bei fehlendem Netzwerk reichen die Anforderungen in dieser Datei für die Bearbeitung. Prüfe bei jeder Übernahme fremden Codes die Lizenzbedingungen. [Lizenz](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/LICENSE.md) · [Offizieller Prompt-Generator](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/utils/aiPrompt.js)

## Ausgabe und Prüfung

- Erstelle die elf unten genannten Dateinamen relativ zum aktuellen Arbeitsverzeichnis. Wenn das Projekt bereits einen passenden Ordner für solche Markdown-Vorlagen vorgibt, verwende ihn und nenne die tatsächlichen Pfade.
- Jede Datei enthält den Namen des Bausteins, eine kurze Erklärung mit Bedienung und Abhängigkeiten und **einen vollständigen `python`-Codeblock**, der sich unverändert als `.py` speichern lässt. Zeige wiederverwendbaren Widget-Code und eine kleine Demo mit `if __name__ == "__main__":`. Die elf Beispiele sind voneinander unabhängig.
- Verbinde Eingaben mit echten Projektzuständen oder mit sinnvollen, lokalen Demo-Aktionen. Verwende eindeutige Labels, sichtbaren Tastaturfokus und verständliche Rückmeldung. Bevorzuge native Eingabeelemente. Halte bei Animationen die Trefferflächen stabil und biete, wo Bewegung verwendet wird, einen statischen Modus. Nutze in Tkinter `after` und räume ausstehende Aufrufe beim Schließen auf. Gib asynchrone Ergebnisse im UI-Thread zurück und aktualisiere nur den noch aktuellen Zustand.
- Prüfe alle elf Codeblöcke auf Python-Syntax. Starte die Demos nach Möglichkeit in einer GUI-Umgebung und überprüfe die jeweiligen Prüffälle. Vermerke in der Abschlussmeldung, welche Prüfungen du tatsächlich ausgeführt hast. Liste danach alle erzeugten Dateien auf.

## Stepper

**Zieldatei** `Stepper.md`

**React-Bits-Referenz** Mehrstufiger Ablauf mit animiertem Fortschrittsmarker und Wechsel zwischen den Schritten. Die React-Demo unterstützt horizontale und vertikale Anordnung. [Demo und Copy for AI](https://www.reactbits.dev/components/stepper) · [Nutzungsbeispiel](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/constants/code/Components/stepperCode.js) · [Props](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/demo/Components/StepperDemo.jsx) · [JS/CSS-Quellcode](https://www.reactbits.dev/r/Stepper-JS-CSS.json)

**Abhängigkeiten der React-Variante** `@hugeicons/react@^1.1.10`, `@hugeicons/core-free-icons@^4.3.3`. Verwende für Python die Möglichkeiten des gewählten GUI-Frameworks.

**Nutzungsbeispiel für Python** Zeige drei Formularschritte mit einem Pflichtfeld, Zurück, Weiter und einer Abschlussaktion.

**Python-Schnittstelle** Schrittliste mit Label, Aufbau und Validierung pro Schritt, aktueller Index, Freigabe für Direktsprünge, Funktionen für Abschluss und Abbruch, optionaler Adapter für bestehende Zeitphasen.

**Auftrag aus ELEMENTE.md** Stepper führt durch mehrere Schritte. Leite Fortschritt und aktive Markierung aus dem aktuellen Schritt oder bei Zeitphasen aus dem bestehenden Timer ab. Zeige bei wenig Platz „Schritt 2 von 5“. Mache nur erlaubte Schritte anwählbar. Validiere beim Weitergehen die Pflichtfelder des aktuellen Schritts. Erhalte Antworten beim Zurückgehen und biete einen erreichbaren Abbruch. „Fertig“ schließt den Ablauf nach erfolgreicher Verarbeitung genau einmal ab.

**Prüffälle** Bei leerem Pflichtfeld bleibt der Schritt aktiv und der Fokus geht zum Feld. Zurück und erneutes Weiter erhalten Eingaben. Der Abschluss wird bei doppelter Aktivierung nur einmal ausgelöst. Der Abbruch bleibt erreichbar.

## Dock

**Zieldatei** `Dock.md`

**React-Bits-Referenz** Dock im macOS-Stil mit Vergrößerung benachbarter Symbole, Startanimation und optionalen Zählern. [Demo und Copy for AI](https://www.reactbits.dev/components/dock) · [Nutzungsbeispiel](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/constants/code/Components/dockCode.js) · [Props](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/demo/Components/DockDemo.jsx) · [JS/CSS-Quellcode](https://www.reactbits.dev/r/Dock-JS-CSS.json)

**Abhängigkeiten der React-Variante** `react-dom@^19.0.0`. Verwende für Python die Möglichkeiten des gewählten GUI-Frameworks.

**Nutzungsbeispiel für Python** Zeige eine Navigation mit „Start“, „Aufgaben“ und „Einstellungen“ und simuliere einen Routenwechsel von außen.

**Python-Schnittstelle** Liste aus Ziel-ID, Symbol, Label und optionalem Zähler, aktuelle Routen-ID als übergebener Zustand, Navigationsfunktion und Methode für programmgesteuerte Aktualisierung.

**Auftrag aus ELEMENTE.md** Dock bietet wenige gleichrangige Hauptziele. Nutze die echten Routen und markiere die aktive Route auch nach Zurücknavigation oder Direkteinstieg. Verwende stabile Ziele mit Symbol und kurzer Beschriftung. Bewahre den jeweiligen Navigations-, Eingabe- und Scrollzustand. Prüfe, dass Safe Area und Tastatur berücksichtigt sind und die letzten Inhalte erreichbar bleiben. Zeige Zähler nur bei relevanten, unbedenklichen Informationen.

**Prüffälle** Direkteinstieg und Zurücknavigation aktualisieren die aktive Markierung. Beim Wechsel bleiben Formular- und Scrollzustand je Ziel erhalten. Fokus und Beschriftungen bleiben auch bei schmalem Fenster nutzbar.

## JellyRadio

**Zieldatei** `JellyRadio.md`

**React-Bits-Referenz** Einzelauswahl aus Chips. Die gewählte Option vergrößert sich kurz mit Federbewegung. [Demo und Copy for AI](https://www.reactbits.dev/micro/jelly-radio) · [Nutzungsbeispiel](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/constants/code/Micro/jellyRadioCode.js) · [Props](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/demo/Micro/JellyRadioDemo.jsx) · [JS/CSS-Quellcode](https://www.reactbits.dev/r/JellyRadio-JS-CSS.json)

**Abhängigkeiten der React-Variante** `motion@^12.23.12`. Verwende für Python die Möglichkeiten des gewählten GUI-Frameworks.

**Nutzungsbeispiel für Python** Verbinde „Alle“, „Offen“ und „Erledigt“ mit einem sichtbaren Filter in der Demo.

**Python-Schnittstelle** Optionen aus Schlüssel und Label, gemeinsame Gruppenbeschriftung, ein übergebener Wert und eine Änderungsfunktion. Nutze eine native Radiobutton-Gruppe und ein klares Merkmal für die Auswahl.

**Auftrag aus ELEMENTE.md** JellyRadio bietet kurze Optionen für genau eine Auswahl. Verwende eine semantische Radiogruppe mit gemeinsamer Beschriftung und plattformgerechter Tastaturbedienung. Verbinde die Auswahl direkt mit dem zugehörigen Filter oder der Einstellung. Lass Chips umbrechen oder zu einer Liste wechseln. Gib der aktiven Option ein sichtbares Merkmal. Ein kurzes Federfeedback kann innerhalb der stabilen Trefferfläche stattfinden.

**Prüffälle** Maus und Tastatur ändern genau eine Auswahl und wenden den Filter sofort an. Externe Wertänderungen werden angezeigt. Bei wenig Platz bleiben alle Optionen erreichbar.

## RubberSegment

**Zieldatei** `RubberSegment.md`

**React-Bits-Referenz** Segmentsteuerung mit einem Auswahlhintergrund, der sich beim Wechsel über die Segmente dehnt und wieder zusammenzieht. [Demo und Copy for AI](https://www.reactbits.dev/micro/rubber-segment) · [Nutzungsbeispiel](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/constants/code/Micro/rubberSegmentCode.js) · [Props](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/demo/Micro/RubberSegmentDemo.jsx) · [JS/CSS-Quellcode](https://www.reactbits.dev/r/RubberSegment-JS-CSS.json)

**Abhängigkeiten der React-Variante** `motion@^12.23.12`. Verwende für Python die Möglichkeiten des gewählten GUI-Frameworks.

**Nutzungsbeispiel für Python** Schalte zwischen „Tag“, „Woche“ und „Monat“ um. Ein markierter Entwurf in der Tagesansicht bleibt beim Wechsel erhalten.

**Python-Schnittstelle** Modus-ID, sichtbares Label und zugehöriger Panel-Builder je Segment, gemeinsamer aktueller Modus und Änderungsfunktion. Nutze ein natives Tab-Muster oder eine Einzelauswahl, passend zur Funktion.

**Auftrag aus ELEMENTE.md** RubberSegment wechselt zwischen wenigen Modi derselben Ansicht, etwa „Tag“, „Woche“ und „Monat“. Nutze für Inhaltswechsel ein passendes Tab-Muster und für eine Einstellung eine Einzelauswahl. Verbinde alle Segmente mit dem tatsächlichen Modus und erhalte Entwürfe beim Wechsel. Jedes Segment ist direkt bedienbar. Eine zusätzliche Ziehgeste und ein gleitender Auswahlhintergrund dürfen die Eingabe nicht verzögern.

**Prüffälle** Direkte Maus- und Tastatureingaben wechseln sofort. Schnelle Wechsel zeigen den zuletzt gewählten Modus. Ziehen bleibt optional, und gespeicherte Entwürfe bleiben erhalten.

## SpringCheck

**Zieldatei** `SpringCheck.md`

**React-Bits-Referenz** Checkbox mit Klickfeedback, animiertem Häkchen und optionalem Durchstreichen eines Aufgabenlabels. [Demo und Copy for AI](https://www.reactbits.dev/micro/spring-check) · [Nutzungsbeispiel](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/constants/code/Micro/springCheckCode.js) · [Props](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/demo/Micro/SpringCheckDemo.jsx) · [JS/CSS-Quellcode](https://www.reactbits.dev/r/SpringCheck-JS-CSS.json)

**Abhängigkeiten der React-Variante** `motion@^12.23.12`, `@hugeicons/core-free-icons@^4.3.3`. Verwende für Python die Möglichkeiten des gewählten GUI-Frameworks.

**Nutzungsbeispiel für Python** Zeige zwei unabhängige Aufgaben und eine weitere Checkbox für eine gewöhnliche Mehrfachauswahl.

**Python-Schnittstelle** Native Checkbox mit Label, booleschem Status, Änderungsfunktion sowie einem Aufgabenmodus für das Durchstreichen. Für direkt wirkende Ein-/Aus-Einstellungen, falls im Projekt vorhanden, nutze dessen nativen Schalter.

**Auftrag aus ELEMENTE.md** SpringCheck schaltet unabhängige Auswahlen oder Aufgaben um. Binde jedes Kontrollkästchen an den tatsächlichen Status. Die Beschriftung gehört zur bedienbaren Fläche. Stelle Auswahl und Abwahl sichtbar und für Screenreader bereit. Streiche Text nur bei erledigten Aufgaben durch. Verwende für unmittelbar wirkende Ein-/Aus-Einstellungen den nativen Schalter.

**Prüffälle** Klick auf das Label und Bedienung per Leertaste schalten denselben Zustand. Häkchen und Text folgen auch externen Änderungen. Nur erledigte Aufgaben werden durchgestrichen.

## CodeSlots

**Zieldatei** `CodeSlots.md`

**React-Bits-Referenz** Ein Verifizierungscode erscheint in einzelnen Slots. Im Browser unterstützen die Slots Einfügen und SMS-Autofill über das zugrunde liegende Eingabefeld. [Demo und Copy for AI](https://www.reactbits.dev/micro/code-slots) · [Nutzungsbeispiel](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/constants/code/Micro/codeSlotsCode.js) · [Props](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/demo/Micro/CodeSlotsDemo.jsx) · [JS/CSS-Quellcode](https://www.reactbits.dev/r/CodeSlots-JS-CSS.json)

**Abhängigkeiten der React-Variante** `motion@^12.23.12`, `@hugeicons/react@^1.1.10`, `@hugeicons/core-free-icons@^4.3.3`. Verwende für Python die Möglichkeiten des gewählten GUI-Frameworks.

**Nutzungsbeispiel für Python** Zeige sechs Slots und prüfe fiktive Codes über einen asynchronen Demo-Adapter. Verwende genau ein echtes, beschriftetes Eingabefeld. Die Slots spiegeln dessen Inhalt.

**Python-Schnittstelle** Länge, erwartetes Zeichenformat, Eingabezustand, Validierung und Verifizierungsfunktion. Nutze eine Eingabeversion oder Anforderungs-ID für asynchrone Ergebnisse. Wo Desktop-Autofill fehlt, dokumentiere die Plattformgrenze und unterstütze Einfügen zuverlässig.

**Auftrag aus ELEMENTE.md** CodeSlots stellt einen vorhandenen Verifizierungscode als einzelne Stellen dar. Verwende semantisch ein Feld mit sichtbarem Label. Unterstütze Tastatur, Einfügen, Autovervollständigung und Korrektur gemäß dem erwarteten Codeformat. Verbinde die Eingabe mit der bestehenden Verifizierung. Erlaube pro Eingabestand höchstens einen laufenden Versuch und ignoriere Antworten auf inzwischen geänderte Eingaben. Zeige Fehler direkt am Feld. Halte Codes aus Logs, Vorschauen und Analysen. Teste mit fiktiven Codes.

**Prüffälle** Einfügen, Ersetzen, Löschen und Korrektur funktionieren inklusive führender Nullen. Je Eingabestand läuft höchstens eine Prüfung. Eine verspätete Antwort für einen früheren Wert bleibt wirkungslos. Der Fehler steht am Feld. Codes erscheinen weder in Logs noch in Vorschauen oder Analysen.

## HoldButton

**Zieldatei** `HoldButton.md`

**React-Bits-Referenz** Beim Gedrückthalten steigt eine sichtbare Füllung an. Bei vorzeitigem Loslassen läuft sie zurück. [Demo und Copy for AI](https://www.reactbits.dev/micro/hold-button) · [Nutzungsbeispiel](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/constants/code/Micro/holdButtonCode.js) · [Props](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/demo/Micro/HoldButtonDemo.jsx) · [JS/CSS-Quellcode](https://www.reactbits.dev/r/HoldButton-JS-CSS.json)

**Abhängigkeiten der React-Variante** keine zusätzlich zu React. Verwende für Python die Möglichkeiten des gewählten GUI-Frameworks.

**Nutzungsbeispiel für Python** Bestätige eine simulierte Archivierung durch Halten oder über einen klar bezeichneten Dialog mit derselben Aktion.

**Python-Schnittstelle** Beschriftung, Haltedauer, eine gemeinsame Bestätigungsaktion, Fortschritt und Status für laufende oder fehlgeschlagene Ausführung. Verwende monotone Zeit für den Fortschritt.

**Auftrag aus ELEMENTE.md** HoldButton bietet eine bewusste Bestätigung für seltene Aktionen mit Folgen. Zeige den Haltefortschritt ab dem Drücken. Loslassen vor Ablauf, Gestenabbruch oder Fokusverlust setzen ihn zurück. Nach Erreichen der Haltezeit löst die Aktion genau einmal aus. Biete denselben Vorgang über einen klar beschrifteten Bestätigungsdialog an. Dringende Aktionen bleiben direkt erreichbar.

**Prüffälle** Frühes Loslassen, Fokusverlust und Gestenabbruch setzen den Fortschritt zurück. Vollständiges Halten oder der Dialog lösen pro Vorgang dieselbe Aktion höchstens einmal aus. Nach einem Fehler ist ein bewusster Neuversuch möglich.

## Folder

**Zieldatei** `Folder.md`

**React-Bits-Referenz** Eine Sammlung öffnet sich mit animierter Ordnerklappe oder Buchbewegung und zeigt auswählbare Inhalte. [Demo und Copy for AI](https://www.reactbits.dev/components/folder) · [Nutzungsbeispiel](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/constants/code/Components/folderCode.js) · [Props](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/demo/Components/FolderDemo.jsx) · [JS/CSS-Quellcode](https://www.reactbits.dev/r/Folder-JS-CSS.json)

**Abhängigkeiten der React-Variante** keine zusätzlich zu React. Verwende für Python die Möglichkeiten des gewählten GUI-Frameworks.

**Nutzungsbeispiel für Python** Zeige eine zugängliche Beispielsammlung und eine gesperrte Sammlung mit neutraler Vorschau.

**Python-Schnittstelle** ID, Label, Symbol, Zugriffsfunktion, Funktionen für Vorschau und Öffnen sowie bei vorhandenem Verschiebe-Adapter eine Menüaktion. Große Sammlungen erhalten eine Detailansicht.

**Auftrag aus ELEMENTE.md** Folder öffnet eine Sammlung mit ihrem tatsächlichen Inhalt. Zeige Namen und ein passendes Symbol. Biete für umfangreiche Sammlungen eine Detailansicht. Unterstütze Ziehen nur für tatsächlich verfügbares Verschieben und biete dafür auch eine Menüaktion. Wende die vorhandenen Zugriffsregeln auf Vorschau, Suche und Direkteinstieg an. Verwende bei gesperrten oder sensiblen Sammlungen eine neutrale Vorschau.

**Prüffälle** Öffnen, Vorschau, Suche und Direkteinstieg verwenden dieselbe Zugriffskontrolle. Gesperrte Inhalte erscheinen an keiner dieser Stellen. Verschieben ist nur mit passendem Adapter verfügbar und zusätzlich per Tastaturmenü erreichbar.

## GlassSurface

**Zieldatei** `GlassSurface.md`

**React-Bits-Referenz** Abgerundete Fläche mit Flüssigglas-Optik und Brechung des Hintergrunds im Browser. [Demo und Copy for AI](https://www.reactbits.dev/components/glass-surface) · [Nutzungsbeispiel](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/constants/code/Components/glassSurfaceCode.js) · [Props](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/demo/Components/GlassSurfaceDemo.jsx) · [JS/CSS-Quellcode](https://www.reactbits.dev/r/GlassSurface-JS-CSS.json)

**Abhängigkeiten der React-Variante** keine zusätzlich zu React. Verwende für Python die Möglichkeiten des gewählten GUI-Frameworks.

**Nutzungsbeispiel für Python** Zeige eine Werkzeugleiste über wechselnden Hintergründen und einen reproduzierbaren Wechsel auf deckendes Material.

**Python-Schnittstelle** Inhaltscontainer mit Stilparametern, Auswahl für reduzierte Transparenz und deckendem Modus für Sichtschutz. Verwende vorhandenes Plattformmaterial. In reinem Tkinter genügt eine deckende Fläche mit klarer Umrandung, gutem Kontrast und sichtbarem Fokus.

**Auftrag aus ELEMENTE.md** GlassSurface trennt ein Dock oder eine Werkzeugleiste leicht vom Inhalt. Verwende das vorhandene Plattformmaterial und halte Text und Fokus über wechselnden Hintergründen lesbar. Wechsle bei reduzierter Transparenz, schwachem Kontrast oder schlechter Leistung zu einer deckenden Fläche. Verwende für Sichtschutz durchgehend eine deckende Fläche.

**Prüffälle** Text, Icons und Fokusring sind auf hellen und dunklen Hintergründen lesbar. Reduzierte Transparenz, unzureichender Kontrast oder schlechte Leistung aktivieren den deckenden Modus. Sichtschutz bleibt durchgehend deckend.

## MagicBento

**Zieldatei** `MagicBento.md`

**React-Bits-Referenz** Kartenraster mit hervorgehobenen Bereichen, Mausrandlicht und Klickfeedback. [Demo und Copy for AI](https://www.reactbits.dev/components/magic-bento) · [Nutzungsbeispiel](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/constants/code/Components/magicBentoCode.js) · [Props](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/demo/Components/MagicBentoDemo.jsx) · [JS/CSS-Quellcode](https://www.reactbits.dev/r/MagicBento-JS-CSS.json)

**Abhängigkeiten der React-Variante** `@hugeicons/react@^1.1.10`, `@hugeicons/core-free-icons@^4.3.3`. Verwende für Python die Möglichkeiten des gewählten GUI-Frameworks.

**Nutzungsbeispiel für Python** Zeige eine Übersicht mit einer Hauptaufgabe, einer verlinkten Karte und einer reinen Informationskarte.

**Python-Schnittstelle** Kartendaten oder Builder, Priorität und optionale Aktion, Abstände und responsive Spalten. Die Hauptaufgabe erhält die prominenteste Position. Verwende Projektwerte oder lokal erzeugte Beispieldaten.

**Auftrag aus ELEMENTE.md** MagicBento ordnet wenige unterschiedliche Bereiche einer Übersicht. Gib der häufigsten Aufgabe den prominentesten Platz. Nutze bestehende Daten und mache Karten nur bei einem tatsächlichen Ziel interaktiv. Lass Karten mit dem Inhalt wachsen. Reduziere bei wenig Platz oder großer Schrift die Spalten. Halte visuelle Reihenfolge, Tastaturfokus und Screenreader-Reihenfolge konsistent.

**Prüffälle** Bei wenig Platz und großer Schrift reduziert sich die Spaltenzahl. Inhalte werden nicht abgeschnitten. Visuelle Reihenfolge, Tab-Reihenfolge und Lesereihenfolge stimmen überein. Nur Karten mit Ziel sind interaktiv.

## SplitFlapText

**Zieldatei** `SplitFlapText.md`

**React-Bits-Referenz** Mechanische Fallblattanzeige, die zeichenweise zu einem kurzen neuen Wert umklappt. [Demo und Copy for AI](https://www.reactbits.dev/text-animations/split-flap-text) · [Nutzungsbeispiel](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/constants/code/TextAnimations/splitFlapTextCode.js) · [Props](https://github.com/DavidHDev/react-bits/blob/e8e0277a4e80540b38eb9e975dbd4c2b413905e5/src/demo/TextAnimations/SplitFlapTextDemo.jsx) · [JS/CSS-Quellcode](https://www.reactbits.dev/r/SplitFlapText-JS-CSS.json)

**Abhängigkeiten der React-Variante** keine zusätzlich zu React. Verwende für Python die Möglichkeiten des gewählten GUI-Frameworks.

**Nutzungsbeispiel für Python** Zeige einen kurzen Status und einen Countdown mit stabilen Ziffernbreiten. Verwende in der Demo eine simulierte Zeitquelle.

**Python-Schnittstelle** Übergebener kurzer Text oder formatierter Zahlenwert, optionaler Zeitquellenadapter, reduzierter Bewegungsmodus und optionaler Rückruf für relevante Übergänge.

**Auftrag aus ELEMENTE.md** SplitFlapText zeigt einen kurzen Status, eine Kennzahl oder einen Countdown. Verwende Ziffern mit stabiler Breite und leite den Countdown aus derselben Zeitquelle wie den Ablauf ab. Zeige bei reduzierter Bewegung den aktuellen Wert direkt. Gib Screenreadern den vollständigen Wert und kündige nur relevante Übergänge an, etwa das Ende eines Countdowns. Zeige längere Hinweise als normalen, umbruchfähigen Text.

**Prüffälle** Der Countdown folgt der gemeinsamen Zeitquelle, erreicht einmal das Ende und zeigt keine negativen Werte. Bei reduzierter Bewegung erscheint der Endwert des jeweiligen Updates direkt. Die zugängliche Ausgabe enthält den Gesamtwert, längere Texte können normal umbrechen.
