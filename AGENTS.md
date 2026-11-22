<!-- codex-standards:start -->
# Programmierstandards

- Prüfe vorhandenen Code, Projektregeln, Stack und Tests; erhalte Funktionen, IDs, Daten und Nutzereingaben. Nutze vorhandene Werkzeuge und Widgets.
- Setze beauftragte Abläufe vollständig um: sichtbare Aktionen brauchen echte Navigation, Zustand, Validierung und gegebenenfalls Speicherung. Erfolg erst nach bestätigtem Ergebnis; verhindere doppelte Auswirkungen. Erhalte Eingaben bei Fehlern und ermögliche erneute Versuche.
- Triff reversible Detailentscheidungen selbst. Frage bei blockierenden Entscheidungen oder erheblichen Folgen für Daten, Kosten oder Veröffentlichung. Zugangsdaten und sensible Inhalte gehören weder in Git noch in Logs oder Testdaten; externe Nebenwirkungen mit isolierten Daten/Mocks prüfen.
- Teste betroffene Abläufe einschließlich Fehler, Abbruch, Wiederholung und Rückweg. Berichte ausgeführte Prüfungen und Grenzen ehrlich. Ergänze gezielte Regressionstests, wenn erforderlich.
- Bei Rollen-/Umfangsentscheidungen lies `.codex-standards/guidelines/KI-ROLLEN.md`, relativ zu dieser Datei. Rollen sind Arbeitsperspektiven, keine Pflicht zur Agentendelegation.
- Bei UI-Aufgaben lies `.codex-standards/guidelines/UI.md` und die Übersicht `.codex-standards/guidelines/BAUSTEINE.md`, relativ zu dieser Datei. Verwende den Skill `ui-bausteine` für Umsetzung und Prüfung. Bei Webgesten, Animation oder Materialien lies zusätzlich `.codex-standards/guidelines/APPLE-DESIGN.md`; konkrete Projektvorgaben und Barrierefreiheit gehen vor Stilvorschlägen.
- Ruhige Flächen, konsistente Ausrichtung und gezielter Akzent; pro Ansicht höchstens eine hervorgehobene Hauptaktion. Keine dekorativen Untertitel/Einleitungen. Sichtbare Labels, Fokus, ausreichender Kontrast und zusätzliche Auswahlkennzeichnung. Native Eingabeelemente bevorzugen; schmale Ansichten und große Schrift berücksichtigen.
- Bei unerwartet wachsendem Umfang am nächsten sinnvollen Haltepunkt eine höhere Modellstufe empfehlen und erledigte Arbeit festhalten; keinen zweiten Implementierungslauf automatisch starten.

Ausführliche Quellen, Empfehlungen und aufgelöste Widersprüche: `.codex-standards/guidelines/QUELLEN.md`, relativ zu dieser Datei. Lies nur aufgabenrelevante Referenzen. Die Installation ersetzt diese Referenzpfade durch absolute Pfade bzw. autarke Projektpfade.
<!-- codex-standards:end -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
