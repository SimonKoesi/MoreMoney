"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { assessData } from "@/lib/data-quality";
import { dateLabel } from "./finance-module-types";
import { merchantRequest } from "./merchant-detail";

type Report = ReturnType<typeof assessData> & {
  issueCount: number;
  history: {day: string; score: number | null; coverage: number}[];
};
type Rule = {id: string; name: string; updatedAt: string};

export function DataQuality({ onBooking }: {onBooking: (id: string) => void}) {
  const [data, setData] = useState<Report | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const request = async (url: string) => {
      const result = await fetch(url, {signal:controller.signal, cache:"no-store"});
      if (!result.ok) throw new Error("Datenprüfung konnte nicht geladen werden.");
      return result.json();
    };
    const load = () => void Promise.all([request("/api/data-quality"), request("/api/merchants")])
      .then(([quality, registry]) => {if (!controller.signal.aborted) {setData(quality); setRules(registry.rules); setError("");}})
      .catch(error => {if (!controller.signal.aborted) setError(error.message);});
    load();
    const interval = setInterval(() => {if (!document.hidden) load();}, 300_000);
    return () => {controller.abort(); clearInterval(interval);};
  }, [revision]);
  return <div className="finance-card">
    {error && <p role="alert" className="form-error">{error}</p>}
    {!data && !error && <p role="status" className="empty">Daten werden geprüft …</p>}
    {data && <>
      <div className="finance-two">
        <article className="panel finance-card">
          <div className="section-bar"><h2>Datenqualität</h2><button className="secondary" onClick={() => setRevision(value => value + 1)}>Prüfen</button></div>
          <div className="quality-score">
            <svg aria-hidden="true" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42"/><circle cx="50" cy="50" r="42" pathLength={100} strokeDasharray={`${data.score ?? 0} 100`} transform="rotate(-90 50 50)" /></svg>
            <strong>{data.score === null ? "—" : `${data.score}/100`}</strong>
          </div>
          <p>{data.coverage}% Prüfabdeckung · {data.score === null ? "Unzureichende Grundlage" : data.coverage < 80 ? "Vorläufig" : "Ausgewertet"}</p>
          <small className="muted">Stand {dateLabel(data.day)}{data.limited ? " · jüngste 5.000 Buchungen" : ""}</small>
        </article>
        <article className="panel finance-card">
          <h2>Teilbewertungen</h2>
          {data.areas.map(area => <div key={area.id}>
            <div className="section-bar"><span>{area.label}</span><small>{area.score === null ? "Keine Prüfgrundlage" : area.score + "/100"}</small></div>
            {area.score !== null && <progress aria-label={area.label} value={area.score} max={100}/>}
          </div>)}
        </article>
      </div>
      {data.history.length > 1 && <article className="panel finance-card">
        <h2>Prüfverlauf</h2>
        <div className="finance-chart"><ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data.history}><XAxis dataKey="day"/><YAxis domain={[0,100]}/><Tooltip/>
            <Line name="Index" dataKey="score" stroke="var(--accent)" isAnimationActive={false}/>
            <Line name="Abdeckung" dataKey="coverage" stroke="var(--muted)" isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer></div>
      </article>}
      <article className="panel finance-card">
        <h2>Prüfhinweise · {data.issueCount}</h2>
        {data.issueCount === 0 && <p className="empty">Keine Hinweise in den geprüften Daten.</p>}
        {data.issues.map(issue => <div className="finance-event" key={issue.id}>
          <div><strong>{issue.title}</strong><small>{issue.level} · {issue.detail}</small></div>
          {issue.transactionId && <button className="secondary" onClick={() => onBooking(issue.transactionId!)}>Buchung öffnen</button>}
          {issue.route === "#/worth" && <a className="secondary" href={issue.route}>Vermögen öffnen</a>}
          {issue.route === "#/bank" && <button className="secondary" onClick={() => onBooking("")}>Bankkonten öffnen</button>}
        </div>)}
        {data.issueCount > data.issues.length && <p className="muted">Die ersten {data.issues.length} Hinweise werden angezeigt.</p>}
      </article>
    </>}
    {rules.length > 0 && <article className="panel finance-card">
      <h2>Eigene Händlerregeln</h2>
      {rules.map(rule => <div className="finance-event" key={rule.id}>
        <strong>{rule.name}</strong>
        <button className="text-button" disabled={removing === rule.id} onClick={async () => {
          if (!window.confirm(`Händlerregel „${rule.name}“ entfernen?`)) return;
          setRemoving(rule.id);
          try {await merchantRequest({op:"remove",id:rule.id,rule:true});setRevision(value => value + 1);}
          catch (error) {setError(error instanceof Error ? error.message : "Regel konnte nicht entfernt werden.");}
          finally {setRemoving(null);}
        }}>Regel entfernen</button>
      </div>)}
    </article>}
  </div>;
}
