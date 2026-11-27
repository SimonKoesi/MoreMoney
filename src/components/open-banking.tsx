"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Landmark, RefreshCw } from "lucide-react";
import { money } from "@/lib/finance";
import {
  bundesbankPage,
  bankGroup,
  institutionKey,
  providerMatch,
  type DirectoryBank,
} from "@/lib/bank-directory";
import { Dialog } from "./ui/dialog";

type Bank = { name: string; country: string; bic?: string | null };
type Account = {
  uid: string;
  name: string;
  type: string;
  currency: string;
  maskedIban: string;
};
type Link = {
  id: string;
  bank: string;
  name: string;
  maskedIban: string;
  currency: string;
  expires: string;
  lastSync: string;
  balanceCents: number;
  transactionCount: number;
  expired: boolean;
  stale?: boolean;
  history?: { at: string; success: boolean }[];
};
type State = {
  configured: boolean;
  automaticSync?: boolean;
  environment: "PRODUCTION" | "SANDBOX" | null;
  pending: { bank: string; url: string } | null;
  candidate: { bank: string; expired: boolean; accounts: Account[] } | null;
  links: Link[];
};
const date = (value: string) =>
  new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeZone: "Europe/Berlin",
  }).format(new Date(value));

export function OpenBanking({
  refresh,
  hasAccounts,
  importFile,
}: {
  refresh: () => Promise<void>;
  hasAccounts: boolean;
  importFile: () => void;
}) {
  const [data, setData] = useState<State | null>(null),
    [banks, setBanks] = useState<Bank[]>([]);
  const [dialog, setDialog] = useState<
      "setup" | "connect" | "directory" | null
    >(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [applicationId, setApplicationId] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [redirect, setRedirect] = useState("");
  const [filter, setFilter] = useState(""),
    [selected, setSelected] = useState(""),
    [callback, setCallback] = useState(""),
    [picked, setPicked] = useState(""),
    [includeInWorth, setIncludeInWorth] = useState(!hasAccounts);
  const [confirmDisconnect, setConfirmDisconnect] = useState<Link | null>(null);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [directory, setDirectory] = useState<{
    checked: string | null;
    local?: boolean;
    banks: DirectoryBank[];
  } | null>(null);
  const lock = useRef(false);

  async function load(signal?: AbortSignal) {
    try {
      const response = await fetch("/api/open-banking", {
        cache: "no-store",
        signal,
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "Bankanbindung nicht verfügbar.");
      setData(body);
      setError("");
    } catch (e) {
      if (!signal?.aborted)
        setError(
          e instanceof Error ? e.message : "Bankanbindung nicht verfügbar.",
        );
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => void load(controller.signal), 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  async function send(command: Record<string, unknown>) {
    const response = await fetch("/api/open-banking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });
    const body = await response.json();
    if (!response.ok)
      throw new Error(body.error || "Bankvorgang fehlgeschlagen.");
    return body;
  }
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bankvorgang fehlgeschlagen.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function change(command: Record<string, unknown>, reload = false) {
    const result: State = await send(command);
    setData(result);
    if (reload) await refresh();
  }
  const syncDue = useEffectEvent(async () => {
    if (document.hidden || lock.current) return;
    lock.current = true;
    try {
      const result: State & { attempted: boolean } = await send({
        op: "syncDue",
      });
      if (result.attempted) {
        setData(result);
        await refresh();
      }
    } catch {
      // Session locks and navigation may interrupt polling.
    } finally {
      lock.current = false;
    }
  });
  useEffect(() => {
    if (
      !data?.automaticSync ||
      !data.links.length ||
      dialog ||
      confirmDisconnect
    )
      return;
    const timer = setInterval(() => void syncDue(), 60_000);
    const initial = setTimeout(() => void syncDue(), 1_000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [data?.automaticSync, data?.links.length, dialog, confirmDisconnect]);
  function close() {
    if (!lock.current) {
      setDialog(null);
      setError("");
    }
  }
  function connect() {
    setDialog("connect");
    setError("");
    if (!data?.pending && !data?.candidate)
      void run(async () => {
        const result = await send({ op: "list", country: "DE" });
        setBanks(result.banks);
      });
  }
  async function loadDirectory(refreshDirectory: boolean) {
    await run(async () => {
      if (data?.configured && !banks.length) {
        try {
          const result = await send({ op: "list", country: "DE" });
          setBanks(result.banks);
        } catch {
          setMessage("Anbieter-Verzeichnis vorübergehend nicht erreichbar.");
        }
      }
      setDirectory(
        await send({
          op: "directory",
          query: directoryQuery,
          refresh: refreshDirectory,
        }),
      );
    });
  }
  const term = institutionKey(filter);
  const visible = banks.filter(
    (bank) =>
      institutionKey(
        [bank.name, bank.bic ?? "", bankGroup(bank.name)].join(" "),
      ).includes(term) ||
      (term === "vrbank" && bankGroup(bank.name) === "VR-Bank"),
  );
  const displayError = error && (
    <p className="form-error" role="alert">
      {error}
    </p>
  );
  const currentPickup = data?.candidate?.accounts[0]?.uid;
  return (
    <article className="panel finance-card">
      <div className="section-bar">
        <h2>Bankanbindung</h2>
        <span className="badge">
          {!data
            ? "Wird geladen"
            : !data.configured
              ? "Nicht eingerichtet"
              : data.environment === "SANDBOX"
                ? "Testumgebung"
                : data.links.some((link) => !link.expired)
                  ? "Verbunden"
                  : "Enable Banking eingerichtet"}
        </span>
      </div>
      {!dialog && !confirmDisconnect && displayError}
      {message && <p role="status">{message}</p>}
      {data ? (
        <div className="button-row">
          {data.configured ? (
            <button className="secondary" onClick={connect}>
              <Landmark size={18} />
              {data.pending || data.candidate
                ? "Bankfreigabe fortsetzen"
                : "Bank verbinden"}
            </button>
          ) : (
            <button
              className="secondary"
              onClick={() => {
                setError("");
                setDialog("setup");
              }}
            >
              <Landmark size={18} /> Bankanbindung einrichten
            </button>
          )}
          <button className="text-button" onClick={importFile}>
            Datei importieren
          </button>
          <button
            className="text-button"
            onClick={() => {
              setDialog("directory");
              void loadDirectory(false);
            }}
          >
            Bankenverzeichnis
          </button>
          {data.configured &&
            !data.links.length &&
            !data.candidate &&
            !data.pending && (
              <button
                className="text-button"
                disabled={busy}
                onClick={() => void run(() => change({ op: "removeConfig" }))}
              >
                Anbieter entfernen
              </button>
            )}
        </div>
      ) : (
        error && (
          <button className="secondary" onClick={() => void load()}>
            Erneut versuchen
          </button>
        )
      )}
      {!!data?.links.length && (
        <label className="bank-auto-sync">
          <input
            type="checkbox"
            checked={data.automaticSync === true}
            disabled={busy}
            onChange={(event) =>
              void run(() =>
                change({ op: "automaticSync", enabled: event.target.checked }),
              )
            }
          />
          <span>Automatischer Abruf bei geöffneten Bankkonten</span>
        </label>
      )}
      {data?.links.map((link) => (
        <div className="finance-event" key={link.id}>
          <div>
            <strong>{link.bank}</strong>
            <small>
              {link.name}
              {link.maskedIban ? " · " + link.maskedIban : ""}
            </small>
            <small>
              {link.expired
                ? "Freigabe abgelaufen"
                : `Freigabe bis ${date(link.expires)}`}{" "}
              · Stand {date(link.lastSync)}
            </small>
            {!link.expired && link.stale && (
              <small>Kontostand möglicherweise veraltet</small>
            )}
          </div>
          <div>
            <strong>{money(link.balanceCents, link.currency)}</strong>
            <small>
              {data.environment === "SANDBOX"
                ? "Testsaldo"
                : "Gebuchter Kontostand"}
            </small>
          </div>
          <div className="button-row">
            <button
              className="secondary"
              disabled={busy || link.expired}
              onClick={() =>
                void run(async () => {
                  try {
                    await change({ op: "sync", id: link.id }, true);
                  } catch (error) {
                    await load();
                    throw error;
                  }
                  setMessage("Bankkonto aktualisiert.");
                })
              }
            >
              <RefreshCw size={16} /> Synchronisieren
            </button>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => {
                setError("");
                setConfirmDisconnect(link);
              }}
            >
              Trennen
            </button>
          </div>
          {!!link.history?.length && (
            <details className="bank-sync-history">
              <summary>Abrufverlauf</summary>
              <ul>
                {link.history.map((entry, index) => (
                  <li key={entry.at + index}>
                    {date(entry.at)} ·{" "}
                    {entry.success ? "Aktualisiert" : "Abruf fehlgeschlagen"}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ))}
      {dialog === "directory" && (
        <Dialog title="Bankenverzeichnis" onClose={close}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void loadDirectory(!directory?.checked);
            }}
          >
            <div className="form-fields">
              <label>
                Bank, Ort, PLZ, BLZ oder BIC
                <input
                  value={directoryQuery}
                  maxLength={120}
                  onChange={(event) => setDirectoryQuery(event.target.value)}
                />
              </label>
            </div>
            <div className="dialog-actions">
              {directory?.checked && (
                <button
                  className="secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => void loadDirectory(true)}
                >
                  Verzeichnis aktualisieren
                </button>
              )}
              <button
                className="primary"
                disabled={busy || directoryQuery.trim().length < 2}
              >
                {busy
                  ? "Wird geladen …"
                  : directory?.checked
                    ? "Suchen"
                    : "Laden und suchen"}
              </button>
            </div>
          </form>
          {displayError}
          <details className="finance-details">
            <summary>Verzeichnis aus Datei laden</summary>
            <a className="text-button" href={bundesbankPage} target="_blank" rel="noreferrer">TXT-Datei bei der Bundesbank öffnen</a>
            <label>Bankleitzahlendatei
              <input type="file" accept=".txt,text/plain" disabled={busy} onChange={event => {
                const input = event.currentTarget;
                const file = input.files?.[0];
                if (!file) return;
                void run(async () => {
                  const response = await fetch("/api/open-banking", {method:"PUT", body:file});
                  if (!response.ok) throw new Error((await response.json()).error);
                  setDirectory(await send({op:"directory", query:directoryQuery, refresh:false}));
                  input.value = "";
                });
              }} />
            </label>
          </details>
          {directory?.checked && (
            <p className="muted">
              {directory.local ? "Lokale Bankleitzahlendatei" : "Deutsche Bundesbank"} · Stand {date(directory.checked)}
            </p>
          )}
          {!!directory?.banks.length && (
            <ul className="bank-directory-results">
              {directory.banks.map((bank) => {
                const match = data?.configured
                  ? providerMatch(bank, banks)
                  : null;
                return (
                  <li key={bank.id} className="finance-event">
                    <div>
                      <strong>
                        <Landmark size={16} aria-hidden="true" /> {bank.name}
                      </strong>
                      <small>
                        {[bank.city, bank.postCode, bank.blz, bank.bic]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                      <small>
                        {match
                          ? "Bankfreigabe erforderlich"
                          : data?.configured
                            ? "Dateiimport verfügbar · Online-Zugang unbestätigt"
                            : "Bankanbindung nicht eingerichtet"}
                      </small>
                    </div>
                    {match && !data?.pending && !data?.candidate && (
                      <button
                        className="secondary"
                        onClick={() => {
                          setFilter("");
                          setSelected(match);
                          setDialog("connect");
                        }}
                      >
                        Auswählen
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {directory?.checked && !directory.banks.length && !busy && (
            <p className="empty">Keine Treffer für die letzte Suche.</p>
          )}
        </Dialog>
      )}
      {dialog === "setup" && (
        <Dialog title="Enable Banking einrichten" onClose={close}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!file) return;
              void run(async () => {
                if (file.size > 16000)
                  throw new Error("Die private PEM-Datei ist zu groß.");
                await change({
                  op: "configure",
                  applicationId,
                  redirect,
                  privateKey: await file.text(),
                });
                setFile(null);
                setApplicationId("");
                setRedirect("");
                setDialog(null);
                setMessage("Anbieteranwendung bestätigt.");
              });
            }}
          >
            <p>
              Eigene Anwendung im Anbieterportal registrieren und dein Konto
              dort freigeben.{" "}
              <a
                href="https://enablebanking.com/docs/api/linked-accounts/"
                target="_blank"
                rel="noreferrer"
              >
                Anleitung öffnen
              </a>
            </p>
            <div className="form-fields">
              <label>
                Anwendungs-ID
                <input
                  required
                  value={applicationId}
                  maxLength={36}
                  disabled={busy}
                  onChange={(event) =>
                    setApplicationId(event.target.value.trim())
                  }
                />
              </label>
              <label>
                Registrierte HTTPS-Rücksprungadresse
                <input
                  type="url"
                  required
                  value={redirect}
                  maxLength={2000}
                  disabled={busy}
                  onChange={(event) => setRedirect(event.target.value)}
                />
              </label>
              <label>
                Private PEM-Datei
                <input
                  type="file"
                  accept=".pem,.key"
                  required
                  disabled={busy}
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </label>
            </div>
            {displayError}
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
                {busy ? "Wird geprüft …" : "Anbieter prüfen"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {dialog === "connect" && data && (
        <Dialog title="Bank verbinden" onClose={close}>
          {!data.pending && !data.candidate && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (selected)
                  void run(() =>
                    change({ op: "start", country: "DE", bank: selected }),
                  );
              }}
            >
              <div className="form-fields">
                <label>
                  Bank suchen
                  <input
                    placeholder="Sparkasse, Volksbank, Trade Republic"
                    value={filter}
                    onChange={(event) => {
                      setFilter(event.target.value);
                      setSelected("");
                    }}
                    disabled={busy}
                  />
                </label>
                <label>
                  Bank in Deutschland
                  <select
                    aria-label="Bank in Deutschland"
                    required
                    disabled={busy}
                    value={selected}
                    onChange={(event) => setSelected(event.target.value)}
                  >
                    <option value="">Bank auswählen</option>
                    {visible.map((bank) => (
                      <option key={bank.name} value={bank.name}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {!visible.length && !busy && (
                <p className="muted">Keine passenden Banken verfügbar.</p>
              )}
              <p>Lesender Zugriff auf Kontostand und gebuchte Umsätze.</p>
              {displayError}
              <div className="dialog-actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={close}
                >
                  Abbrechen
                </button>
                <button className="primary" disabled={busy || !selected}>
                  {busy ? "Wird geladen …" : "Freigabe vorbereiten"}
                </button>
              </div>
            </form>
          )}
          {data.pending && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await change({ op: "finish", callback });
                  setCallback("");
                  setPicked("");
                });
              }}
            >
              <p>{data.pending.bank} · Freigabe im Browser bestätigen.</p>
              <a
                className="secondary"
                target="_blank"
                rel="noreferrer"
                href={data.pending.url}
              >
                Bankfreigabe im Browser öffnen
              </a>
              <div className="form-fields">
                <label>
                  Vollständige Rücksprungadresse aus dem Browser
                  <input
                    type="url"
                    required
                    value={callback}
                    maxLength={8192}
                    onChange={(event) => setCallback(event.target.value)}
                    disabled={busy}
                  />
                </label>
              </div>
              {displayError}
              <div className="dialog-actions">
                <button
                  className="secondary"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await change({ op: "cancel" });
                      setCallback("");
                      setDialog(null);
                    })
                  }
                >
                  Freigabe abbrechen
                </button>
                <button className="primary" disabled={busy}>
                  {busy ? "Wird bestätigt …" : "Freigabe bestätigen"}
                </button>
              </div>
            </form>
          )}
          {data.candidate && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (picked || currentPickup)
                  void run(async () => {
                    await change(
                      {
                        op: "select",
                        uid: picked || currentPickup,
                        includeInWorth,
                      },
                      true,
                    );
                    setDialog(null);
                    setMessage("Konto verbunden und erstmals synchronisiert.");
                  });
              }}
            >
              {data.candidate.expired ? (
                <p>Die Freigabe ist abgelaufen.</p>
              ) : (
                <div className="form-fields">
                  <label>
                    Freigegebenes Konto
                    <select
                      aria-label="Freigegebenes Konto"
                      value={picked || currentPickup || ""}
                      disabled={busy}
                      onChange={(event) => setPicked(event.target.value)}
                    >
                      {data.candidate.accounts.map((item) => (
                        <option key={item.uid} value={item.uid}>
                          {[item.name, item.maskedIban, item.currency]
                            .filter(Boolean)
                            .join(" · ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!data.candidate.accounts.length && (
                    <p>
                      Der Anbieter hat kein synchronisierbares Konto geliefert.
                    </p>
                  )}
                  {data.environment === "PRODUCTION" && (
                    <label>
                      <input
                        type="checkbox"
                        checked={includeInWorth}
                        onChange={(event) =>
                          setIncludeInWorth(event.target.checked)
                        }
                        disabled={busy}
                      />{" "}
                      Im Vermögen berücksichtigen
                    </label>
                  )}
                  {hasAccounts && data.environment === "PRODUCTION" && (
                    <p className="muted">
                      Ein bereits manuell erfasstes Konto kann sonst doppelt in
                      die Summe einfließen.
                    </p>
                  )}
                </div>
              )}
              {displayError}
              <div className="dialog-actions">
                <button
                  className="secondary"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await change({ op: "cancel" });
                      setDialog(null);
                    })
                  }
                >
                  Freigabe widerrufen
                </button>
                <button
                  className="primary"
                  disabled={
                    busy || data.candidate.expired || !(picked || currentPickup)
                  }
                >
                  {busy ? "Synchronisierung läuft …" : "Konto verbinden"}
                </button>
              </div>
            </form>
          )}
        </Dialog>
      )}
      {confirmDisconnect && (
        <Dialog
          title="Bankverbindung trennen"
          onClose={() => {
            if (!lock.current) setConfirmDisconnect(null);
          }}
        >
          <p>
            Die Freigabe für {confirmDisconnect.bank} wird widerrufen. Bereits
            gespeicherte Buchungen bleiben erhalten.
          </p>
          {displayError}
          <div className="dialog-actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setConfirmDisconnect(null)}
            >
              Abbrechen
            </button>
            <button
              className="primary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await change(
                    { op: "disconnect", id: confirmDisconnect.id },
                    true,
                  );
                  setConfirmDisconnect(null);
                  setMessage("Bankverbindung getrennt.");
                })
              }
            >
              Trennen
            </button>
          </div>
        </Dialog>
      )}
    </article>
  );
}
