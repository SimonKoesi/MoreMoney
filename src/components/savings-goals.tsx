"use client";

import { useState } from "react";
import { ChevronLeft, Plus, Target } from "lucide-react";
import { monthlyEquivalent, money } from "@/lib/finance";
import type { IntelligenceState } from "@/lib/intelligence-state";
import {
  EntityEditor,
  type EditorField,
  type EntitySpec,
} from "./finance-editor";
import { dateLabel, uiDay } from "./finance-module-types";
import {
  SavingsDistribution,
  SavingsSimulation,
  SavingsHistoryChart,
} from "./savings-plans";
import { useIntelligence } from "./use-intelligence";

export type Goal = IntelligenceState["savingsGoals"][number];
const statuses = {
  active: "Aktiv",
  paused: "Pausiert",
  completed: "Abgeschlossen",
  archived: "Archiviert",
};
const forecasts: Record<string, string> = {
  reached: "Ziel erreicht",
  "rate-missing": "Sparrate fehlt",
  ahead: "Dem Zeitplan voraus",
  behind: "Hinter dem Zeitplan",
  "on-track": "Im Zeitplan",
  paused: "Pausiert",
  archived: "Archiviert",
  unknown: "Prognose offen",
};
const movementNames: Record<string, string> = {
  initial: "Startguthaben",
  deposit: "Einzahlung",
  withdraw: "Entnahme",
  transfer: "Umbuchung",
  correction: "Korrektur",
  "plan-change": "Planänderung",
  "plan-confirmed": "Verteilung bestätigt",
};
const options = (values: Record<string, string>) =>
  Object.entries(values).map(([value, label]) => ({ value, label }));
const intervals = {
  weekly: "Wöchentlich",
  monthly: "Monatlich",
  quarterly: "Quartalsweise",
  halfyearly: "Halbjährlich",
  yearly: "Jährlich",
};
const query = {};

function goalForm(
  accounts: IntelligenceState["accounts"],
  goal?: Goal,
): EntitySpec {
  const period = "Sparplan";
  const details = "Details";
  const fields: EditorField[] = [
    { key: "name", label: "Name" },
    { key: "targetCents", label: "Zielbetrag", kind: "money" },
    ...(!goal
      ? [{ key: "savedCents", label: "Startguthaben", kind: "money" } as const]
      : []),
    {
      key: "accountId",
      label: "Konto",
      kind: "select",
      optional: true,
      options: accounts
        .filter((a) => !a.archived || a.id === goal?.accountId)
        .map((a) => ({ value: a.id, label: `${a.name} · ${a.currency}` })),
    },
    { key: "currency", label: "Währung (ISO-Code)" },
    {
      key: "monthlyRateCents",
      label: "Rate je Intervall",
      kind: "money",
      group: period,
    },
    {
      key: "interval",
      label: "Intervall",
      kind: "select",
      options: options(intervals),
      group: period,
    },
    { key: "startDate", label: "Startdatum", kind: "date", group: period },
    {
      key: "targetDate",
      label: "Wunschdatum",
      kind: "date",
      optional: true,
      group: period,
    },
    {
      key: "annualInterest",
      label: "Modellzins pro Jahr (%)",
      kind: "money",
      group: period,
    },
    {
      key: "savingMode",
      label: "Besparung",
      kind: "select",
      options: options({ manual: "Manuell", planned: "Geplant" }),
      group: period,
    },
    { key: "priority", label: "Priorität", kind: "number", group: details },
    {
      key: "category",
      label: "Kategorie",
      kind: "select",
      options: [
        ...new Set([
          "Individuell",
          "Neues Auto",
          "Urlaub",
          "Eigenheim",
          "Notgroschen",
          "Hochzeit",
          "Altersvorsorge",
          "Elektronik",
          "Führerschein",
          "Weiterbildung",
          "Möbel",
          "Finanzielle Freiheit",
          ...(goal ? [goal.category] : []),
        ]),
      ].map((value) => ({ value, label: value })),
      group: details,
    },
    {
      key: "description",
      label: "Beschreibung",
      kind: "textarea",
      optional: true,
      group: details,
    },
    { key: "color", label: "Akzentfarbe", kind: "color", group: details },
    ...(goal
      ? [
          {
            key: "status",
            label: "Status",
            kind: "select",
            options: options(statuses),
            group: details,
          } as const,
        ]
      : []),
  ];
  const initial = goal
    ? {
        id: goal.id,
        name: goal.name,
        targetCents: goal.targetCents,
        savedCents: goal.savedCents,
        accountId: goal.accountId,
        currency: goal.currency,
        monthlyRateCents: goal.monthlyRateCents,
        interval: goal.interval,
        startDate: goal.startDate,
        targetDate: goal.targetDate,
        annualInterest: goal.interestBps,
        savingMode: goal.savingMode,
        priority: goal.priority,
        category: goal.category,
        description: goal.description,
        color: goal.color,
        icon: goal.icon,
        status: goal.status,
      }
    : {
        name: "",
        description: "",
        category: "Individuell",
        targetCents: 0,
        savedCents: 0,
        monthlyRateCents: 0,
        startDate: uiDay(),
        targetDate: "",
        priority: 3,
        accountId: null,
        currency: "EUR",
        color: "#58d6bc",
        icon: "target",
        status: "active",
        savingMode: "manual",
        annualInterest: 0,
        interval: "monthly",
      };
  return {
    title: goal ? "Sparziel bearbeiten" : "Sparziel anlegen",
    op: "goal",
    initial,
    fields,
  };
}

