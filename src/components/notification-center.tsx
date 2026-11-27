"use client";

import { useState } from "react";
import { Archive, ArrowUpRight, Bell, Check, RotateCcw } from "lucide-react";
import { optionalNotificationCategories } from "@/lib/notification-preferences";
import { useIntelligence } from "./use-intelligence";

const query = {};
const labels: Record<string, string> = {
  liquidity: "Liquidität",
  budget: "Budgets",
  subscriptions: "Abonnements",
  savings: "Sparziele",
};
const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
});

export function NotificationCenter({
  reload,
  navigate,
}: {
  reload: () => Promise<void>;
  navigate: (page: string, detail: string | null) => void;
}) {
  const { data, error, busy, loading, refresh, act } = useIntelligence(
    query,
    reload,
  );
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [pendingMuted, setPendingMuted] = useState<string[] | null>(null);

  if (!data)
    return (
      <section
        className="finance-module panel finance-card"
        aria-busy={loading}
      >
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button className="secondary" onClick={() => void refresh()}>
              Erneut versuchen
            </button>
          </>
        ) : (
          <p role="status">Benachrichtigungen werden geladen …</p>
        )}
      </section>
    );

  const muted = new Set<string>(data.mutedNotifications);
  const active = data.insights.filter(
    (message) => !muted.has(message.category),
  );
  const unread = active.filter((message) => !message.read).length;
  const rows = (status === "archive" ? data.archivedInsights : active).filter(
    (message) =>
      (status !== "unread" || !message.read) &&
      (category === "all" || category === message.category),
  );
  async function open(id: string, route: string, read: boolean) {
    try {
      if (!read) await act({ op: "insight", id, read: true });
      const destination =
        /^#\/(bank|subscriptions|analysis|health|goals)(?:\/([a-f0-9-]{36}))?$/.exec(
          route,
        );
      if (destination) navigate(destination[1], destination[2] || null);
    } catch {
      /* The action reports errors in the center. */
    }
  }

  return (
    <section
      className="finance-module notification-center"
      aria-busy={loading || busy}
    >
      <div className="section-bar">
        <div className="finance-filters">
          <label>
            Ansicht
            <select
              aria-label="Ansicht"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">Alle</option>
              <option value="unread">Ungelesen</option>
              <option value="archive">Archiv</option>
            </select>
          </label>
          <label>
            Kategorie
            <select
              aria-label="Kategorie"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">Alle Kategorien</option>
              {Object.entries(labels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <span className="badge">{unread} ungelesen</span>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <article className="panel finance-card">
        {rows.length ? (
          <ul className="notification-list">
            {rows.map((message) => (
              <li key={message.id}>
                <div className="notification-copy">
                  <div className="button-row">
                    <strong>{message.title}</strong>
                    {!message.read && <span className="badge">Ungelesen</span>}
                    {message.priority >= 90 && (
                      <span className="badge notification-priority">
                        Wichtig
                      </span>
                    )}
                  </div>
                  <p>{message.description}</p>
                  <small>
                    {labels[message.category] || message.category} ·{" "}
                    {dateFormatter.format(new Date(message.createdAt))}
                  </small>
                </div>
                <div className="button-row">
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      void open(message.id, message.route, message.read)
                    }
                  >
                    <ArrowUpRight size={16} /> Öffnen
                  </button>
                  {status !== "archive" && (
                    <button
                      className="icon-button"
                      disabled={busy}
                      aria-label={
                        message.read
                          ? "Als ungelesen markieren"
                          : "Als gelesen markieren"
                      }
                      title={
                        message.read
                          ? "Als ungelesen markieren"
                          : "Als gelesen markieren"
                      }
                      onClick={() =>
                        void act({
                          op: "insight",
                          id: message.id,
                          read: !message.read,
                        }).catch(() => undefined)
                      }
                    >
                      {message.read ? <Bell size={17} /> : <Check size={17} />}
                    </button>
                  )}
                  <button
                    className="icon-button"
                    disabled={busy}
                    aria-label={
                      message.archived ? "Wiederherstellen" : "Archivieren"
                    }
                    title={
                      message.archived ? "Wiederherstellen" : "Archivieren"
                    }
                    onClick={() =>
                      void act({
                        op: "insight",
                        id: message.id,
                        archived: !message.archived,
                      }).catch(() => undefined)
                    }
                  >
                    {message.archived ? (
                      <RotateCcw size={17} />
                    ) : (
                      <Archive size={17} />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">
            <Bell size={23} aria-hidden="true" />
            Keine Meldungen in dieser Ansicht
          </div>
        )}
      </article>
      <article className="panel finance-card">
        <details className="finance-details">
          <summary>Meldungskategorien</summary>
          <div className="form-fields">
            {optionalNotificationCategories.map((value) => (
              <label key={value}>
                <input
                  type="checkbox"
                  checked={
                    !(pendingMuted || data.mutedNotifications).includes(value)
                  }
                  disabled={busy}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? data.mutedNotifications.filter((item) => item !== value)
                      : [...data.mutedNotifications, value];
                    setPendingMuted(next);
                    void act({ op: "notificationPreferences", muted: next })
                      .catch(() => undefined)
                      .finally(() => setPendingMuted(null));
                  }}
                />
                {labels[value]}
              </label>
            ))}
          </div>
        </details>
      </article>
    </section>
  );
}
