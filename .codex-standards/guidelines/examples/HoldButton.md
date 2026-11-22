# HoldButton

Simulierte lokale Archivierung per Halten oder explizitem Bestätigungsdialog. Maus und Leertaste unterstützen Halten; Loslassen, Verlassen, Escape und Fokusverlust brechen ab. Monotone Zeit steuert den Fortschritt. „Statischer Fortschritt“ ersetzt Zwischenstände durch Text. Die gemeinsame Aktion ist synchron und muss bei Erfolg zurückkehren, bei Fehlern eine Exception auslösen. Nach Fehler ist ein bewusster Neuversuch möglich; eine neue Operation erfordert `reset`.

Abhängigkeiten: Python 3.10 oder neuer mit Tkinter/ttk (Standardbibliothek; unter Linux gegebenenfalls das Systempaket `python3-tk`). Den folgenden Block unverändert als `HoldButton.py` speichern und mit `python HoldButton.py` starten. Alle Aktionen verwenden ausschließlich lokale Demo-Daten. Die Implementierung ist eigenständig und übernimmt keinen React-Bits-Quellcode.

```python
import time
import tkinter as tk
from tkinter import ttk, messagebox

class HoldButton(ttk.Frame):
    def __init__(self, master, label, action, duration=1.2):
        super().__init__(master, padding=16)
        if duration <= 0:
            raise ValueError("Haltedauer muss positiv sein")
        self.action, self.duration = action, duration
        self.started, self.job = None, None
        self.busy = self.done = False
        self.reduced = tk.BooleanVar(self, False)
        self.button = ttk.Button(self, text=label)
        self.button.pack(fill="x")
        for sequence in ("<ButtonPress-1>", "<KeyPress-space>"):
            self.button.bind(sequence, self.start)
        for sequence in ("<ButtonRelease-1>", "<KeyRelease-space>", "<Leave>", "<FocusOut>", "<Escape>"):
            self.button.bind(sequence, self.cancel)
        self.progress = ttk.Progressbar(self, maximum=100)
        self.progress.pack(fill="x", pady=8)
        self.status = ttk.Label(self, wraplength=280)
        self.status.pack(fill="x")
        ttk.Checkbutton(self, text="Statischer Fortschritt", variable=self.reduced).pack(anchor="w")
        self.dialog = ttk.Button(self, text="Archivierung bestätigen …", command=self.confirm)
        self.dialog.pack(fill="x", pady=8)
        self.bind("<Destroy>", self._destroyed, add="+")

    def start(self, event=None):
        if not self.done and not self.busy and self.started is None:
            self.button.focus_set()
            self.started = time.monotonic()
            self.status.config(text="Gedrückt halten …")
            self.tick()
        return "break"

    def tick(self):
        self.job = None
        if self.started is None:
            return
        fraction = min(1, (time.monotonic() - self.started) / self.duration)
        self.progress["value"] = (100 if fraction == 1 else 0) if self.reduced.get() else fraction * 100
        if fraction >= 1:
            self.started = None
            self.execute()
        else:
            self.job = self.after(25, self.tick)

    def cancel(self, event=None):
        was_holding = self.started is not None
        if self.job:
            self.after_cancel(self.job)
            self.job = None
        self.started = None
        if not self.done:
            self.progress["value"] = 0
        if was_holding:
            self.status.config(text="Halten abgebrochen.")
        return "break"

    def confirm(self):
        self.cancel()
        if not self.done and not self.busy and messagebox.askokcancel(
                "Archivierung", "Demo-Eintrag archivieren?", parent=self.winfo_toplevel()):
            self.execute()

    def execute(self):
        if self.done or self.busy:
            return
        self.busy = True
        try:
            self.action()
        except Exception:
            self.status.config(text="Archivierung fehlgeschlagen. Erneut halten oder bestätigen.")
            self.progress["value"] = 0
        else:
            self.done = True
            self.progress["value"] = 100
            self.status.config(text="Archiviert.")
            self.button.config(state="disabled")
            self.dialog.config(state="disabled")
        finally:
            self.busy = False

    def reset(self):
        if self.busy:
            return
        self.cancel()
        self.done = False
        self.progress["value"] = 0
        self.status.config(text="")
        self.button.config(state="normal")
        self.dialog.config(state="normal")

    def _destroyed(self, event):
        if event.widget is self:
            if self.job:
                self.after_cancel(self.job)
                self.job = None
            self.started = None

def demo(root):
    archive = []
    widget = HoldButton(root, "Zum Archivieren halten", lambda: archive.append("Demo-Eintrag"))
    widget.pack(fill="both", expand=True)
    return widget

if __name__ == "__main__":
    root = tk.Tk()
    root.title("HoldButton")
    demo(root)
    root.mainloop()
```
