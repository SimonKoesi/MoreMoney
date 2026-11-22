# Finanzlogik

Alle persistierten Geldwerte sind ganze Cent. Eingaben wie `1299,95` und `1299.95` sind zulässig, Tausendertrennzeichen und mehr als zwei Nachkommastellen werden abgelehnt. Darstellung erfolgt mit de-DE/EUR. Für Verhältniskennzahlen und Diagrammkoordinaten darf nach abgeschlossener Centrechnung in Anzeigeeinheiten umgerechnet werden.

Kontobestand: Anfangsbestand plus income/transfer-in minus expense/transfer-out. Ein Transfer besitzt zwei atomar angelegte Buchungen mit gemeinsamer transferId. Einkommen-/Ausgabensummen filtern ausschließlich income bzw. expense. Löschen eines Transfers entfernt beide Seiten atomar.

Budget: Bezahlt ist die Summe der verknüpften Ausgaben. Je Position zählt der geplante Einzelpreis × Menge, oder Preis plus Versand der aktiven Alternative × Menge. Offener Plan = max(0, Plan minus verknüpfte Positionszahlungen). Erwartete Kosten = alle Budgetzahlungen plus offene Positionspläne. Das verhindert Doppelzählung, auch bei Überzahlungen und direkten Budgetbuchungen. Budgetrest = Limit minus bezahlt. Prognoserest = Limit minus bezahlt minus offen.

Beispiel: Sofa geplant 1.000 EUR; Anzahlung 200 EUR → bezahlt 200, offen 800, erwartet 1.000. Restzahlung 800 → bezahlt 1.000, offen 0, erwartet weiterhin 1.000. Erledigt-Checkbox verändert keinen dieser Werte.

Wiederkehrende Zahlungen sind Planwerte ohne Buchung. Monatsäquivalente: wöchentlich × 52 / 12, monatlich × 1, quartalsweise / 3, halbjährlich / 6, jährlich / 12. Anzeige auf den nächsten Cent gerundet. Das ist kein kalendergenauer Fälligkeitsplan.

Simulator: Bestand + erwartetes monatliches Netto × Monate − monatliche Fixkosten × Monate − offene Budgetpläne − Kaufpreis − Reserve. Alle Annahmen stehen sichtbar neben dem Ergebnis. Variable zukünftige Ausgaben und Unsicherheit sind nicht modelliert. Eine bereits in offenen Plänen enthaltene Anschaffung darf nicht noch einmal eingegeben werden.

Sparfortschritt ist in 0.1 eine manuelle Planungszuordnung, keine Kontotransaktion und kein Nachweis eines realen Vermögensbestands. Transfers realer Sparbeträge ausschließlich über Konten buchen. Eine Sparquote wird noch nicht angezeigt, damit aus manuellen Zuordnungen keine falsche Sparkennzahl entsteht.
