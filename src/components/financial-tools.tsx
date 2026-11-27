"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Send, Trash2 } from "lucide-react";
import {
  reportLabels,
  reportText,
  type Report,
  type ReportKind,
  type Topic,
} from "@/lib/financial-tools";
import { download } from "./finance-module-types";
import { Dialog } from "./ui/dialog";

type Answer = {
  title: string;
  lines: string[];
  route?: string;
  origin: string;
  notice: string;
};
type Message = {
  id: string;
  threadId: string;
  role: string;
  content: string;
  components: string;
};
type SavedReport = { id: string; kind: ReportKind; content: string };
type ToolState = {
  configured: boolean;
  messages: Message[];
  reports: SavedReport[];
};
type ResponseData = { error?: string; answer?: Answer; report?: SavedReport };
const topics: { id: Topic; name: string }[] = [
  { id: "overview", name: "Überblick" },
  { id: "spending", name: "Ausgaben" },
  { id: "health", name: "Financial Health" },
  { id: "subscriptions", name: "Abos" },
  { id: "savings", name: "Sparziele" },
  { id: "wealth", name: "Vermögen" },
  { id: "payments", name: "Fälligkeiten" },
  { id: "budget", name: "Budgets" },
];

function decode<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function safeModule(route?: string) {
  return route &&
    /^#\/(analysis|subscriptions|goals|health|worth|installments|bank)$/.test(
      route,
    )
    ? route
    : undefined;
}

