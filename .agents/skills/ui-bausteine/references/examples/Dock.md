# Dock

Native Navigation mit Symbol, Beschriftung und Aktivmarkierung. Die Seiten bleiben aufgebaut und behalten Eingabe und Scrollposition. „Direkt: Aufgaben“ und „Zurück“ simulieren externe Routenänderungen. `navigate` fordert Navigation an, `set_route` spiegelt den tatsächlichen Zustand. Die Ziele stehen vertikal und passen auch in schmale Fenster; es gibt keine Animation.

Abhängigkeiten: Python 3.10 oder neuer mit Tkinter/ttk (Standardbibliothek; unter Linux gegebenenfalls das Systempaket `python3-tk`). Den folgenden Block unverändert als `Dock.py` speichern und mit `python Dock.py` starten. Alle Aktionen verwenden ausschließlich lokale Demo-Daten. Die Implementierung ist eigenständig und übernimmt keinen React-Bits-Quellcode.

```python
import tkinter as tk
from tkinter import ttk

class Dock(ttk.LabelFrame):
    def __init__(self, master, items, route, navigate):
        super().__init__(master, text="Navigation", padding=8)
        self.route = tk.StringVar(self, route)
        self.buttons = {}
        for key, icon, label, count in items:
            text = f"{icon} {label}" + (f" ({count})" if count is not None else "")
            button = ttk.Radiobutton(self, text=text, value=key, variable=self.route,
                                     command=lambda k=key: navigate(k))
            button.pack(anchor="w", fill="x", pady=4)
            self.buttons[key] = button

    def set_route(self, route):
        if route not in self.buttons:
            raise ValueError("Unbekannte Route")
        self.route.set(route)

class Demo(ttk.Frame):
    def __init__(self, master):
        super().__init__(master, padding=12)
        self.pack(fill="both", expand=True)
        self.history, self.current = [], None
        self.pages = {}
        controls = ttk.Frame(self)
        controls.pack(fill="x")
        ttk.Button(controls, text="Zurück", command=self.go_back).pack(anchor="w")
        ttk.Button(controls, text="Direkt: Aufgaben", command=lambda: self.navigate("tasks")).pack(anchor="w")
        self.content = ttk.Frame(self)
        self.content.pack(fill="both", expand=True, pady=8)
        items = [("home", "⌂", "Start", None), ("tasks", "☑", "Aufgaben", 2),
                 ("settings", "⚙", "Einstellungen", None)]
        for key, _, label, _ in items:
            page = ttk.Frame(self.content)
            ttk.Label(page, text=f"Notiz für {label}").pack(anchor="w")
            ttk.Entry(page).pack(fill="x")
            scroll = ttk.Scrollbar(page)
            scroll.pack(side="right", fill="y")
            text = tk.Text(page, height=5, width=15, wrap="word", yscrollcommand=scroll.set)
            text.insert("1.0", "\n".join(f"{label}: Eintrag {i}" for i in range(40)))
            text.pack(fill="both", expand=True)
            scroll.config(command=text.yview)
            self.pages[key] = page
        self.dock = Dock(self, items, "home", self.navigate)
        self.dock.pack(fill="x")
        self.navigate("home")

    def navigate(self, route, record=True):
        if route not in self.pages:
            raise ValueError("Unbekannte Route")
        if route == self.current:
            return
        if self.current is not None:
            if record:
                self.history.append(self.current)
            self.pages[self.current].pack_forget()
        self.current = route
        self.pages[route].pack(fill="both", expand=True)
        self.dock.set_route(route)

    def go_back(self):
        if self.history:
            self.navigate(self.history.pop(), record=False)

def demo(root):
    return Demo(root)

if __name__ == "__main__":
    root = tk.Tk()
    root.title("Dock")
    root.geometry("400x550")
    demo(root)
    root.mainloop()
```
