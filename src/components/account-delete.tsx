"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Dialog } from "./ui/dialog";

export function AccountDelete({
  id,
  name,
  refresh,
}: {
  id: string;
  name: string;
  refresh: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  function close() {
    if (!lock.current) {
      setOpen(false);
      setConfirmed(false);
      setError("");
    }
  }
  async function remove() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "deleteAccount",
          id,
          deleteBookings: confirmed,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Konto konnte nicht gelöscht werden.");
      await refresh();
      setOpen(false);
      setConfirmed(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Konto konnte nicht gelöscht werden.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <button className="text-button" onClick={() => setOpen(true)}>
        <Trash2 size={16} /> Konto löschen
      </button>
      {open && (
        <Dialog title="Konto löschen" onClose={close}>
          <p>„{name}“ dauerhaft aus MoreMoney löschen?</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void remove();
            }}
          >
            <div className="form-fields">
              <label>
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={busy}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />{" "}
                Vorhandene Buchungen und ihren Importverlauf ebenfalls löschen
              </label>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={close}
              >
                Abbrechen
              </button>
              <button className="primary" disabled={busy}>
                {busy ? "Wird gelöscht …" : "Endgültig löschen"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