export function FinancialTools({ page }: { page: "assistant" | "reports" }) {
  const [data, setData] = useState<ToolState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState("");
  const [saveHistory, setSaveHistory] = useState(false);
  const [external, setExternal] = useState(false);
  const [turns, setTurns] = useState<
    { id: string; question: string; answer: Answer }[]
  >([]);
  const [kind, setKind] = useState<ReportKind>("month");
  const [selected, setSelected] = useState<string | null>(null);
  const [remove, setRemove] = useState<"chat" | string | null>(null);
  const lock = useRef(false);
  const retry = useRef<{ key: string; id: string } | null>(null);

  async function refresh(signal?: AbortSignal) {
    try {
      const result = await fetch("/api/tools", { cache: "no-store", signal });
      if (!result.ok) throw new Error("Ansicht konnte nicht geladen werden.");
      setData(await result.json());
    } catch (e) {
      if (!signal?.aborted)
        setError(e instanceof Error ? e.message : "Laden fehlgeschlagen.");
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    const start = setTimeout(() => void refresh(controller.signal), 0);
    return () => {
      clearTimeout(start);
      controller.abort();
    };
  }, []);

  async function run(
    command: Record<string, unknown>,
    apply: (result: ResponseData) => void,
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });
      const result: ResponseData = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Vorgang fehlgeschlagen.");
      apply(result);
      retry.current = null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vorgang fehlgeschlagen.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function requestId(key: string) {
    if (retry.current?.key !== key)
      retry.current = { key, id: crypto.randomUUID() };
    return retry.current.id;
  }
  function ask(text: string, topic?: Topic) {
    if (lock.current || !text.trim()) return;
    const id = requestId(JSON.stringify([text, topic, external, saveHistory]));
    void run(
      {
        op: "ask",
        id,
        question: text,
        topic,
        external: external && !topic,
        save: saveHistory,
      },
      (result) => {
        if (!result.answer) return;
        const answer = result.answer;
        setTurns((before) => [...before, { id, question: text, answer }]);
        if (!topic) setQuestion("");
        setExternal(false);
      },
    );
  }
  if (!data)
    return (
      <section className="panel finance-card" aria-busy={!error}>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button
              className="secondary"
              onClick={() => {
                setError("");
                void refresh();
              }}
            >
              Erneut versuchen
            </button>
          </>
        ) : (
          <p role="status">Wird geladen …</p>
        )}
      </section>
    );
  const history = data.messages
    .filter((row) => row.role === "assistant")
    .reverse()
    .flatMap((row) => {
      const answer = decode<Answer>(row.components);
      const user = data.messages.find(
        (message) =>
          message.threadId === row.threadId && message.role === "user",
      );
      return answer && Array.isArray(answer.lines) && user
        ? [{ id: row.threadId, question: user.content, answer }]
        : [];
    });
  const reportRow = data.reports.find((row) => row.id === selected);
  const report = reportRow && decode<Report>(reportRow.content);
  return (
    <section className="finance-module financial-tools" aria-busy={busy}>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {page === "assistant" ? (
        <>
          <div className="button-row">
            {topics.map((topic) => (
              <button
                key={topic.id}
                className="secondary"
                disabled={busy}
                onClick={() => ask(topic.name, topic.id)}
              >
                {topic.name}
              </button>
            ))}
          </div>
          <div className="assistant-turns" aria-live="polite">
            {[...history, ...turns].map((turn) => (
              <article className="panel finance-card" key={turn.id}>
                <span className="muted">{turn.question}</span>
                <h2>{turn.answer.title}</h2>
                <ul>
                  {turn.answer.lines.map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ul>
                <div className="button-row">
                  <span className="badge">{turn.answer.origin}</span>
                  {safeModule(turn.answer.route) && (
                    <a
                      className="text-button"
                      href={safeModule(turn.answer.route)}
                    >
                      Zur Auswertung
                    </a>
                  )}
                </div>
                {turn.answer.notice && (
                  <small role="status">{turn.answer.notice}</small>
                )}
              </article>
            ))}
          </div>
          <form
            className="panel finance-card"
            onSubmit={(event) => {
              event.preventDefault();
              ask(question);
            }}
          >
            <label>
              Frage
              <textarea
                rows={2}
                maxLength={500}
                required
                value={question}
                disabled={busy}
                onChange={(event) => setQuestion(event.target.value)}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={saveHistory}
                disabled={busy}
                onChange={(event) => setSaveHistory(event.target.checked)}
              />
              Frage und Antwort lokal speichern
            </label>
            {data.configured ? (
              <label>
                <input
                  type="checkbox"
                  checked={external}
                  disabled={busy}
                  onChange={(event) => setExternal(event.target.checked)}
                />
                Fragetext für diese Anfrage an OpenAI senden
              </label>
            ) : (
              <span className="muted">
                Lokal · Sprachmodell nicht konfiguriert
              </span>
            )}
            <div className="button-row">
              <button className="primary" disabled={busy || !question.trim()}>
                <Send size={16} /> {busy ? "Wird ausgewertet …" : "Senden"}
              </button>
              {(history.length > 0 || turns.length > 0) && (
                <button
                  className="secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => setRemove("chat")}
                >
                  Verlauf löschen
                </button>
              )}
            </div>
          </form>
        </>
      ) : (
        <>
          <form
            className="section-bar"
            onSubmit={(event) => {
              event.preventDefault();
              if (lock.current) return;
              void run(
                { op: "report", id: requestId(kind), kind },
                (result) => {
                  if (!result.report) return;
                  const row = result.report;
                  setData((previous) =>
                    previous
                      ? {
                          ...previous,
                          reports: [
                            row,
                            ...previous.reports.filter(
                              (item) => item.id !== row.id,
                            ),
                          ],
                        }
                      : previous,
                  );
                  setSelected(row.id);
                },
              );
            }}
          >
            <label>
              Zeitraum
              <select
                aria-label="Berichtszeitraum"
                disabled={busy}
                value={kind}
                onChange={(event) => setKind(event.target.value as ReportKind)}
              >
                {Object.entries(reportLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary" disabled={busy}>
              <FileText size={16} />{" "}
              {busy ? "Wird erstellt …" : "Bericht erstellen"}
            </button>
          </form>
          {data.reports.length > 0 && (
            <label>
              Gespeicherte Berichte
              <select
                aria-label="Gespeicherte Berichte"
                value={selected || ""}
                onChange={(event) => setSelected(event.target.value || null)}
              >
                <option value="">Auswählen</option>
                {data.reports.map((row) => (
                  <option key={row.id} value={row.id}>
                    {reportLabels[row.kind]} ·{" "}
                    {decode<Report>(row.content)?.period}
                  </option>
                ))}
              </select>
            </label>
          )}
          {report && Array.isArray(report.sections) ? (
            <article className="panel finance-card">
              <div className="section-bar">
                <div>
                  <h2>{report.title}</h2>
                  <p>{report.period}</p>
                </div>
                <div className="button-row">
                  <button
                    className="secondary"
                    onClick={() =>
                      download(
                        "MoreMoney-Finanzbericht.txt",
                        reportText(report),
                      )
                    }
                  >
                    <Download size={16} /> Exportieren
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Bericht löschen"
                    onClick={() => setRemove(reportRow.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              <div className="finance-two">
                {report.sections.map((section) => (
                  <section key={section.title}>
                    <h3>{section.title}</h3>
                    <ul>
                      {section.lines.map((line, index) => (
                        <li key={index}>{line}</li>
                      ))}
                    </ul>
                    {safeModule(section.route) && (
                      <a href={safeModule(section.route)}>Öffnen</a>
                    )}
                  </section>
                ))}
              </div>
            </article>
          ) : (
            <div className="panel empty">
              {data.reports.length
                ? "Bericht auswählen"
                : "Noch keine Berichte"}
            </div>
          )}
        </>
      )}
      {remove && (
        <Dialog
          title={remove === "chat" ? "Verlauf löschen" : "Bericht löschen"}
          onClose={() => {
            if (!lock.current) setRemove(null);
          }}
        >
          <p>
            {remove === "chat"
              ? "Gespeicherte Fragen und Antworten werden aus der App entfernt."
              : "Der gespeicherte Bericht wird aus der App entfernt."}
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setRemove(null)}
            >
              Abbrechen
            </button>
            <button
              className="primary"
              disabled={busy}
              onClick={() =>
                void run(
                  remove === "chat"
                    ? { op: "clearChat" }
                    : { op: "deleteReport", id: remove },
                  () => {
                    if (remove === "chat") {
                      setTurns([]);
                      setData({ ...data, messages: [] });
                    } else {
                      setData({
                        ...data,
                        reports: data.reports.filter(
                          (row) => row.id !== remove,
                        ),
                      });
                      setSelected(null);
                    }
                    setRemove(null);
                  },
                )
              }
            >
              Löschen
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
