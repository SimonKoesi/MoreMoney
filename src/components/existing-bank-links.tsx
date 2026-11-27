"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "./ui/dialog";

type Link = { id: string; name: string; bank: string };

export function ExistingBankLinks() {
  const [links, setLinks] = useState<Link[] | null>(null);
  const [link, setLink] = useState<Link | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/open-banking", { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      setLinks((await response.json()).links);
    }).catch(() => {
      if (!controller.signal.aborted) setError("Onlinefreigaben konnten nicht geladen werden.");
    });
    return () => controller.abort();
  }, []);

  async function revoke(id: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/open-banking", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "disconnect", id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setLinks(result.links);
      setLink(null);
    } catch (error) {
      setError(error instanceof Error && error.message ? error.message : "Widerruf fehlgeschlagen.");
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }

  return <details className="finance-details">
    <summary>Vorhandene Onlinefreigaben</summary>
    {links?.length === 0 && <p>Keine verbundenen Konten.</p>}
    {!link && error && <p role="alert" className="form-error">{error}</p>}
    {links?.map(item => <div className="finance-event" key={item.id}>
      <span>{item.name}<small>{item.bank}</small></span>
      <button className="secondary" onClick={() => { setError(""); setLink(item); }}>Freigabe widerrufen</button>
    </div>)}
    {link && <Dialog title="Onlinefreigabe widerrufen" onClose={() => { if (!lock.current) setLink(null); }}>
      <p>Der Onlinezugriff für {link.name} endet. Importierte Buchungen bleiben erhalten.</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="dialog-actions">
        <button className="secondary" disabled={busy} onClick={() => setLink(null)}>Abbrechen</button>
        <button className="primary" disabled={busy} onClick={() => void revoke(link.id)}>Widerrufen</button>
      </div>
    </Dialog>}
  </details>;
}
