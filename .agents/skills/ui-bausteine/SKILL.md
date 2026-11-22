---
name: ui-bausteine
description: UI-Abläufe mit Formularen, Navigation, Auswahl, Fortschritt oder responsiven Übersichten im vorhandenen Web- oder Python-Framework umsetzen und prüfen.
---

1. Prüfe den vorhandenen Stack und wiederverwendbare Widgets. Verwende für bestehende Python-Projekte deren Framework; Tkinter nur für passende eigenständige Beispiele.
2. Lies [die Auswahlübersicht](references/BAUSTEINE.md). Lade nur die gewählte Vorlage aus `references/examples/` und [die UI-Vorgaben](references/UI.md).
3. Bestimme die tatsächliche Zustandsquelle, Aktion, Validierung und Rückmeldung. Erhalte Eingaben beim Wechsel. Binde sichtbare Bedienelemente vollständig an den Ablauf.
4. Prüfe normalen Ablauf, Rückweg, Fehler, schnelle Mehrfachbedienung, Abbruch, externe Zustandsänderungen, Tastatur, schmale Ansichten und große Schrift. Animation darf Eingaben nicht blockieren; statischen Modus anbieten und Timer aufräumen.
5. Berichte tatsächliche Prüfungen und Plattformgrenzen. Bei Gesten oder bewegten Materialien zusätzlich [Apple Design](references/APPLE-DESIGN.md) lesen; Stilwerte sind Empfehlungen, keine zwingenden Abhängigkeiten.
