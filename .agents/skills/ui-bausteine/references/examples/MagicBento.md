# MagicBento

Responsive Übersicht: Hauptaufgabe zuerst, danach eine Karte mit lokalem Ziel und eine reine Informationskarte. Nur Karten mit Aktion erhalten einen Button. Spaltenzahl und Textumbruch reagieren auf Fensterbreite und tatsächliche Schriftgröße. Eine vertikale Scrollfläche hält Inhalte bei kleinen Fenstern erreichbar. Die Erstellungsreihenfolge bleibt zugleich Lese- und Tab-Reihenfolge. Statische Darstellung ohne Effekte.

Abhängigkeiten: Python 3.10 oder neuer mit Tkinter/ttk (Standardbibliothek; unter Linux gegebenenfalls das Systempaket `python3-tk`). Den folgenden Block unverändert als `MagicBento.py` speichern und mit `python MagicBento.py` starten. Alle Aktionen verwenden ausschließlich lokale Demo-Daten. Die Implementierung ist eigenständig und übernimmt keinen React-Bits-Quellcode.

```python
import tkinter as tk
from tkinter import ttk, font

class MagicBento(ttk.Frame):
    def __init__(self, master, cards, gap=12):
        super().__init__(master)
        self.gap, self.cards = gap, []
        self.canvas = tk.Canvas(self, highlightthickness=0, takefocus=False)
        scroll = ttk.Scrollbar(self, command=self.canvas.yview)
        self.canvas.config(yscrollcommand=scroll.set)
        scroll.pack(side="right", fill="y")
        self.canvas.pack(fill="both", expand=True)
        self.body = ttk.Frame(self.canvas)
        self.window = self.canvas.create_window(0, 0, window=self.body, anchor="nw")
        ordered = sorted(cards, key=lambda item: item.get("priority", 0), reverse=True)
        for card in ordered:
            frame = ttk.Frame(self.body, padding=16, relief="solid", borderwidth=1)
            title = ttk.Label(frame, text=card["label"], font="TkHeadingFont")
            title.pack(anchor="w", fill="x")
            text = ttk.Label(frame, text=card["text"], justify="left")
            text.pack(fill="x", pady=8)
            button = None
            if card.get("action"):
                button = ttk.Button(frame, text=card.get("button", "Öffnen"), command=card["action"])
                button.pack(anchor="w")
                button.bind("<FocusIn>", lambda event, f=frame: self.reveal(f))
            self.cards.append((frame, title, text, button))
        self.canvas.bind("<Configure>", self.layout)
        self.body.bind("<Configure>", self._region)

    def _region(self, event=None):
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def layout(self, event=None):
        width = max(1, self.canvas.winfo_width())
        unit = font.nametofont("TkDefaultFont").measure("M")
        columns = max(1, min(3, width // max(260, unit * 28)))
        self.columns = columns
        self.canvas.itemconfigure(self.window, width=width)
        for column in range(3):
            self.body.columnconfigure(column, weight=1 if column < columns else 0,
                                      uniform="cards" if column < columns else "", minsize=0)
        for index, (frame, title, text, _) in enumerate(self.cards):
            frame.grid(row=index // columns, column=index % columns, sticky="nsew",
                       padx=self.gap // 2, pady=self.gap // 2)
            wrap = max(40, width // columns - self.gap - 34)
            title.config(wraplength=wrap)
            text.config(wraplength=wrap)
        self._region()

    def reveal(self, frame):
        self.update_idletasks()
        height = max(1, self.body.winfo_height())
        top = self.canvas.canvasy(0)
        bottom = top + self.canvas.winfo_height()
        y = frame.winfo_y()
        if y < top or y + frame.winfo_height() > bottom:
            self.canvas.yview_moveto(max(0, y / height))

def demo(root):
    status = ttk.Label(root, text="Noch kein Entwurf", padding=12, wraplength=260)
    def details():
        window = tk.Toplevel(root)
        window.title("Aufgaben")
        ttk.Label(window, text="2 offene Aufgaben", padding=20).pack()
        ttk.Button(window, text="Schließen", command=window.destroy).pack(pady=12)
    widget = MagicBento(root, [
        dict(label="Entwurf", text="Die häufigste Aufgabe: einen lokalen Entwurf speichern.",
             priority=10, button="Entwurf speichern", action=lambda: status.config(text="Entwurf lokal gespeichert.")),
        dict(label="Aufgaben", text="2 Aufgaben warten auf Bearbeitung.", action=details),
        dict(label="Auslastung", text="Lokale Beispieldaten: 68 Prozent. Diese Karte enthält keine Aktion.")])
    widget.pack(fill="both", expand=True)
    status.pack(fill="x")
    return widget

if __name__ == "__main__":
    root = tk.Tk()
    root.title("MagicBento")
    root.geometry("850x440")
    demo(root)
    root.mainloop()
```
