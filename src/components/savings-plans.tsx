"use client";

import { useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cents, money } from "@/lib/finance";
import { addMonths } from "@/lib/calendar";
import { savingsProjection, type distributeSavings } from "@/lib/savings-math";
import { Dialog } from "./ui/dialog";
import { dateLabel } from "./finance-module-types";
import type { Goal } from "./savings-goals";

type Save = (command: Record<string, unknown>) => Promise<unknown>;
type Point = {
  date: string;
  actual?: number;
  planned?: number;
  projected?: number;
};
type Preview = ReturnType<typeof distributeSavings> & {
  monthlySurplusCents: number | null;
  overBudget: boolean;
};
const previewModes = [
  ["equal", "Gleichmäßig"],
  ["priority", "Priorität"],
  ["deadline", "Wunschdatum"],
  ["need", "Restbetrag"],
  ["percent", "Eigene Prozentanteile"],
];

function chartPoints(
  goal: Goal,
  today: string,
  from: string,
  projection: Goal["projection"],
) {
  const result = new Map<string, Point>();
  const update = (
    date: string,
    key: "actual" | "planned" | "projected",
    value: number,
  ) => {
    if (date < from) return;
    result.set(date, { ...result.get(date), date, [key]: value });
  };
  const movements = goal.movements.filter(
    (m) => m.day <= today && m.amountCents !== 0,
  );
  const inherited =
    goal.savedCents - movements.reduce((total, m) => total + m.amountCents, 0);
  let running = inherited;
  if (movements.length && inherited)
    update(movements[0].day, "actual", inherited);
  for (const movement of movements) {
    running += movement.amountCents;
    update(movement.day, "actual", running);
  }
  update(today, "actual", goal.savedCents);
  const baseline = goal.startDate > today ? today : goal.startDate;
  if (
    goal.monthlyRateCents &&
    goal.startDate <= today &&
    goal.status === "active"
  ) {
    const initial =
      goal.movements.find((m) => m.kind === "initial")?.amountCents ??
      inherited;
    const planned = savingsProjection(
      { ...goal, savedCents: Math.max(0, initial) },
      baseline,
    );
    if (
      planned.reachedAt ||
      planned.path.some((point) => point.value !== initial)
    ) {
      for (const point of planned.path) {
        if (point.date > today) break;
        update(point.date, "planned", point.value);
      }
    }
  }
  const horizon = projection.reachedAt || addMonths(today, 24);
  if (
    projection.path.some((point) => point.value !== projection.path[0]?.value)
  ) {
    for (const point of projection.path) {
      if (point.date > horizon) break;
      update(point.date, "projected", point.value);
    }
  }
  if (
    goal.targetDate >= from &&
    goal.targetDate <= horizon &&
    !result.has(goal.targetDate)
  )
    result.set(goal.targetDate, { date: goal.targetDate });
  return [...result.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function GoalChart({
  points,
  goal,
}: {
  points: Point[];
  goal: Pick<Goal, "currency" | "targetCents" | "targetDate">;
}) {
  const timestamp = (day: string) => Date.parse(day + "T12:00:00Z");
  const dayLabel = (ms: number) =>
    Number.isFinite(ms)
      ? dateLabel(new Date(ms).toISOString().slice(0, 10))
      : "";
  const series = points.map((point) => ({
    ...point,
    time: timestamp(point.date),
  }));
  return (
    <div className="finance-chart savings-chart" aria-label="Sparverlauf">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={series}
          margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
        >
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={dayLabel}
            minTickGap={28}
          />
          <YAxis
            width={62}
            tickFormatter={(value) =>
              new Intl.NumberFormat("de-DE", { notation: "compact" }).format(
                value / 100,
              )
            }
            domain={[
              (dataMin) => Math.min(0, dataMin),
              (dataMax) => Math.max(goal.targetCents, dataMax),
            ]}
          />
          <Tooltip
            labelFormatter={(day) => dayLabel(Number(day))}
            formatter={(value) => money(Number(value), goal.currency)}
          />
          <Legend />
          <ReferenceLine
            y={goal.targetCents}
            stroke="var(--muted)"
            strokeDasharray="5 4"
          />
          {points.some((p) => p.date === goal.targetDate) && (
            <ReferenceLine
              x={timestamp(goal.targetDate)}
              stroke="var(--muted)"
              strokeDasharray="3 4"
            />
          )}
          <Line
            type="linear"
            dataKey="actual"
            name="Tatsächlich"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
          {points.some((p) => p.planned !== undefined) && (
            <Line
              type="linear"
              dataKey="planned"
              name="Aktueller Plan ab Start"
              stroke="var(--muted)"
              strokeDasharray="2 5"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          )}
          {points.some((p) => p.projected !== undefined) && (
            <Line
              type="linear"
              dataKey="projected"
              name="Prognose"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="7 5"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SavingsHistoryChart({
  goal,
  today,
}: {
  goal: Goal;
  today: string;
}) {
  const [range, setRange] = useState("all");
  const points = chartPoints(
    goal,
    today,
    range === "all" ? "" : addMonths(today, -Number(range)),
    goal.projection,
  );
  return (
    <>
      <div className="section-bar">
        <label>
          Verlauf{" "}
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="all">Gesamt</option>
            <option value="3">Letzte 3 Monate</option>
            <option value="12">Letzte 12 Monate</option>
          </select>
        </label>
      </div>
      {points.length > 1 ? (
        <GoalChart points={points} goal={goal} />
      ) : (
        <p className="muted">Noch kein Verlauf für diesen Zeitraum.</p>
      )}
    </>
  );
}

export function SavingsSimulation({
  goal,
  today,
  close,
  save,
}: {
  goal: Goal;
  today: string;
  close: () => void;
  save: Save;
}) {
  const [values, setValues] = useState({
    targetCents: String(goal.targetCents / 100),
    monthlyRateCents: String(goal.monthlyRateCents / 100),
    targetDate: goal.targetDate,
    start: String(goal.savedCents / 100),
    extra: "0",
    interestBps: String(goal.interestBps / 100),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  let result: Goal["projection"] | undefined;
  let plan:
    | Pick<
        Goal,
        "targetCents" | "monthlyRateCents" | "targetDate" | "interestBps"
      >
    | undefined;
  let points: Point[] = [];
  let invalid = "";
  try {
    plan = {
      targetCents: cents(values.targetCents),
      monthlyRateCents: cents(values.monthlyRateCents),
      targetDate: values.targetDate,
      interestBps: cents(values.interestBps),
    };
    const start = cents(values.start),
      extra = cents(values.extra);
    if (start < 0 || extra < 0)
      throw new Error(
        "Startguthaben und Sonderzahlung müssen positiv oder null sein.",
      );
    result = savingsProjection(
      { ...goal, ...plan, savedCents: start + extra, status: "active" },
      today,
    );
    if (result.reachedAt) points = [{ date: today, projected: start + extra }];
    const horizon = result.reachedAt || addMonths(today, 24);
    const byDate = new Map(
      result.path
        .filter((p) => p.date <= horizon)
        .map((p) => [p.date, { date: p.date, projected: p.value }]),
    );
    if (byDate.size > 1) points = [...byDate.values()];
  } catch (e) {
    invalid = e instanceof Error ? e.message : "Eingaben prüfen.";
  }

  async function apply() {
    if (lock.current || !plan || invalid) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await save({ op: "updateGoalPlan", id: goal.id, plan });
      close();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Sparplan konnte nicht gespeichert werden.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog
      title="Sparziel simulieren"
      onClose={() => {
        if (!lock.current) close();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void apply();
        }}
      >
        <div className="form-fields">
          {(
            [
              ["monthlyRateCents", `Rate je Intervall in ${goal.currency}`],
              ["targetCents", `Zielbetrag in ${goal.currency}`],
              ["targetDate", "Wunschdatum"],
              ["start", "Startguthaben (Simulation)"],
              ["extra", "Sonderzahlung (Simulation)"],
              ["interestBps", "Modellzins pro Jahr (%)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                disabled={busy}
                type={key === "targetDate" ? "date" : "text"}
                inputMode={key === "targetDate" ? undefined : "decimal"}
                value={values[key]}
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.value })
                }
              />
            </label>
          ))}
        </div>
        {result && plan && (
          <>
            <dl className="savings-results">
              <div>
                <dt>Prognose</dt>
                <dd>
                  {result.reachedAt ? dateLabel(result.reachedAt) : "Offen"}
                </dd>
              </div>
              <div>
                <dt>Benötigte Rate</dt>
                <dd>
                  {result.requiredRateCents === null
                    ? "—"
                    : money(result.requiredRateCents, goal.currency)}
                </dd>
              </div>
              <div>
                <dt>Einzahlungen im Modell</dt>
                <dd>{money(result.contributionCents, goal.currency)}</dd>
              </div>
              <div>
                <dt>Modellzinsen</dt>
                <dd>{money(result.interestCents, goal.currency)}</dd>
              </div>
              {result.months !== null && goal.projection.months !== null && (
                <div>
                  <dt>Monate gegenüber aktuellem Plan</dt>
                  <dd>{result.months - goal.projection.months}</dd>
                </div>
              )}
            </dl>
            {points.length > 1 && (
              <GoalChart
                points={points}
                goal={{ ...plan, currency: goal.currency }}
              />
            )}
          </>
        )}
        {(invalid || error) && (
          <p role="alert" className="form-error">
            {error || invalid}
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
          <button
            className="primary"
            disabled={
              busy || !!invalid || !result || goal.status === "archived"
            }
          >
            Sparplan übernehmen
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function SavingsDistribution({
  goals,
  close,
  save,
}: {
  goals: Goal[];
  close: () => void;
  save: Save;
}) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("equal");
  const [chosen, setChosen] = useState(() =>
    goals.slice(0, 100).map((g) => g.id),
  );
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<Preview | null>(null);
  const [override, setOverride] = useState(false);
  const [issue, setIssue] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const lock = useRef(false);
  function reset() {
    setPreview(null);
    setOverride(false);
    setIssue("");
    setRequestId(crypto.randomUUID());
  }
  async function submit(apply: boolean) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setIssue("");
    try {
      const result = await save({
        op: "distribution",
        totalCents: cents(amount),
        mode,
        goalIds: chosen,
        percentages: Object.fromEntries(
          chosen.map((id) => [id, Number(percentages[id] || 0)]),
        ),
        apply,
        requestId,
        allowOverBudget: override,
        ...(apply && preview ? { expected: preview.allocations } : {}),
      });
      if (apply) close();
      else setPreview(result as Preview);
    } catch (e) {
      setIssue(
        e instanceof Error
          ? e.message
          : "Verteilung konnte nicht berechnet werden.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog
      title="Monatsrate verteilen"
      onClose={() => {
        if (!lock.current) close();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(!!preview);
        }}
      >
        <div className="form-fields">
          <label>
            Monatsbetrag in EUR
            <input
              required
              inputMode="decimal"
              value={amount}
              disabled={busy}
              onChange={(e) => {
                setAmount(e.target.value);
                reset();
              }}
            />
          </label>
          <label>
            Verteilung
            <select
              value={mode}
              disabled={busy}
              onChange={(e) => {
                setMode(e.target.value);
                reset();
              }}
            >
              {previewModes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="savings-choices" disabled={busy}>
          <legend>Sparziele</legend>
          {goals.map((goal) => (
            <div key={goal.id} className="savings-choice">
              <label>
                <input
                  type="checkbox"
                  checked={chosen.includes(goal.id)}
                  onChange={(e) => {
                    setChosen(
                      e.target.checked
                        ? [...chosen, goal.id]
                        : chosen.filter((id) => id !== goal.id),
                    );
                    reset();
                  }}
                />
                {goal.name}
              </label>
              {mode === "percent" && chosen.includes(goal.id) && (
                <label>
                  Prozent · {goal.name}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={percentages[goal.id] || ""}
                    onChange={(e) => {
                      setPercentages({
                        ...percentages,
                        [goal.id]: e.target.value,
                      });
                      reset();
                    }}
                  />
                </label>
              )}
            </div>
          ))}
        </fieldset>
        {preview && (
          <>
            <dl className="savings-results">
              {preview.allocations.map((row) => (
                <div key={row.id}>
                  <dt>
                    {goals.find((g) => g.id === row.id)?.name || "Sparziel"}
                  </dt>
                  <dd>{money(row.amountCents)}</dd>
                </div>
              ))}
              {preview.unallocatedCents > 0 && (
                <div>
                  <dt>Unverteilt</dt>
                  <dd>{money(preview.unallocatedCents)}</dd>
                </div>
              )}
            </dl>
            {preview.overBudget && (
              <div className="form-fields">
                <p role="status">
                  {preview.monthlySurplusCents === null
                    ? "Verfügbarer monatlicher Überschuss unbekannt."
                    : `Für diese Ziele monatlich verfügbar: ${money(preview.monthlySurplusCents)}.`}
                </p>
                <label>
                  <input
                    type="checkbox"
                    checked={override}
                    disabled={busy}
                    onChange={(e) => setOverride(e.target.checked)}
                  />
                  Abweichung bestätigen
                </label>
              </div>
            )}
          </>
        )}
        {issue && (
          <p role="alert" className="form-error">
            {issue}
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
          {preview && issue && (
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => {
                setOverride(false);
                void submit(false);
              }}
            >
              Vorschau aktualisieren
            </button>
          )}
          <button
            className="primary"
            disabled={
              busy ||
              !chosen.length ||
              Boolean(
                preview &&
                (!preview.allocations.length ||
                  (preview.overBudget && !override)),
              )
            }
          >
            {preview ? "Raten übernehmen" : "Vorschau"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
