# CodeSlots

Genau ein beschriftetes Eingabefeld für sechs ASCII-Ziffern; Slots spiegeln dessen Inhalt. Einfügen, Auswahl, Ersetzen und führende Nullen nutzen das native Feld. Der lokale Adapter prüft asynchron per `after`; nur der aktuelle Eingabestand darf ein Ergebnis anzeigen. Der Adapter muss `verify(code, callback)` mit einer Abbruchfunktion zurückgeben und den Callback im UI-Thread aufrufen. Desktop-Tkinter bietet kein SMS-Autofill. Es werden keine Codes protokolliert oder außerhalb des Widgets angezeigt. Fiktiver Demo-Erfolgscode: `001234`.

Abhängigkeiten: Python 3.10 oder neuer mit Tkinter/ttk (Standardbibliothek; unter Linux gegebenenfalls das Systempaket `python3-tk`). Den folgenden Block unverändert als `CodeSlots.py` speichern und mit `python CodeSlots.py` starten. Alle Aktionen verwenden ausschließlich lokale Demo-Daten. Die Implementierung ist eigenständig und übernimmt keinen React-Bits-Quellcode.

```python
import tkinter as tk
from tkinter import ttk

class CodeSlots(ttk.Frame):
    def __init__(self, master, verify, length=6, accepts=None):
        super().__init__(master, padding=16)
        self.verify, self.length = verify, length
        self.accepts = accepts or (lambda text: all(c in "0123456789" for c in text))
        self.version, self.pending, self.cancel_request = 0, None, None
        self.alive = True
        self.value = tk.StringVar(self)
        ttk.Label(self, text=f"Verifizierungscode ({length} Ziffern)").pack(anchor="w")
        validate = self.register(lambda text: len(text) <= length and self.accepts(text))
        self.entry = ttk.Entry(self, textvariable=self.value, validate="key",
                               validatecommand=(validate, "%P"))
        self.entry.pack(fill="x", pady=8)
        self.slots = ttk.Label(self, font="TkFixedFont", text="□ " * length)
        self.slots.pack(anchor="w")
        self.status = ttk.Label(self, wraplength=280)
        self.status.pack(fill="x", pady=8)
        self.button = ttk.Button(self, text="Prüfen", command=self.submit)
        self.button.pack(anchor="w")
        self.trace = self.value.trace_add("write", self._edited)
        self.bind("<Destroy>", self._destroyed, add="+")
        self.entry.bind("<Return>", lambda event: self.submit())

    def _edited(self, *args):
        self.version += 1
        self.pending = None
        if self.cancel_request:
            self.cancel_request()
            self.cancel_request = None
        text = self.value.get()
        self.slots.config(text=" ".join(text[i] if i < len(text) else "□" for i in range(self.length)))
        self.status.config(text="")
        self.button.config(state="normal")

    def submit(self):
        if self.pending is not None:
            return
        code = self.value.get()
        if len(code) != self.length or not self.accepts(code):
            self.status.config(text="Bitte den vollständigen Code eingeben.")
            self.entry.focus_set()
            return
        token = self.version
        self.pending = token
        self.button.config(state="disabled")
        self.status.config(text="Wird geprüft …")
        def finished(ok):
            if not self.alive or token != self.version or self.pending != token:
                return
            self.pending, self.cancel_request = None, None
            self.status.config(text="Bestätigt." if ok else "Code ungültig. Bitte korrigieren.")
            self.button.config(state="normal")
        try:
            cancel = self.verify(code, finished)
            if self.pending == token:
                self.cancel_request = cancel
        except Exception:
            if self.pending == token:
                self.pending = None
                self.button.config(state="normal")
                self.status.config(text="Prüfung fehlgeschlagen. Erneut versuchen.")

    def _destroyed(self, event):
        if event.widget is self:
            self.alive = False
            if self.cancel_request:
                self.cancel_request()
            self.value.trace_remove("write", self.trace)

def demo(root):
    def verify(code, callback):
        job = root.after(650, lambda: callback(code == "001234"))
        return lambda: root.after_cancel(job)
    widget = CodeSlots(root, verify)
    widget.pack(fill="both", expand=True)
    return widget

if __name__ == "__main__":
    root = tk.Tk()
    root.title("CodeSlots")
    demo(root)
    root.mainloop()
```
