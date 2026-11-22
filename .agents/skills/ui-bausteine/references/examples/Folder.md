# Folder

Zugängliche Beispielsammlung und gesperrte Sammlung. Vorschau, Suche, Öffnen und Direkteinstieg prüfen dieselbe Zugriffsfunktion, bevor Inhalte geladen werden. Umfangreiche Inhalte erscheinen in einer scrollbareren Detailansicht. Ein optionaler Verschiebeadapter aktiviert die Menüaktion, erreichbar per Rechtsklick, Menütaste und Umschalt+F10. Kein Drag-and-drop ohne Adapter; keine Animation. Die Zugriffsfunktion muss bei echten Daten auch serverseitig durchgesetzt werden.

Abhängigkeiten: Python 3.10 oder neuer mit Tkinter/ttk (Standardbibliothek; unter Linux gegebenenfalls das Systempaket `python3-tk`). Den folgenden Block unverändert als `Folder.py` speichern und mit `python Folder.py` starten. Alle Aktionen verwenden ausschließlich lokale Demo-Daten. Die Implementierung ist eigenständig und übernimmt keinen React-Bits-Quellcode.

```python
from dataclasses import dataclass
import tkinter as tk
from tkinter import ttk

@dataclass
class Collection:
    id: str
    label: str
    icon: str = "▣"

class Folder(ttk.Frame):
    def __init__(self, master, collection, can_access, preview, open_items, move=None):
        super().__init__(master, padding=12)
        self.collection, self.can_access = collection, can_access
        self.preview, self.open_items, self.move = preview, open_items, move
        self.opened = False
        self.button = ttk.Button(self, text=f"{collection.icon} {collection.label}", command=self.open)
        self.button.pack(fill="x")
        self.query = tk.StringVar(self)
        ttk.Label(self, text="In Sammlung suchen").pack(anchor="w", pady=(8, 0))
        ttk.Entry(self, textvariable=self.query).pack(fill="x")
        ttk.Button(self, text="Suchen", command=self.search).pack(anchor="w", pady=4)
        ttk.Button(self, text="Vorschau", command=self.show_preview).pack(anchor="w")
        self.status = ttk.Label(self, wraplength=240)
        self.status.pack(fill="x", pady=8)
        detail = ttk.Frame(self)
        detail.pack(fill="both", expand=True)
        self.items = tk.Listbox(detail, height=5, width=18)
        scroll = ttk.Scrollbar(detail, command=self.items.yview)
        self.items.config(yscrollcommand=scroll.set)
        self.items.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")
        self.menu = tk.Menu(self, tearoff=False)
        self.menu.add_command(label="Öffnen", command=self.open)
        if move:
            self.menu.add_command(label="Verschieben …", command=self.request_move)
        for target in (self.button, self.items):
            for sequence in ("<Button-3>", "<Shift-F10>", "<Key-Menu>"):
                target.bind(sequence, self.popup)
        self.show_preview()

    def allowed(self):
        if self.can_access(self.collection.id):
            return True
        self.items.delete(0, "end")
        self.status.config(text="Gesperrte Sammlung")
        self.opened = False
        return False

    def display(self, rows):
        self.items.delete(0, "end")
        for item in rows:
            self.items.insert("end", item)

    def show_preview(self):
        if self.allowed():
            self.display(self.preview(self.collection.id))
            self.status.config(text="Vorschau")

    def open(self):
        if self.allowed():
            self.display(self.open_items(self.collection.id))
            self.opened = True
            self.status.config(text="Sammlung geöffnet")

    def search(self):
        if self.allowed():
            query = self.query.get().casefold()
            rows = [item for item in self.open_items(self.collection.id) if query in item.casefold()]
            self.display(rows)
            self.status.config(text=f"{len(rows)} Treffer")

    def request_move(self):
        if self.move and self.allowed():
            self.move(self.collection.id)

    def popup(self, event):
        try:
            x = event.x_root if event.num == 3 else event.widget.winfo_rootx()
            y = event.y_root if event.num == 3 else event.widget.winfo_rooty() + event.widget.winfo_height()
            self.menu.tk_popup(x, y)
        finally:
            self.menu.grab_release()
        return "break"

def demo(root):
    data = {"public": [f"Dokument {i}" for i in range(30)], "locked": ["Vertraulicher Inhalt"]}
    widgets = []
    for key, label in [("public", "Beispiele"), ("locked", "Geschützte Sammlung")]:
        widget = Folder(root, Collection(key, label), lambda ident: ident == "public",
                        lambda ident: data[ident][:3], lambda ident: data[ident])
        widget.pack(fill="both", expand=True)
        widgets.append(widget)
    ttk.Button(root, text="Direkteinstieg: Geschützte Sammlung", command=widgets[1].open).pack(pady=8)
    return widgets

if __name__ == "__main__":
    root = tk.Tk()
    root.title("Folder")
    demo(root)
    root.mainloop()
```
