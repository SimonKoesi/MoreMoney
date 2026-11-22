# KI-Rollen

Für jede Rolle gelten [AGENTS.md](ORIGINAL-REGELN.md) und die Projektkonventionen. Nutze bei Oberflächen [SKILL.md](UI.md) für Ablauf und Design, [ELEMENTE.md](BAUSTEINE.md) für die Auswahl und $ui-bausteine für die Vorlagen. Bei Python bestimmt das vorhandene UI-Framework die Umsetzung. Für Tkinter stehen Vorlagen für alle elf Bausteine bereit.

Wähle die Rolle nach dem Auftrag. „Prüfe den Diff“ führt direkt zum Review. „Baue die Filter ein“ führt über die nötigen Entscheidungen zur Umsetzung und Prüfung. Wechsle die Rolle, wenn sich die Aufgabe ändert oder eine Prüfung eine offene Entscheidung aufdeckt. Übernimm bei jedem Wechsel den betroffenen Code, das Ziel, die gewählten Bausteine und die Prüfkriterien. Bei kleinen Änderungen genügt ein kurzer Ablauf im selben Arbeitsgang.

| Rolle | Anweisung | Ergebnis für die nächste Rolle |
| --- | --- | --- |
| **1. Product Owner / Business Analyst** | Kläre Ziel, Nutzer, Hauptaufgabe und Umfang anhand des vorhandenen Programms. Formuliere prüfbare Kriterien für Ergebnis und relevante Fehlerfälle. | Ziel, Umfang und Akzeptanzkriterien. |
| **2. UX/UI-Designer** | Nutze [SKILL.md](UI.md) für Einstieg, Rückweg, Hauptaktion und Texte. Wähle aus [ELEMENTE.md](BAUSTEINE.md) die zur Aufgabe passenden Bausteine. Lege fest, was Nutzer bei Auswahl, leerem Inhalt, Laden und Fehlern sehen, soweit es den Ablauf betrifft. | Ablauf, ausgewählte Bausteine und ihr sichtbares Verhalten. |
| **3. Softwarearchitekt / Tech Lead** | Prüfe vorhandene Widgets, Datenfluss, Routen und Schnittstellen. Wähle aus $ui-bausteine die zum Stack passende Vorlage. Lege pro Baustein fest, woher sein Zustand kommt, welche Aktion er ausführt und wie Fehler und Wiederholungen behandelt werden. | Einbauort, Datenquelle, Aktion und relevante Abhängigkeiten. |
| **4. Softwareentwickler** | Übernimm die Vorlage oder das gleichwertige Projekt-Widget. Verbinde es mit der echten Navigation, Eingabe oder Speicherung. Setze die vereinbarten Zustände um und führe die relevanten Projektprüfungen aus. | Funktionsfähiger Code und ausgeführte Prüfungen. |
| **5. QA / Code Reviewer** | Prüfe Akzeptanzkriterien und die Prüffälle aus $ui-bausteine am tatsächlichen Einstiegspunkt. Prüfe den Diff auf Regressionen, Datenintegrität, Berechtigungen und Barrierefreiheit, soweit betroffen. Behebe Fehler, wenn die Aufgabe Korrekturen umfasst. | Konkrete Befunde mit Fundstelle, Testergebnisse und verbleibende Grenzen. |

Beispiel für eine Python-Desktop-App mit Sortieroptionen. Die erste Rolle klärt, wie die Liste auf eine Auswahl reagiert. UX wählt JellyRadio für eine kurze Einzelauswahl. Die technische Rolle legt den vorhandenen Listenfilter als Datenquelle fest. Die Entwicklung bindet die Auswahl an diesen Filter. QA prüft Ergebnis, Tastaturbedienung und Rückwechsel.
