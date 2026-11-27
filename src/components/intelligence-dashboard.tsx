"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cents, money } from "@/lib/finance";
import type { IntelligenceState } from "@/lib/intelligence-state";
import { dateLabel, uiDay } from "./finance-module-types";
import { useIntelligence } from "./use-intelligence";
import { EntityEditor, type EntitySpec } from "./finance-editor";

const ranges = [
  ["week", "Diese Woche"],
  ["month", "Dieser Monat"],
  ["lastMonth", "Letzter Monat"],
  ["three", "Letzte 3 Monate"],
  ["six", "Letzte 6 Monate"],
  ["year", "Dieses Jahr"],
  ["lastYear", "Letztes Jahr"],
  ["all", "Gesamt"],
  ["custom", "Eigener Zeitraum"],
];

const categories: Record<string, string> = {
  liquidity: "Liquidität",
  cashflow: "Cashflow",
  debt: "Schulden",
  budget: "Budget",
  future: "Vorsorge",
  obligations: "Verpflichtungen",
};

export function IntelligenceDashboard({
  page,
  reload,
}: {
  page: string;
  reload: () => Promise<void>;
}) {
  const [query, setQuery] = useState({
    period: "month",
    group: "month",
    category: "",
    from: uiDay().slice(0, 7) + "-01",
    to: uiDay(),
  });
  const [editor, setEditor] = useState<EntitySpec | null>(null);
  const [simulation, setSimulation] = useState<
    IntelligenceState["health"] | null
  >(null);
  const [income, setIncome] = useState("0");
  const [reserve, setReserve] = useState("0");
  const [simulationError, setSimulationError] = useState("");
  const [month, setMonth] = useState(uiDay().slice(0, 7));
  const { data, error, busy, loading, refresh, act } = useIntelligence(
    query,
    reload,
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
          <p role="status">Auswertung wird geladen …</p>
        )}
      </section>
    );

  const analysis = data.analysis;
  const config = data.quality.configuration;
  const metricCards = (items: [string, string][]) => (
    <div className="metrics">
      {items.map(([label, value]) => (
        <article className="metric" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  );

  return (
    <section className="finance-module" aria-busy={busy || loading}>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {page === "analysis" ? (
        <>
          <div className="finance-filters">
            <label>
              Zeitraum
              <select
                value={query.period}
                onChange={(e) => setQuery({ ...query, period: e.target.value })}
              >
                {ranges.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {query.period === "custom" && (
              <>
                <label>
                  Von
                  <input
                    type="date"
                    value={query.from}
                    onChange={(e) =>
                      setQuery({ ...query, from: e.target.value })
                    }
                  />
                </label>
                <label>
                  Bis
                  <input
                    type="date"
                    value={query.to}
                    onChange={(e) => setQuery({ ...query, to: e.target.value })}
                  />
                </label>
              </>
            )}
            <label>
              Gruppierung
              <select
                value={query.group}
                onChange={(e) => setQuery({ ...query, group: e.target.value })}
              >
                {[
                  ["day", "Tage"],
                  ["week", "Wochen"],
                  ["month", "Monate"],
                  ["year", "Jahre"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            {query.category && (
              <button
                className="secondary"
                onClick={() => setQuery({ ...query, category: "" })}
              >
                Kategorie zurücksetzen
              </button>
            )}
          </div>
          {analysis.excludedCurrencies.length > 0 && (
            <p className="muted">
              Bei fehlendem Wechselkurs bleibt der Betrag ungeprüft. Betroffen
              sind {analysis.excludedCurrencies.join(", ")}.
            </p>
          )}
          {metricCards([
            ["Einnahmen", money(analysis.incomeCents)],
            ["Ausgaben", money(analysis.expenseCents)],
            ["Überschuss", money(analysis.surplusCents)],
            ["Ausgaben pro Tag", money(analysis.dailyExpenseCents)],
          ])}
          <article className="panel finance-card">
            <h2>Einnahmen und Ausgaben</h2>
            {analysis.grouped.length ? (
              <>
                <div className="finance-chart">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={analysis.grouped}>
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(n) => String(n / 100)} />
                      <Tooltip formatter={(value) => money(Number(value))} />
                      <Bar
                        name="Einnahmen"
                        dataKey="incomeCents"
                        fill="var(--accent)"
                        isAnimationActive={false}
                      />
                      <Bar
                        name="Ausgaben"
                        dataKey="expenseCents"
                        fill="#8294c9"
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <details>
                  <summary>Diagrammwerte anzeigen</summary>
                  <ul>
                    {analysis.grouped.map((row) => (
                      <li key={row.period}>
                        {row.period} · Einnahmen {money(row.incomeCents)} ·
                        Ausgaben {money(row.expenseCents)}
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <p>Keine Buchungen im Zeitraum.</p>
            )}
          </article>
          <article className="panel finance-card">
            <h2>Ausgabenkategorien</h2>
            {analysis.categories.map((row) => (
              <button
                className="finance-event"
                key={row.name}
                aria-pressed={query.category === row.name}
                onClick={() =>
                  setQuery({
                    ...query,
                    category: query.category === row.name ? "" : row.name,
                  })
                }
              >
                {row.name}
                <strong>{money(row.value)}</strong>
              </button>
            ))}
          </article>
          <article className="panel finance-card">
            <h2>Buchungen{query.category ? " · " + query.category : ""}</h2>
            {analysis.transactions.slice(0, 50).map((row) => (
              <div className="finance-event" key={row.id}>
                <span>
                  {row.title}
                  <small>{dateLabel(row.date)}</small>
                </span>
                <strong>{money(row.amountCents, row.currency)}</strong>
              </div>
            ))}
          </article>
        </>
      ) : (
        <>
          {metricCards([
            [
              "Financial Health",
              data.health.score === null ? "—" : data.health.score + " / 100",
            ],
            [
              "Datenabdeckung",
              data.health.coverage.toLocaleString("de-DE") + " %",
            ],
          ])}
          <p>
            {data.health.classification}
            {data.health.status === "provisional"
              ? " · Vorläufige Bewertung"
              : ""}
          </p>
          {data.warnings.map((warning) => (
            <a
              className="panel finance-card"
              href={warning.route}
              key={warning.key}
            >
              <strong>{warning.title}</strong>
              {warning.description}
            </a>
          ))}
          <article className="panel finance-card">
            <h2>Teilbewertungen</h2>
            {data.health.details.map((row) => (
              <details key={row.category}>
                <summary>
                  {categories[row.category]} · {row.displayScore ?? "—"} ·
                  Gewicht {row.plannedWeight} %
                </summary>
                <ul>
                  {row.metrics.map((metric) => (
                    <li key={metric.metric}>
                      {metric.reason}
                      {metric.available
                        ? " · " + metric.displayPoints + " Punkte"
                        : " · Nicht bewertbar"}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </article>
          <article className="panel finance-card">
            <h2>Datenqualität</h2>
            <p>
              {data.quality.monthsUsed} bestätigte abgeschlossene Monate mit
              bewertbarem Cashflow.
            </p>
            <button
              className="secondary"
              onClick={() =>
                setEditor({
                  op: "quality",
                  title: "Datengrundlage bestätigen",
                  initial: {
                    accountsComplete: false,
                    debtsComplete: false,
                    obligationsComplete: false,
                    incomeReviewed: false,
                    savingsReviewed: false,
                    longTermReviewed: false,
                    highInterestBps: 1000,
                    targetReserveMonths: 6,
                    ...config,
                    essentialCategories: config
                      ? (
                          JSON.parse(config.essentialCategories) as string[]
                        ).join(", ")
                      : "",
                  },
                  fields: [
                    {
                      key: "accountsComplete",
                      label: "Konten vollständig erfasst",
                      kind: "checkbox",
                    },
                    {
                      key: "debtsComplete",
                      label: "Schulden vollständig erfasst",
                      kind: "checkbox",
                    },
                    {
                      key: "obligationsComplete",
                      label: "Verpflichtungen vollständig erfasst",
                      kind: "checkbox",
                    },
                    {
                      key: "incomeReviewed",
                      label: "Laufende Einnahmen geprüft",
                      kind: "checkbox",
                    },
                    {
                      key: "savingsReviewed",
                      label: "Sparbeträge geprüft",
                      kind: "checkbox",
                    },
                    {
                      key: "longTermReviewed",
                      label: "Langfristige Vorsorge geprüft",
                      kind: "checkbox",
                    },
                    {
                      key: "essentialCategories",
                      label: "Notwendige Kategorien, durch Komma getrennt",
                      optional: true,
                    },
                    {
                      key: "targetReserveMonths",
                      label: "Reserveziel in Monaten",
                      kind: "number",
                    },
                    {
                      key: "highInterestBps",
                      label: "Hochzinsgrenze in Prozent",
                      kind: "money",
                    },
                  ],
                })
              }
            >
              Datengrundlage bearbeiten
            </button>
            <label>
              Monat
              <input
                type="month"
                max={data.asOf.slice(0, 7)}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <button
              className="secondary"
              disabled={busy || !month}
              onClick={() =>
                void act({
                  op: "coverage",
                  month,
                  incomeComplete: true,
                  expensesComplete: true,
                }).catch(() => {})
              }
            >
              Einnahmen und Ausgaben als vollständig bestätigen
            </button>
            <button
              className="text-button"
              disabled={
                busy ||
                !data.quality.coverage.some(
                  (row) =>
                    row.month === month &&
                    (row.incomeComplete || row.expensesComplete),
                )
              }
              onClick={() =>
                void act({
                  op: "coverage",
                  month,
                  incomeComplete: false,
                  expensesComplete: false,
                }).catch(() => {})
              }
            >
              Monatsbestätigung zurücknehmen
            </button>
          </article>
          <form
            className="panel finance-card"
            onSubmit={async (event) => {
              event.preventDefault();
              setSimulationError("");
              setSimulation(null);
              try {
                const result = (await act({
                  op: "scoreSimulation",
                  incomeDeltaCents: cents(income),
                  cashDeltaCents: cents(reserve),
                })) as { health: IntelligenceState["health"] };
                setSimulation(result.health);
              } catch (error) {
                setSimulationError(
                  error instanceof Error
                    ? error.message
                    : "Simulation fehlgeschlagen.",
                );
              }
            }}
          >
            <h2>Score simulieren</h2>
            <label>
              Monatliche Einkommensänderung in EUR
              <input
                inputMode="decimal"
                value={income}
                onChange={(e) => {
                  setIncome(e.target.value);
                  setSimulation(null);
                }}
              />
            </label>
            <label>
              Änderung der Liquidität in EUR
              <input
                inputMode="decimal"
                value={reserve}
                onChange={(e) => {
                  setReserve(e.target.value);
                  setSimulation(null);
                }}
              />
            </label>
            <button className="primary" disabled={busy}>
              Berechnen
            </button>
            {simulationError && <p role="alert">{simulationError}</p>}
            {simulation && (
              <p role="status">
                Modellwert{" "}
                {simulation.score === null
                  ? "nicht bewertbar"
                  : simulation.score + " / 100"}{" "}
                · Datenabdeckung {simulation.coverage.toLocaleString("de-DE")} %
              </p>
            )}
          </form>
        </>
      )}
      {editor && (
        <EntityEditor
          spec={editor}
          close={() => setEditor(null)}
          save={async (payload) => {
            const fields = payload.data as Record<string, unknown>;
            await act({
              op: "quality",
              data: {
                ...fields,
                essentialCategories: String(fields.essentialCategories)
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              },
            });
          }}
        />
      )}
    </section>
  );
}
