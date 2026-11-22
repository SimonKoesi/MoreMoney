# SpringCheck

Drei native Checkboxen: zwei Aufgaben und eine unabhängige Auswahl. Labelklick und Leertaste ändern den gemeinsamen booleschen Zustand. Externe Änderungen werden ebenfalls dargestellt. Nur erledigte Aufgaben erhalten eine durchgestrichene Schrift. Statische Darstellung ohne Animation; keine zusätzlichen Pakete.

Abhängigkeiten: Python 3.10 oder neuer mit Tkinter/ttk (Standardbibliothek; unter Linux gegebenenfalls das Systempaket `python3-tk`). Den folgenden Block unverändert als `SpringCheck.py` speichern und mit `python SpringCheck.py` starten. Alle Aktionen verwenden ausschließlich lokale Demo-Daten. Die Implementierung ist eigenständig und übernimmt keinen React-Bits-Quellcode.

```python
import tkinter as tk
from tkinter import ttk, font

class SpringCheck(ttk.Frame):
    def __init__(self, master, label, value, on_change, task=False):
        super().__init__(master, padding=6)
        self.value, self.on_change, self.task = value, on_change, task
        self.normal = font.nametofont("TkDefaultFont").copy()
        self.finished = self.normal.copy()
        self.finished.configure(overstrike=True)
        # tk.Checkbutton exposes the full native label as one clickable control.
        self.button = tk.Checkbutton(self, text=label, variable=value, anchor="w",
                                     takefocus=True, highlightthickness=2)
        self.button.pack(fill="x")
        self.trace = value.trace_add("write", self._changed)
        self.bind("<Destroy>", self._destroyed, add="+")
        self._changed()

    def _changed(self, *args):
        checked = bool(self.value.get())
        self.button.config(font=self.finished if checked and self.task else self.normal)
        self.on_change(checked)

    def _destroyed(self, event):
        if event.widget is self:
            self.value.trace_remove("write", self.trace)

def demo(root):
    values = [tk.BooleanVar(root) for _ in range(3)]
    status = ttk.Label(root, padding=12)
    def update(_):
        status.config(text=f"Erledigt: {sum(v.get() for v in values[:2])} / 2; "
                           f"Auswahl: {'Ja' if values[2].get() else 'Nein'}")
    widgets = []
    for i, label in enumerate(("Angebot prüfen", "Entwurf speichern", "Zusatzspalte auswählen")):
        widget = SpringCheck(root, label, values[i], update, task=i < 2)
        widget.pack(fill="x")
        widgets.append(widget)
    status.pack(fill="x")
    ttk.Button(root, text="Extern: Erste Aufgabe erledigen", command=lambda: values[0].set(True)).pack(pady=12)
    return widgets

if __name__ == "__main__":
    root = tk.Tk()
    root.title("SpringCheck")
    demo(root)
    root.mainloop()
```
