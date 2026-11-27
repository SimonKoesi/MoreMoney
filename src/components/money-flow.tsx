"use client";

import { useRef, useState, type MouseEvent } from "react";
import { ChevronRight } from "lucide-react";
import { money } from "@/lib/finance";
import { dateLabel } from "./finance-module-types";
import { Dialog } from "./ui/dialog";

const colors = ["#9292f5", "#52ceb1", "#69adf0", "#bc8bea", "#efbe56", "#9daabc"];

type ExpenseDetail = { id: string; title: string; date: string; account?: string; categoryCents: number; amountCents: number };
const pageSize = 12;

export function MoneyFlow({ income, expenses, period, getDetails }: {
  income: number;
  expenses: { name: string; value: number }[];
  period: string;
  getDetails: (name: string) => ExpenseDetail[];
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const trigger = useRef<HTMLButtonElement | null>(null);
  function open(event: MouseEvent<HTMLButtonElement>, name: string) {
    trigger.current = event.currentTarget;
    setPage(0);
    setCategory(name);
  }
  function close() {
    setCategory(null);
    requestAnimationFrame(() => trigger.current?.focus());
  }
  const details = category === null ? [] : getDetails(category);
  const pageCount = Math.ceil(details.length / pageSize);
  const visiblePage = Math.min(page, Math.max(0, pageCount - 1));
  const spending = expenses.reduce((sum, row) => sum + row.value, 0);
  const surplus = Math.max(0, income - spending);
  const shortfall = Math.max(0, spending - income);
  const total = Math.max(income, spending);
  const largest = expenses.slice(0, 6);
  const omitted = expenses.slice(6);
  const destinations = [
    ...largest.map((row, index) => ({ ...row, id: "category-" + index, color: colors[index] })),
    ...(omitted.length ? [{ id: "combined", name: "Weitere Kategorien", value: omitted.reduce((sum, row) => sum + row.value, 0), color: "#9daabc" }] : []),
    ...(surplus ? [{ id: "surplus", name: "Überschuss", value: surplus, color: "#45d4c1" }] : []),
  ];
  const sourceHeight = Math.min(270, Math.max(80, destinations.length * 40));
  let top = 0, start = 0;
  const lanes = destinations.map(row => {
    const weight = row.value / total * sourceHeight;
    const height = Math.max(54, Math.ceil(weight) + 10);
    const lane = { ...row, height, weight, from: start, to: top + (height - weight) / 2 };
    start += weight;
    top += height;
    return lane;
  });
  const sourceTop = (top - sourceHeight) / 2;

  return (
    <section className="panel finance-card money-flow" aria-labelledby="money-flow-heading">
      <div className="section-bar"><h2 id="money-flow-heading">Wohin fließt dein Geld?</h2><span className="badge">{period}</span></div>
      {total > 0 ? <>
        <dl className="money-flow-sources">
          <div><dt>Einnahmen</dt><dd>{money(income)}</dd></div>
          {shortfall > 0 && <div className="negative"><dt>Fehlbetrag</dt><dd>{money(shortfall)}</dd></div>}
        </dl>
        <div className="money-flow-chart">
          <div className="money-flow-bands"><svg aria-hidden="true" viewBox={`0 0 100 ${top}`} preserveAspectRatio="none">
            {lanes.map(lane => {
              const from = lane.from + sourceTop;
              const fromEnd = from + lane.weight;
              const toEnd = lane.to + lane.weight;
              return <g key={lane.id} fill={lane.color}>
                <path opacity=".32" d={`M 3 ${from} C 42 ${from} 56 ${lane.to} 97 ${lane.to} L 97 ${toEnd} C 56 ${toEnd} 42 ${fromEnd} 3 ${fromEnd} Z`} />
                <rect x="97" y={lane.to} width="3" height={lane.weight} />
              </g>;
            })}
            <rect x="0" y={sourceTop} width="3" height={income / total * sourceHeight} fill="#53dbb8" />
            {shortfall > 0 && <rect x="0" y={sourceTop + income / total * sourceHeight} width="3" height={shortfall / total * sourceHeight} fill="#f18b94" />}
          </svg></div>
          <ul>{lanes.map(lane => <li style={{ minHeight: lane.height }} key={lane.id}>
            {lane.id.startsWith("category-") ? (
              <button className="money-flow-category" onClick={event => open(event, lane.name)} aria-haspopup="dialog">
                <span title={lane.name}>{lane.name}</span><strong>{money(lane.value)}</strong>
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            ) : <><span title={lane.name}>{lane.name}</span><strong>{money(lane.value)}</strong></>}
          </li>)}</ul>
        </div>
        {omitted.length > 0 && <details>
          <summary>Weitere Kategorien anzeigen</summary>
          <ul className="money-flow-other">{omitted.map(row => <li key={row.name}>
            <button className="finance-event" onClick={event => open(event, row.name)} aria-haspopup="dialog">
              <span>{row.name}</span><strong>{money(row.value)}</strong><ChevronRight size={14} aria-hidden="true" />
            </button>
          </li>)}</ul>
        </details>}
      </> : <p className="empty">Für diesen Zeitraum sind keine bewerteten Buchungen vorhanden.</p>}
      {category !== null && <Dialog title={category} onClose={close} description="Buchungen im gewählten Zeitraum">
        <div className="section-bar" aria-live="polite">
          <span className="muted">{period} · {details.length} {details.length === 1 ? "Buchung" : "Buchungen"}</span>
          <strong>{money(details.reduce((sum, row) => sum + row.categoryCents, 0))}</strong>
        </div>
        <ul className="money-flow-other" aria-label="Buchungen">
          {details.slice(visiblePage * pageSize, (visiblePage + 1) * pageSize).map(row => <li className="finance-event" key={row.id}>
            <div><strong>{row.title}</strong><small>{[dateLabel(row.date), row.account].filter(Boolean).join(" · ")}</small></div>
            <div><strong>{money(row.categoryCents)}</strong>
              {row.categoryCents !== row.amountCents && <small>Gesamtbuchung {money(row.amountCents)}</small>}
            </div>
          </li>)}
        </ul>
        {!details.length && <p className="empty">Keine Buchungen im Zeitraum.</p>}
        {pageCount > 1 && <div className="dialog-actions">
          <button className="secondary" disabled={!visiblePage} onClick={() => setPage(visiblePage - 1)}>Zurück</button>
          <span aria-live="polite">Seite {visiblePage + 1} von {pageCount}</span>
          <button className="secondary" disabled={visiblePage + 1 >= pageCount} onClick={() => setPage(visiblePage + 1)}>Weiter</button>
        </div>}
      </Dialog>}
    </section>
  );
}
