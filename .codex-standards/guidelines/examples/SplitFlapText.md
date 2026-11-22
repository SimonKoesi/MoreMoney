# SplitFlapText

Kurzer Status und Countdown mit fester Zeichenbreite. Das vollständige aktuelle Ergebnis bleibt als natives Label vorhanden; nur die dekorative Anzeige animiert. „Reduzierte Bewegung“ zeigt den Zielwert sofort. Eine gemeinsame simulierte Zeitquelle steuert die Demo; Start/Pause und +5 Sekunden ändern diese Quelle. Das Ende wird einmal pro Countdown gemeldet. Native Screenreader-Unterstützung von Tk hängt von Betriebssystem und Hilfsmittel ab und muss dort zusätzlich geprüft werden.

Abhängigkeiten: Python 3.10 oder neuer mit Tkinter/ttk (Standardbibliothek; unter Linux gegebenenfalls das Systempaket `python3-tk`). Den folgenden Block unverändert als `SplitFlapText.py` speichern und mit `python SplitFlapText.py` starten. Alle Aktionen verwenden ausschließlich lokale Demo-Daten. Die Implementierung ist eigenständig und übernimmt keinen React-Bits-Quellcode.

```python
import math
import tkinter as tk
from tkinter import ttk

class SplitFlapText(ttk.Frame):
    def __init__(self, master, reduced=False):
        super().__init__(master, padding=12)
        self.reduced, self.job, self.target = reduced, None, ""
        self.visible = ttk.Label(self, font=("Courier New", 22), anchor="w")
        self.visible.pack(fill="x")
        self.full = ttk.Label(self, wraplength=280)
        self.full.pack(fill="x", pady=8)
        self.bind("<Destroy>", self._destroyed, add="+")

    def set_text(self, value):
        value = str(value)
        if self.job:
            self.after_cancel(self.job)
            self.job = None
        self.target = value
        self.position = 0
        self.full.config(text=value)
        if self.reduced or len(value) > 20:
            self.visible.config(text=value if len(value) <= 20 else "")
            return
        self.visible.config(text="─" * len(value))
        self.job = self.after(90, self._finish)

    def _finish(self):
        self.job = None
        self.position += 1
        self.visible.config(text=self.target[:self.position] + "─" * (len(self.target) - self.position))
        if self.position < len(self.target):
            self.job = self.after(35, self._finish)

    def set_reduced(self, enabled):
        self.reduced = bool(enabled)
        self.set_text(self.target)

    def _destroyed(self, event):
        if event.widget is self and self.job:
            self.after_cancel(self.job)
            self.job = None

class Countdown:
    def __init__(self, clock, duration, on_end):
        self.clock, self.deadline = clock, clock() + duration
        self.on_end, self.ended = on_end, False

    def sample(self):
        remaining = max(0, math.ceil(self.deadline - self.clock()))
        if remaining == 0 and not self.ended:
            self.ended = True
            self.on_end()
        return f"{remaining // 60:02d}:{remaining % 60:02d}"

class Demo(ttk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.pack(fill="both", expand=True)
        self.now, self.running, self.job = 0.0, False, None
        self.status = SplitFlapText(self)
        self.status.pack(fill="x")
        self.status.set_text("BEREIT")
        self.display = SplitFlapText(self)
        self.display.pack(fill="x")
        self.countdown = Countdown(lambda: self.now, 15, lambda: self.status.set_text("BEENDET"))
        reduced = tk.BooleanVar(self)
        def motion():
            for view in (self.status, self.display):
                view.set_reduced(reduced.get())
        ttk.Checkbutton(self, text="Reduzierte Bewegung", variable=reduced, command=motion).pack(anchor="w")
        ttk.Button(self, text="Start / Pause", command=self.toggle).pack(fill="x", padx=12, pady=8)
        ttk.Button(self, text="Simulierte Zeit +5 Sekunden", command=lambda: self.advance(5)).pack(fill="x", padx=12)
        self.last = None
        self.refresh()
        self.bind("<Destroy>", self._destroyed, add="+")

    def refresh(self):
        value = self.countdown.sample()
        if value != self.last:
            self.display.set_text(value)
            self.last = value

    def advance(self, seconds):
        self.now += seconds
        self.refresh()

    def toggle(self):
        self.running = not self.running
        if self.running and self.job is None:
            self.job = self.after(1000, self.tick)
        elif self.job:
            self.after_cancel(self.job)
            self.job = None

    def tick(self):
        self.job = None
        if self.running:
            self.advance(1)
            if not self.countdown.ended:
                self.job = self.after(1000, self.tick)
            else:
                self.running = False

    def _destroyed(self, event):
        if event.widget is self and self.job:
            self.after_cancel(self.job)
            self.job = None

def demo(root):
    return Demo(root)

if __name__ == "__main__":
    root = tk.Tk()
    root.title("SplitFlapText")
    demo(root)
    root.mainloop()
```
