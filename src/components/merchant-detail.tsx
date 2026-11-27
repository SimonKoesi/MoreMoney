"use client";

import { useRef, useState } from "react";
import { CircleHelp, ShoppingBag, Store } from "lucide-react";
import type { Merchant } from "@/lib/merchant";
import type { AppState } from "@/lib/db";
import { currencyMoney as money, dateLabel } from "./finance-module-types";
import { Dialog } from "./ui/dialog";

export function MerchantIcon({ merchant }: {merchant?: Merchant}) {
  const [failedLogo, setFailedLogo] = useState("");
  const logo = merchant?.logo;
  const initial = merchant?.method !== "suggestion" && merchant?.name ? [...merchant.name][0].toLocaleUpperCase("de") : "";
  return <span className="merchant-icon" aria-hidden="true">
    {logo && logo !== failedLogo && /^[A-Za-z0-9+/]+={0,2}$/.test(logo)
      // eslint-disable-next-line @next/next/no-img-element
      ? <img alt="" src={"data:image/png;base64," + logo} onError={() => setFailedLogo(logo)} />
      : initial || (merchant?.method === "suggestion" ? <CircleHelp size={18} /> : <ShoppingBag size={18} />)}
  </span>;
}

type Booking = AppState["transactions"][number];

export async function merchantRequest(payload: Record<string, unknown>) {
  const response = await fetch("/api/merchants", {
    method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Änderung fehlgeschlagen.");
  return result;
}

export function MerchantDetail({ row, merchant, account, onClose, onSaved }: {
  row: Booking; merchant?: Merchant; account: string; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(merchant?.name ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [scope, setScope] = useState<{count: number; limited: boolean} | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function act(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true); setError("");
    try { await action(); }
    catch (error) { setError(error instanceof Error ? error.message : "Änderung fehlgeschlagen."); }
    finally { lock.current = false; setBusy(false); }
  }
  async function save(rule: boolean) {
    if (file && file.size > 250_000) throw new Error("Bilddatei höchstens 250 KB.");
    const logo = file ? btoa(Array.from(new Uint8Array(await file.arrayBuffer()), byte => String.fromCharCode(byte)).join("")) : undefined;
    await merchantRequest({op:"save", id:row.id, rule, name, logo});
    onSaved();
  }
  return <Dialog title="Buchungsdetails" onClose={() => {if (!lock.current) onClose();}}>
    <div className="finance-event">
      <div className="merchant-display"><MerchantIcon merchant={merchant}/><strong>{merchant?.method !== "suggestion" && merchant?.name || row.payee || row.title}</strong></div>
      <strong>{money(row.amountCents, row.currency)}</strong>
    </div>
    <dl className="finance-dl merchant-fields">
      <div><dt>Buchung</dt><dd>{dateLabel(row.date)}</dd></div>
      <div><dt>Wertstellung</dt><dd>{dateLabel(row.valueDate)}</dd></div>
      <div><dt>Konto</dt><dd>{account}</dd></div>
      <div><dt>Kategorie</dt><dd>{row.category || "Offen"}</dd></div>
      {row.tags && <div><dt>Tags</dt><dd>{row.tags}</dd></div>}
      {row.note && row.note !== row.originalPurpose && <div><dt>Notiz</dt><dd>{row.note}</dd></div>}
      {merchant?.processor && <div><dt>Zahlungsdienstleister</dt><dd>{merchant.processor}</dd></div>}
      {merchant?.category && <div><dt>Kategorievorschlag</dt><dd>{merchant.category}</dd></div>}
      {merchant && merchant.method !== "unknown" && <div><dt>Zuordnung</dt><dd>{{
        alias:"Händlerverzeichnis", manual:"Manuell bestätigt", rule:"Eigene Regel", suggestion:"Prüfvorschlag",
      }[merchant.method]} · {merchant.score}/100</dd></div>}
    </dl>
    <details className="finance-details merchant-fields">
      <summary>Originalbuchung</summary>
      <dl className="finance-dl">
        <div><dt>Buchungstext</dt><dd>{row.title}</dd></div>
        <div><dt>Empfänger</dt><dd>{row.payee || "—"}</dd></div>
        <div><dt>Verwendungszweck</dt><dd>{row.originalPurpose || "—"}</dd></div>
      </dl>
    </details>
    <form onSubmit={event => {event.preventDefault(); void act(() => save(false));}}>
      <div className="form-fields">
        <label>Händler<input required value={name} maxLength={100} onChange={event => setName(event.target.value)} /></label>
        <label>Eigenes Logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => setFile(event.target.files?.[0] ?? null)} /></label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {scope && <p role="status">{scope.count ? `${scope.count}${scope.limited ? "+" : ""} passende Buchungen · gilt auch für neue Buchungen` : "Keine passende Buchung für eine Regel."}</p>}
      <div className="dialog-actions">
        {merchant?.method === "manual" && <button type="button" className="text-button" disabled={busy} onClick={() => void act(async () => {
          await merchantRequest({op:"remove", id:row.id, rule:false}); onSaved();
        })}>Korrektur entfernen</button>}
        <button type="button" className="secondary" disabled={busy || !name.trim() || Boolean(scope && !scope.count)} onClick={() => void act(async () => {
          if (!scope) setScope(await merchantRequest({op:"preview", id:row.id}));
          else await save(true);
        })}><Store size={16} />{scope ? "Regel speichern" : "Regel prüfen"}</button>
        <button className="primary" disabled={busy || !name.trim()}>Nur diese Buchung</button>
      </div>
    </form>
  </Dialog>;
}
