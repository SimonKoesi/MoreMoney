# GlassSurface

Werkzeugleiste über wechselnden Hintergründen. Reines Tkinter hat kein portables Glasmaterial: beide Stile sind deshalb bewusst deckend, mit kontrastreichem Text und Rahmen. Reduzierte Transparenz, schlechter Kontrast, geringe Leistung oder Sichtschutz wählen den expliziten Fallback. Der Sichtschutz sperrt diesen Fallback dauerhaft. Systemeinstellungen müssen bei einer Integration über den Plattformadapter an `set_environment` übergeben werden.

Abhängigkeiten: Python 3.10 oder neuer mit Tkinter/ttk (Standardbibliothek; unter Linux gegebenenfalls das Systempaket `python3-tk`). Den folgenden Block unverändert als `GlassSurface.py` speichern und mit `python GlassSurface.py` starten. Alle Aktionen verwenden ausschließlich lokale Demo-Daten. Die Implementierung ist eigenständig und übernimmt keinen React-Bits-Quellcode.

```python
import tkinter as tk
from tkinter import ttk

class GlassSurface(tk.Frame):
    def __init__(self, master, privacy=False, **style):
        super().__init__(master, bd=2, relief="solid", **style)
        self.privacy = privacy
        self.reduced, self.contrast_ok, self.performance_ok = False, True, True
        self.content = tk.Frame(self)
        self.content.pack(fill="both", expand=True, padx=12, pady=12)
        self.mode = tk.Label(self, anchor="w", wraplength=250)
        self.mode.pack(fill="x", padx=12, pady=(0, 8))
        self.set_environment()

    def set_environment(self, reduced=None, contrast_ok=None, performance_ok=None):
        if reduced is not None:
            self.reduced = reduced
        if contrast_ok is not None:
            self.contrast_ok = contrast_ok
        if performance_ok is not None:
            self.performance_ok = performance_ok
        self.fallback = self.privacy or self.reduced or not self.contrast_ok or not self.performance_ok
        background = "#ffffff" if self.fallback else "#e8eef5"
        self.configure(background=background, highlightbackground="#344054")
        self.content.configure(background=background)
        self.mode.configure(background=background, foreground="#101828",
                            text="Deckender Schutzmodus" if self.fallback else "Deckendes Tkinter-Material")

def demo(root):
    background = tk.Frame(root, background="#102030", padx=20, pady=20)
    background.pack(fill="both", expand=True)
    surface = GlassSurface(background)
    surface.pack(fill="x", pady=12)
    result = ttk.Label(surface.content, text="Entwurf unverändert", wraplength=220)
    result.pack(fill="x")
    ttk.Button(surface.content, text="Entwurf speichern", command=lambda: result.config(text="Entwurf lokal gespeichert.")).pack(pady=8)
    reduced = tk.BooleanVar(root)
    contrast = tk.BooleanVar(root, True)
    performance = tk.BooleanVar(root, True)
    for text, variable in [("Reduzierte Transparenz", reduced), ("Ausreichender Kontrast", contrast),
                           ("Ausreichende Leistung", performance)]:
        ttk.Checkbutton(root, text=text, variable=variable, command=lambda: surface.set_environment(
            reduced.get(), contrast.get(), performance.get())).pack(anchor="w", padx=12)
    def toggle():
        background.config(background="#f2e8cb" if background.cget("background") == "#102030" else "#102030")
    ttk.Button(root, text="Hintergrund wechseln", command=toggle).pack(pady=8)
    privacy = GlassSurface(root, privacy=True)
    privacy.pack(fill="x", padx=12, pady=12)
    ttk.Label(privacy.content, text="Sichtschutz immer deckend").pack()
    return surface

if __name__ == "__main__":
    root = tk.Tk()
    root.title("GlassSurface")
    demo(root)
    root.mainloop()
```
