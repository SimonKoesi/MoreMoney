"use client";

import { useRef, useState } from "react";
import { BriefcaseBusiness } from "lucide-react";
import {
  parsePortfolio,
  portfolioSchema,
  portfolioSource,
  portfolioTemplate,
} from "@/lib/investment-import";
import {
  currencyMoney as money,
  dateLabel,
  download,
  uiDay,
  type ModuleProps,
} from "./finance-module-types";
import { Dialog } from "./ui/dialog";

export function Investments({
  data,
  refresh,
}: Pick<ModuleProps, "data" | "refresh">) {
  const [open, setOpen] = useState(false);
  const [portfolio, setPortfolio] = useState("");
  const [day, setDay] = useState(uiDay);
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState<ReturnType<
    typeof parsePortfolio
  > | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const portfolios = new Map<string, typeof data.assets>();
  for (const asset of data.assets) {
    if (
      asset.archived ||
      asset.accountId ||
      !asset.source.startsWith(portfolioSource)
    )
      continue;
    const name = asset.source.slice(portfolioSource.length);
    const key = name.normalize("NFC").toLocaleLowerCase("de");
    const positions = portfolios.get(key) ?? [];
    positions.push(asset);
    portfolios.set(key, positions);
  }

  function review() {
    try {
      const result = parsePortfolio(content);
      setPreview(result);
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "CSV-Datei prüfen.");
    }
  }

  async function save() {
    if (lock.current || !preview || preview.errors.length) return;
    const checked = portfolioSchema.safeParse({
      portfolio,
      day,
      positions: preview.positions,
    });
    if (!checked.success || day > uiDay()) {
      setError("Depotname und Bewertungsdatum prüfen.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/investments/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checked.data),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Depotimport fehlgeschlagen.");
      setMessage(
        `${result.saved} Positionen übernommen · ${result.skipped} übersprungen`,
      );
      setPreview(null);
      setContent("");
      setOpen(false);
      await refresh().catch(() =>
        setMessage("Import gespeichert. Ansicht bitte neu laden."),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Depotimport fehlgeschlagen.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="finance-card">
      <div className="section-bar">
        <h2>Depots</h2>
        <button
          className="primary"
          onClick={() => {
            setOpen(true);
            setError("");
          }}
        >
          Depot-CSV importieren
        </button>
      </div>
      {message && <p role="status">{message}</p>}
      {!portfolios.size && (
        <p className="empty">Noch keine Depotbestände importiert.</p>
      )}
      <div className="budget-grid">
        {[...portfolios.values()].map((positions) => {
          const name = positions[0].source.slice(portfolioSource.length);
          const byCurrency = new Map<string, { cost: number; value: number }>();
          for (const asset of positions) {
            const total = byCurrency.get(asset.currency) ?? {
              cost: 0,
              value: 0,
            };
            total.cost += asset.purchaseCents;
            total.value += asset.currentValueCents;
            byCurrency.set(asset.currency, total);
          }
          return (
            <details key={name} className="panel finance-card">
              <summary>
                <BriefcaseBusiness size={17} aria-hidden="true" /> {name} ·{" "}
                {positions.length} Positionen
              </summary>
              <div className="finance-card">
                {[...byCurrency].map(([currency, total]) => (
                  <dl key={currency} className="finance-dl">
                    <div>
                      <dt>Importierter Depotwert</dt>
                      <dd>{money(total.value, currency)}</dd>
                    </div>
                    <div>
                      <dt>Einstandswert</dt>
                      <dd>{money(total.cost, currency)}</dd>
                    </div>
                    <div>
                      <dt>Unrealisierter Gewinn / Verlust</dt>
                      <dd>{money(total.value - total.cost, currency)}</dd>
                    </div>
                  </dl>
                ))}
                <ul className="bank-directory-results">
                  {positions.map((asset) => (
                    <li key={asset.id} className="finance-event">
                      <div>
                        <strong>{asset.name}</strong>
                        <small>
                          Bestandsstand {dateLabel(asset.valueDate)}
                        </small>
                      </div>
                      <span>
                        {money(asset.currentValueCents, asset.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          );
        })}
      </div>
      {open && (
        <Dialog
          title="Depotbestand importieren"
          onClose={() => {
            if (!lock.current) setOpen(false);
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (preview && !preview.errors.length) void save();
              else review();
            }}
          >
            <div className="form-fields">
              <label>
                Depotname
                <input
                  required
                  value={portfolio}
                  maxLength={60}
                  onChange={(event) => setPortfolio(event.target.value)}
                />
              </label>
              <label>
                Bewertungsdatum
                <input
                  required
                  type="date"
                  value={day}
                  max={uiDay()}
                  onChange={(event) => setDay(event.target.value)}
                />
              </label>
              <label>
                CSV-Datei
                <input
                  type="file"
                  accept=".csv,text/csv"
                  disabled={busy}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      if (file.size > 250_000)
                        throw new Error("CSV-Datei ist zu groß.");
                      setContent(await file.text());
                      setPreview(null);
                      setError("");
                    } catch (error) {
                      setError(
                        error instanceof Error
                          ? error.message
                          : "Datei konnte nicht gelesen werden.",
                      );
                    }
                  }}
                />
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  download(
                    "MoreMoney-Depot-Vorlage.csv",
                    "\uFEFF" + portfolioTemplate + "\n",
                    "text/csv;charset=utf-8",
                  )
                }
              >
                CSV-Vorlage laden
              </button>
              <details>
                <summary>CSV bearbeiten</summary>
                <label>
                  CSV-Inhalt
                  <textarea
                    rows={4}
                    maxLength={250_000}
                    value={content}
                    onChange={(event) => {
                      setContent(event.target.value);
                      setPreview(null);
                    }}
                  />
                </label>
              </details>
            </div>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            {!!preview?.errors.length && (
              <ul aria-label="Importfehler">
                {preview.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
            {!!preview?.positions.length && (
              <ul
                className="bank-directory-results"
                aria-label="Importvorschau"
              >
                {preview.positions.map((position) => (
                  <li key={position.isin} className="finance-event">
                    <div>
                      <strong>{position.name}</strong>
                      <small>
                        {position.isin} · {position.category}
                      </small>
                    </div>
                    <span>
                      {money(position.currentValueCents, position.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {preview && !preview.errors.length && (
              <p className="muted">
                Wiederholte Positionen werden aktualisiert. Fehlende Positionen
                bleiben im Bestand.
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Schließen
              </button>
              <button
                className="primary"
                disabled={busy || !content || !!preview?.errors.length}
              >
                {busy
                  ? "Wird importiert …"
                  : preview
                    ? "Bestand übernehmen"
                    : "Vorschau"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
