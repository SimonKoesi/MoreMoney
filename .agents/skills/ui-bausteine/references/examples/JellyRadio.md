# JellyRadio

Native, gemeinsam beschriftete Radiogruppe mit vertikaler Anordnung für schmale Fenster. Maus, Tabulator und Pfeiltasten bedienen die Auswahl. Der übergebene `StringVar` ist die einzige Zustandsquelle; auch externe Änderungen aktualisieren den Filter. Das optionale Federfeedback wird zugunsten eines statischen, stabilen Layouts weggelassen.

Abhängigkeiten: Python 3.10 oder neuer mit Tkinter/ttk (Standardbibliothek; unter Linux gegebenenfalls das Systempaket `python3-tk`). Den folgenden Block unverändert als `JellyRadio.py` speichern und mit `python JellyRadio.py` starten. Alle Aktionen verwenden ausschließlich lokale Demo-Daten. Die Implementierung ist eigenständig und übernimmt keinen React-Bits-Quellcode.

```python
import tkinter as tk
from tkinter import ttk

class JellyRadio(ttk.LabelFrame):
    def __init__(self, master, label, options, value, on_change):
        super().__init__(master, text=label, padding=12)
        self.value, self.on_change = value, on_change
        self.keys = {key for key, _ in options}
        for key, text in options:
            ttk.Radiobutton(self, text=text, value=key, variable=value).pack(anchor="w", pady=4)
        self.trace = value.trace_add("write", self._changed)
        self.bind("<Destroy>", self._destroyed, add="+")
        self._changed()

    def _changed(self, *args):
        if self.value.get() in self.keys:
            self.on_change(self.value.get())

    def _destroyed(self, event):
        if event.widget is self:
            self.value.trace_remove("write", self.trace)

def demo(root):
    value = tk.StringVar(root, "all")
    output = ttk.Label(root, padding=12, wraplength=220)
    records = [("Angebot prüfen", False), ("Entwurf speichern", True)]
    def apply_filter(key):
        rows = [name for name, done in records if key == "all" or done == (key == "done")]
        output.config(text="\n".join(rows) or "Keine Aufgaben")
    widget = JellyRadio(root, "Aufgaben filtern", [("all", "Alle"), ("open", "Offen"),
                        ("done", "Erledigt")], value, apply_filter)
    widget.pack(fill="x", padx=12, pady=12)
    output.pack(fill="x")
    ttk.Button(root, text="Extern: Offen", command=lambda: value.set("open")).pack(pady=8)
    return widget

if __name__ == "__main__":
    root = tk.Tk()
    root.title("JellyRadio")
    demo(root)
    root.mainloop()
```
