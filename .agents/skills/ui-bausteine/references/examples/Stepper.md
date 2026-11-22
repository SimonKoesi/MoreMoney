# Stepper

Drei Formularschritte mit Pflichtfeld, erhaltenen Eingaben, erlaubten Direktsprüngen und genau einmaligem Abschluss. Zurück und Abbruch sind direkt erreichbar. `Step` definiert Aufbau und Validierung; `Stepper` verwaltet den aktuellen Index. Ein Timeradapter kann den aktuellen Schritt über `show_step` setzen. Die native Fortschrittsanzeige ist statisch.

Abhängigkeiten: Python 3.10 oder neuer mit Tkinter/ttk (Standardbibliothek; unter Linux gegebenenfalls das Systempaket `python3-tk`). Den folgenden Block unverändert als `Stepper.py` speichern und mit `python Stepper.py` starten. Alle Aktionen verwenden ausschließlich lokale Demo-Daten. Die Implementierung ist eigenständig und übernimmt keinen React-Bits-Quellcode.

```python
from dataclasses import dataclass
import tkinter as tk
from tkinter import ttk

@dataclass
class Step:
    label: str
    build: object
    validate: object = lambda panel: True

class Stepper(ttk.Frame):
    def __init__(self, master, steps, on_finish, on_cancel, direct=False):
        super().__init__(master, padding=16)
        if not steps:
            raise ValueError("Mindestens ein Schritt ist erforderlich")
        self.steps, self.index, self.direct = steps, 0, direct
        self.on_finish, self.on_cancel = on_finish, on_cancel
        self.done = self.busy = False
        self.visited = 0
        self.progress = ttk.Label(self)
        self.progress.pack(anchor="w")
        self.jump = ttk.Combobox(self, state="readonly")
        self.jump.pack(fill="x", pady=8)
        self.jump.bind("<<ComboboxSelected>>", self._jump)
        self.panels = []
        for step in steps:
            panel = ttk.Frame(self)
            step.build(panel)
            self.panels.append(panel)
        self.error = ttk.Label(self, foreground="#a51d27", wraplength=300)
        self.error.pack(fill="x")
        bar = ttk.Frame(self)
        bar.pack(side="bottom", fill="x", pady=12)
        self.back = ttk.Button(bar, text="Zurück", command=self.previous)
        self.back.pack(side="left")
        self.next = ttk.Button(bar, command=self.advance)
        self.next.pack(side="right")
        ttk.Button(bar, text="Abbrechen", command=self.cancel).pack(side="left", padx=8)
        self.show_step(0)

    def _jump(self, event=None):
        target = self.jump.current()
        if target <= self.index:
            self.show_step(target)
        elif self.steps[self.index].validate(self.panels[self.index]):
            self.show_step(target)
        else:
            self.jump.current(self.index)

    def show_step(self, index):
        if self.done or self.busy or not 0 <= index < len(self.steps):
            return
        if index > self.visited:
            return
        for panel in self.panels:
            panel.pack_forget()
        self.index = index
        self.panels[index].pack(fill="both", expand=True, before=self.error)
        self.progress.config(text=f"Schritt {index + 1} von {len(self.steps)}")
        allowed = self.steps[:self.visited + 1] if self.direct else self.steps[index:index + 1]
        self.jump.config(values=[step.label for step in allowed])
        self.jump.current(index if self.direct else 0)
        self.jump.config(state="readonly" if self.direct else "disabled")
        self.back.config(state="normal" if index else "disabled")
        self.next.config(text="Fertig" if index == len(self.steps) - 1 else "Weiter")
        self.error.config(text="")

    def previous(self):
        self.show_step(self.index - 1)

    def advance(self):
        if self.done or self.busy:
            return
        if not self.steps[self.index].validate(self.panels[self.index]):
            self.error.config(text="Bitte das Pflichtfeld ausfüllen.")
            return
        if self.index < len(self.steps) - 1:
            self.visited = max(self.visited, self.index + 1)
            self.show_step(self.index + 1)
            return
        self.busy = True
        try:
            self.on_finish()
        except Exception:
            self.error.config(text="Abschluss fehlgeschlagen. Erneut versuchen.")
        else:
            self.done = True
            self.next.config(state="disabled")
            self.error.config(text="Abgeschlossen.")
        finally:
            self.busy = False

    def cancel(self):
        if not self.busy:
            self.done = True
            self.on_cancel()

def demo(root):
    answers = [tk.StringVar(root) for _ in range(3)]
    steps = []
    for index, label in enumerate(("Name *", "Notiz (optional)", "Ort (optional)")):
        def build(panel, i=index, text=label):
            ttk.Label(panel, text=text).pack(anchor="w")
            panel.entry = ttk.Entry(panel, textvariable=answers[i])
            panel.entry.pack(fill="x", pady=8)
        def validate(panel, i=index):
            valid = i != 0 or bool(answers[i].get().strip())
            if not valid:
                panel.entry.focus_set()
            return valid
        steps.append(Step(label, build, validate))
    saved = []
    widget = Stepper(root, steps, lambda: saved.append([v.get() for v in answers]), root.destroy, direct=True)
    widget.pack(fill="both", expand=True)
    return widget

if __name__ == "__main__":
    root = tk.Tk()
    root.title("Stepper")
    root.geometry("420x320")
    demo(root)
    root.mainloop()
```
