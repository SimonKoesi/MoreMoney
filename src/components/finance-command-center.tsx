"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { addDays, addMonths } from "@/lib/calendar";
import { currencyMoney as money, dateLabel } from "./finance-module-types";
import { useIntelligence } from "./use-intelligence";

const windows = [
  ["dashboard", "Dashboard-Zeitraum"],
  ["7", "1 Woche"], ["1", "1 Monat"], ["3", "3 Monate"], ["6", "6 Monate"],
  ["12", "1 Jahr"], ["60", "5 Jahre"], ["all", "Gesamt"], ["custom", "Individuell"],
] as const;

export function FinanceCommandCenter({ refreshCore, periodStart }: {refreshCore: () => Promise<void>; periodStart: string}) {
  const { data, error, refresh } = useIntelligence({}, refreshCore);
  const [range, setRange] = useState("dashboard");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  if (!data) return error
    ? <p className="form-error" role="alert">{error} <button className="secondary" onClick={() => void refresh()}>Erneut laden</button></p>
    : null;
  const min = range === "dashboard" ? periodStart : range === "custom" ? from : range === "all" ? "" : range === "7" ? addDays(data.asOf, -7) : addMonths(data.asOf, -Number(range));
  const max = range === "custom" && to ? to : data.asOf;
  const history = data.worthHistory.filter(item => item.day >= min && item.day <= max)
    .map(item => ({day: item.day, amount: Number(item.netCents)}));
  const difference = history.length > 1 ? history.at(-1)!.amount - history[0].amount : null;
  const tiles = [
    { title: "Nettovermögen", value: money(data.worth.netCents), link: "#/worth" },
    { title: "Liquides Vermögen", value: money(data.worth.liquidCents), link: "#/bank" },
    { title: "Frei verfügbar · 14 Tage", value: data.spendableCents === null ? "Unvollständig" : money(data.spendableCents), link: "#/health" },
    { title: "Financial Health", value: data.health.score === null ? "—" : `${data.health.score}/100`, link: "#/health" },
    { title: "Datenqualität", value: data.lastQuality?.score == null ? "—" : `${data.lastQuality.score}/100`, link: "#/bank/quality",
      note: data.lastQuality ? `${data.lastQuality.coverage}% geprüft · ${dateLabel(data.lastQuality.day)}` : "Prüfung öffnen" },
  ];
  return <div className="finance-card command-center">
    <div className="metrics">
      {tiles.map(tile => <a className="metric" key={tile.title} href={tile.link}>
        <div className="metric-label">{tile.title}<ArrowUpRight size={17} aria-hidden="true" /></div>
        <strong>{tile.value}</strong>{tile.note && <small className="muted">{tile.note}</small>}
      </a>)}
    </div>
    {data.staleBanks && <div role="status" className="stock-error">Kontostände teilweise veraltet. <a className="text-button" href="#/bank">Bankkonten öffnen</a></div>}
    {data.worthHistory.length > 0 && <article className="panel finance-card">
      <div className="section-bar">
        <h2>Vermögensentwicklung</h2>
        <label className="command-period">Zeitraum der Vermögensentwicklung
          <select value={range} onChange={event => setRange(event.target.value)}>
            {windows.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      {range === "custom" && <div className="finance-filters">
        <label>Von<input type="date" value={from} onChange={event => setFrom(event.target.value)}/></label>
        <label>Bis<input type="date" value={to} onChange={event => setTo(event.target.value)}/></label>
      </div>}
      {difference !== null && <p className="muted">Veränderung {money(difference)} · Tief {money(Math.min(...history.map(row => row.amount)))} · Hoch {money(Math.max(...history.map(row => row.amount)))}</p>}
      {history.length === 0 && <p className="empty">Keine gespeicherten Stände im Zeitraum.</p>}
      {history.length > 1 && <div className="finance-chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={history}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" tickFormatter={dateLabel} tick={{fontSize: 11}} />
            <YAxis tickFormatter={value => String(Number(value) / 100)} tick={{fontSize: 11}} />
            <Tooltip labelFormatter={value => dateLabel(String(value))} formatter={value => money(Number(value))} />
            <Area name="Nettovermögen" dataKey="amount" stroke="var(--accent)" fill="var(--accent-dark)" isAnimationActive={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>}
      <details><summary>Gespeicherte Stände</summary>
        <ul className="bank-directory-results">{history.slice(-20).reverse().map((row, index) =>
          <li className="finance-event" key={row.day + index}><span>{dateLabel(row.day)}</span><strong>{money(row.amount)}</strong></li>,
        )}</ul>
      </details>
    </article>}
    {data.warnings.length > 0 && <article className="panel finance-card">
      <h2>Finanz-Briefing</h2>
      {data.warnings.slice().sort((a, b) => b.priority - a.priority).slice(0, 3).map(issue =>
        <a className="finance-event" key={issue.key} href={issue.route}><span><strong>{issue.title}</strong><small>{issue.description}</small></span><ArrowUpRight size={17} aria-hidden="true" /></a>,
      )}
    </article>}
  </div>;
}