export function SavingsGoals({
  detail,
  navigate,
  reload,
}: {
  detail: string | null;
  navigate: (id: string | null) => void;
  reload: () => Promise<void>;
}) {
  const { data, error, busy, loading, refresh, act } = useIntelligence(
    query,
    reload,
  );
  const [editor, setEditor] = useState<EntitySpec | null>(null);
  const [filter, setFilter] = useState("open");
  const [planner, setPlanner] = useState<"simulation" | "distribution" | null>(
    null,
  );
  if (!data)
    return (
      <section className="panel finance-card" aria-busy={loading}>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button className="secondary" onClick={() => void refresh()}>
              Erneut versuchen
            </button>
          </>
        ) : (
          <p role="status">Sparziele werden geladen …</p>
        )}
      </section>
    );

  const goals = data.savingsGoals;
  const goal = goals.find((g) => g.id === detail);
  const assignedByAccount = new Map<string, number>();
  for (const entry of goals)
    if (entry.accountId)
      assignedByAccount.set(
        entry.accountId,
        (assignedByAccount.get(entry.accountId) || 0) + entry.savedCents,
      );
  const account = data.accounts.find((a) => a.id === goal?.accountId);
  const availableAccounts = data.accounts;
  const open = goals.filter(
    (g) => g.status === "active" && g.projection.remainingCents > 0,
  );
  const totals = new Map<
    string,
    { target: number; saved: number; rate: number }
  >();
  for (const entry of goals.filter((g) => g.status !== "archived")) {
    const total = totals.get(entry.currency) || {
      target: 0,
      saved: 0,
      rate: 0,
    };
    total.target += entry.targetCents;
    total.saved += entry.savedCents;
    if (entry.status === "active" && entry.projection.remainingCents)
      total.rate += monthlyEquivalent(entry.monthlyRateCents, entry.interval);
    totals.set(entry.currency, total);
  }
  const next = open
    .filter((g) => g.projection.reachedAt)
    .sort((a, b) =>
      a.projection.reachedAt!.localeCompare(b.projection.reachedAt!),
    )[0];
  const complete = (g: Goal) =>
    g.status === "completed" || g.projection.remainingCents === 0;
  const shown = goals.filter((g) =>
    filter === "archived"
      ? g.status === "archived"
      : filter === "completed"
        ? g.status !== "archived" && complete(g)
        : g.status !== "archived" && !complete(g),
  );

  function movement(g: Goal, kind: "deposit" | "withdraw" | "transfer") {
    const targets = goals.filter(
      (other) =>
        other.id !== g.id &&
        other.currency === g.currency &&
        other.status !== "archived",
    );
    const funding = data!.goalFunding.filter(
      (entry) =>
        entry.accountId === g.accountId && entry.currency === g.currency,
    );
    setEditor({
      title: {
        deposit: "Einzahlung zuordnen",
        withdraw: "Entnahme erfassen",
        transfer: "Zwischen Sparzielen umbuchen",
      }[kind],
      op: kind === "transfer" ? "goalTransfer" : "goalMovement",
      initial: {
        id: g.id,
        requestId: crypto.randomUUID(),
        kind,
        from: g.id,
        to: targets[0]?.id || "",
        day: uiDay(),
        amountCents: 0,
        note: "",
        fundingTransactionId: null,
      },
      fields: [
        ...(kind === "transfer"
          ? [
              {
                key: "to",
                label: "Ziel",
                kind: "select" as const,
                options: targets.map((t) => ({ value: t.id, label: t.name })),
              },
            ]
          : []),
        { key: "amountCents", label: `Betrag in ${g.currency}`, kind: "money" },
        { key: "day", label: "Datum", kind: "date" },
        ...(kind === "deposit" && funding.length
          ? [
              {
                key: "fundingTransactionId",
                label: "Einnahme",
                kind: "select" as const,
                optional: true,
                options: funding.map((entry) => ({
                  value: entry.id,
                  label: `${dateLabel(entry.date)} · ${entry.title} · ${money(entry.remainingCents, g.currency)} frei`,
                })),
              },
            ]
          : []),
        ...(kind !== "transfer"
          ? [
              {
                key: "note",
                label: "Notiz",
                kind: "textarea" as const,
                optional: true,
              },
            ]
          : []),
      ],
    });
  }

  function correct(id: string) {
    setEditor({
      title: "Sparbewegung korrigieren",
      op: "reverseMovement",
      initial: { id },
      fields: [
        {
          key: "confirmed",
          label: "Gegenbuchung im Sparverlauf erfassen",
          kind: "checkbox",
          mustCheck: true,
        },
      ],
    });
  }

  async function saveEditor(command: Record<string, unknown>) {
    const values = command.data as Record<string, unknown>;
    if (command.op === "goal") {
      const { annualInterest, ...goalValues } = values;
      await act({
        op: "goal",
        data: {
          ...goalValues,
          accountId: goalValues.accountId || null,
          currency: String(goalValues.currency).trim().toUpperCase(),
          interestBps: annualInterest,
        },
      });
    } else {
      await act({ ...values, op: command.op });
    }
  }

  return (
    <section
      className="finance-module savings-module"
      aria-busy={loading || busy}
    >
      {error && !editor && (
        <p role="alert" className="form-error">
          {error}{" "}
          <button className="text-button" onClick={() => void refresh()}>
            Aktualisieren
          </button>
        </p>
      )}
      {detail ? (
        <>
          <div className="section-bar">
            <button className="back-link" onClick={() => navigate(null)}>
              <ChevronLeft size={16} /> Sparziele
            </button>
          </div>
          {goal ? (
            <>
              <article className="panel finance-card goal-card">
                <div className="section-bar">
                  <h2>{goal.name}</h2>
                  <span className="badge">
                    {goal.status === "active"
                      ? forecasts[goal.projection.status]
                      : statuses[goal.status as keyof typeof statuses]}
                  </span>
                </div>
                {goal.description && (
                  <p className="muted">{goal.description}</p>
                )}
                <strong className="account-balance">
                  {money(goal.savedCents, goal.currency)}
                </strong>
                <progress
                  max={goal.targetCents}
                  value={Math.min(goal.savedCents, goal.targetCents)}
                  aria-label="Zielfortschritt"
                />
                <div className="savings-values">
                  <span>Ziel {money(goal.targetCents, goal.currency)}</span>
                  <span>
                    Offen {money(goal.projection.remainingCents, goal.currency)}
                  </span>
                  <span>{goal.projection.progressBps / 100} % erreicht</span>
                </div>
                <div className="savings-values">
                  <span>
                    Rate {money(goal.monthlyRateCents, goal.currency)} ·{" "}
                    {intervals[goal.interval as keyof typeof intervals]}
                  </span>
                  {goal.targetDate && (
                    <span>Wunschdatum {dateLabel(goal.targetDate)}</span>
                  )}
                  {goal.projection.reachedAt &&
                    goal.projection.remainingCents > 0 && (
                      <span>
                        Prognose {dateLabel(goal.projection.reachedAt)}
                      </span>
                    )}
                  {goal.targetDate &&
                    goal.projection.requiredRateCents !== null &&
                    goal.projection.remainingCents > 0 && (
                      <span>
                        Benötigte Rate{" "}
                        {money(
                          goal.projection.requiredRateCents,
                          goal.currency,
                        )}
                      </span>
                    )}
                </div>
                <div className="button-row">
                  {goal.status !== "archived" && (
                    <button
                      className="primary"
                      onClick={() => movement(goal, "deposit")}
                    >
                      Einzahlen
                    </button>
                  )}
                  <button
                    className="secondary"
                    disabled={!goal.savedCents}
                    onClick={() => movement(goal, "withdraw")}
                  >
                    Entnehmen
                  </button>
                  <button
                    className="secondary"
                    disabled={
                      !goal.savedCents ||
                      !goals.some(
                        (g) =>
                          g.id !== goal.id &&
                          g.currency === goal.currency &&
                          g.status !== "archived",
                      )
                    }
                    onClick={() => movement(goal, "transfer")}
                  >
                    Umbuchen
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setEditor(goalForm(availableAccounts, goal))}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setPlanner("simulation")}
                  >
                    Simulieren
                  </button>
                </div>
              </article>
              {account && (
                <article className="panel finance-card">
                  <h2>{account.name}</h2>
                  <div className="savings-values">
                    <span>
                      Kontostand {money(account.balanceCents, account.currency)}
                    </span>
                    <span>
                      Zugeordnet{" "}
                      {money(
                        assignedByAccount.get(account.id) || 0,
                        account.currency,
                      )}
                    </span>
                    <span>
                      Frei{" "}
                      {money(
                        Math.max(
                          0,
                          account.balanceCents -
                            (assignedByAccount.get(account.id) || 0),
                        ),
                        account.currency,
                      )}
                    </span>
                  </div>
                  {(assignedByAccount.get(account.id) || 0) >
                    Math.max(account.balanceCents, 0) && (
                    <p role="status">
                      Zuordnungen übersteigen das aktuelle Guthaben.
                    </p>
                  )}
                </article>
              )}
              <article className="panel finance-card">
                <h2>Sparverlauf</h2>
                <SavingsHistoryChart goal={goal} today={data.asOf} />
              </article>
              <article className="panel finance-card">
                <h2>Historie</h2>
                {goal.movements.length ? (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Datum</th>
                          <th>Vorgang</th>
                          <th>Betrag</th>
                          <th>
                            <span className="sr-only">Aktion</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...goal.movements].reverse().map((entry) => (
                          <tr key={entry.id}>
                            <td>{dateLabel(entry.day)}</td>
                            <td>
                              {movementNames[entry.kind] || entry.kind}
                              {entry.note && <small>{entry.note}</small>}
                            </td>
                            <td>
                              {entry.amountCents === 0
                                ? "—"
                                : money(entry.amountCents, goal.currency)}
                            </td>
                            <td>
                              {["deposit", "withdraw"].includes(entry.kind) &&
                                !goal.movements.some(
                                  (m) =>
                                    m.kind === "correction" &&
                                    m.previous === entry.id,
                                ) && (
                                  <button
                                    className="secondary small"
                                    onClick={() => correct(entry.id)}
                                  >
                                    Korrigieren
                                  </button>
                                )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty">Noch keine Bewegungen</div>
                )}
              </article>
            </>
          ) : (
            <p role="status" className="empty">
              Sparziel nicht gefunden
            </p>
          )}
        </>
      ) : (
        <>
          <div className="section-bar">
            <label>
              Ansicht{" "}
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="open">Offen und pausiert</option>
                <option value="completed">Erreicht und abgeschlossen</option>
                <option value="archived">Archiviert</option>
              </select>
            </label>
            <div className="button-row">
              <button
                className="secondary"
                disabled={!open.some((g) => g.currency === "EUR")}
                onClick={() => setPlanner("distribution")}
              >
                Rate verteilen
              </button>
              <button
                className="primary"
                onClick={() => setEditor(goalForm(availableAccounts))}
              >
                <Plus size={18} /> Sparziel erstellen
              </button>
            </div>
          </div>
          {totals.size > 0 && (
            <div className="metrics">
              {[...totals].map(([currency, total]) => (
                <article className="metric" key={currency}>
                  <span>Angespart · {currency}</span>
                  <strong>{money(total.saved, currency)}</strong>
                  <progress
                    max={total.target}
                    value={Math.min(total.saved, total.target)}
                    aria-label={`Gesamtfortschritt ${currency}`}
                  />
                  <span>
                    Ziele {money(total.target, currency)} · Monatlich{" "}
                    {money(total.rate, currency)}
                  </span>
                </article>
              ))}
              <article className="metric">
                <span>Aktive Ziele</span>
                <strong>{open.length}</strong>
                <span>
                  {
                    goals.filter((g) => g.status !== "archived" && complete(g))
                      .length
                  }{" "}
                  erreicht oder abgeschlossen
                </span>
                {next && (
                  <span>
                    Nächstes Ziel · {next.name} ·{" "}
                    {dateLabel(next.projection.reachedAt!)}
                  </span>
                )}
              </article>
            </div>
          )}
          {shown.length ? (
            <div className="budget-grid">
              {shown.map((g) => (
                <article className="panel goal-card" key={g.id}>
                  <span className="square-icon" style={{ color: g.color }}>
                    <Target size={23} />
                  </span>
                  <h2>{g.name}</h2>
                  <span className="muted">{g.category}</span>
                  <strong className="account-balance">
                    {money(g.savedCents, g.currency)}
                  </strong>
                  <span className="muted">
                    Ziel {money(g.targetCents, g.currency)}
                  </span>
                  <progress
                    max={g.targetCents}
                    value={Math.min(g.savedCents, g.targetCents)}
                    aria-label={`Fortschritt für ${g.name}`}
                  />
                  <span className="badge">
                    {g.status === "active"
                      ? forecasts[g.projection.status]
                      : statuses[g.status as keyof typeof statuses]}
                  </span>
                  <button
                    className="secondary"
                    onClick={() => navigate(g.id)}
                    aria-label={`${g.name} öffnen`}
                  >
                    Öffnen
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="panel empty">
              {goals.length
                ? "Keine Sparziele in dieser Ansicht"
                : "Noch keine Sparziele"}
            </div>
          )}
        </>
      )}
      {editor && (
        <EntityEditor
          spec={editor}
          save={saveEditor}
          close={() => setEditor(null)}
        />
      )}
      {planner === "simulation" && goal && (
        <SavingsSimulation
          goal={goal}
          today={data.asOf}
          close={() => setPlanner(null)}
          save={act}
        />
      )}
      {planner === "distribution" && (
        <SavingsDistribution
          goals={open.filter((g) => g.currency === "EUR")}
          close={() => setPlanner(null)}
          save={act}
        />
      )}
    </section>
  );
}
