# RubberSegment

Native Tabs für Tag, Woche und Monat. Alle Panels werden einmal aufgebaut; Entwürfe und Markierungen bleiben beim Wechsel erhalten. Tabs lassen sich direkt anklicken und mit Strg+Tab wechseln. `set_mode` unterstützt externe Änderungen. Der statische Modus ist Standard, Ziehen ist nicht erforderlich.

Abhängigkeiten: Python 3.10 oder neuer mit Tkinter/ttk (Standardbibliothek; unter Linux gegebenenfalls das Systempaket `python3-tk`). Den folgenden Block unverändert als `RubberSegment.py` speichern und mit `python RubberSegment.py` starten. Alle Aktionen verwenden ausschließlich lokale Demo-Daten. Die Implementierung ist eigenständig und übernimmt keinen React-Bits-Quellcode.

```python
import tkinter as tk
from tkinter import ttk

class RubberSegment(ttk.Notebook):
    def __init__(self, master, segments, mode, on_change):
        super().__init__(master)
        self.mode, self.on_change = mode, on_change
        self.panels = {}
        self._syncing = False
        for key, label, builder in segments:
            panel = ttk.Frame(self, padding=12)
            builder(panel)
            self.panels[key] = panel
            self.add(panel, text=label)
        if mode.get() not in self.panels:
            raise ValueError("Unbekannter Modus")
        self.select(self.panels[mode.get()])
        self.enable_traversal()
        self.bind("<<NotebookTabChanged>>", self._selected)
        self.trace = mode.trace_add("write", self._external)
        self.bind("<Destroy>", self._destroyed, add="+")

    def _selected(self, event=None):
        selected = self.select()
        for key, panel in self.panels.items():
            if str(panel) == selected:
                if self.mode.get() != key:
                    self.mode.set(key)
                break

    def _external(self, *args):
        key = self.mode.get()
        if key in self.panels:
            self.select(self.panels[key])
            self.on_change(key)

    def set_mode(self, key):
        if key not in self.panels:
            raise ValueError("Unbekannter Modus")
        self.mode.set(key)

    def _destroyed(self, event):
        if event.widget is self:
            self.mode.trace_remove("write", self.trace)

def demo(root):
    mode = tk.StringVar(root, "day")
    status = ttk.Label(root, text="Ansicht: day")
    def builder(panel):
        ttk.Label(panel, text="Entwurf").pack(anchor="w")
        panel.editor = tk.Text(panel, width=20, height=6, wrap="word", undo=True)
        panel.editor.insert("1.0", "Dieser Entwurf bleibt erhalten.")
        panel.editor.tag_add("sel", "1.0", "1.6")
        panel.editor.pack(fill="both", expand=True)
    widget = RubberSegment(root, [(key, label, builder) for key, label in
                           [("day", "Tag"), ("week", "Woche"), ("month", "Monat")]],
                           mode, lambda key: status.config(text=f"Ansicht: {key}"))
    widget.pack(fill="both", expand=True, padx=12, pady=12)
    status.pack()
    return widget

if __name__ == "__main__":
    root = tk.Tk()
    root.title("RubberSegment")
    demo(root)
    root.mainloop()
```
