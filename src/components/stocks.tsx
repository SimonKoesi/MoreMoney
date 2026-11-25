'use client';
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Star, Plus, Search, Pencil, Trash2, RefreshCw, ChevronLeft, TrendingUp } from 'lucide-react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AppState } from '@/lib/db';
import { type SecuritySuggestion, changePercent, currencies, priceInput, stockMoney, targetReached } from '@/lib/stocks';
import { Dialog } from './ui/dialog';
import { JellyRadio } from './ui/elements';

type Stock=AppState['stocks'][number];
type Editor={kind:'stock';stock?:Stock}|{kind:'quote';stock:Stock};
type Values={name:string;symbol:string;exchange:string;currency:string;group:string;note:string;target:string;targetDirection:string;price:string;asOf:string};

function StockEditor({editor,save,close}:{editor:Editor;save:(values:Values)=>Promise<void>;close:()=>void}){
  const s=editor.stock;
  const [values,setValues]=useState<Values>({name:s?.name||'',symbol:s?.symbol||'',exchange:s?.exchange||'',currency:s?.currency||'EUR',group:s?.group||'',note:s?.note||'',target:priceInput(s?.targetMicros||null),targetDirection:s?.targetDirection||'below',price:'',asOf:format(new Date(),'yyyy-MM-dd')});
  const [busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false);
  const [suggestions,setSuggestions]=useState<SecuritySuggestion[]>([]),[searchError,setSearchError]=useState('');
  const [query,setQuery]=useState('');
  useEffect(()=>{
    if(query.trim().length<2||editor.kind!=='stock'||s)return;
    const abort=new AbortController();let active=true;
    const timer=setTimeout(async()=>{
      try{const response=await fetch('/api/stocks/search?q='+encodeURIComponent(query),{signal:abort.signal});const body=await response.json();if(!response.ok)throw new Error(body.error);if(active){setSuggestions(body.results);setSearchError(body.results.length?'':'Keine passenden Aktien oder ETFs.');}}
      catch(e){if(active&&!abort.signal.aborted){setSuggestions([]);setSearchError(e instanceof Error?e.message:'Suche fehlgeschlagen.');}}
    },350);
    return()=>{active=false;clearTimeout(timer);abort.abort();};
  },[query,editor.kind,s]);
  const field=(key:keyof Values,value:string)=>setValues(previous=>({...previous,[key]:value}));
  return <Dialog title={editor.kind==='quote'?'Kurs erfassen':s?'Aktie bearbeiten':'Aktie oder ETF hinzufügen'} onClose={()=>{if(!lock.current)close();}}>
    <form onSubmit={async event=>{event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await save(values);close();}catch(e){setError(e instanceof Error?e.message:'Speichern fehlgeschlagen.');}finally{lock.current=false;setBusy(false);}}}>
      <div className="form-fields">{editor.kind==='quote'?<>
        <label>Kurs in {s?.currency}<input autoFocus required value={values.price} inputMode="decimal" onChange={e=>field('price',e.target.value)} maxLength={20}/></label>
        <label>Handelstag<input type="date" required value={values.asOf} max={format(new Date(),'yyyy-MM-dd')} onChange={e=>field('asOf',e.target.value)}/></label>
      </>:<>
        <label>Name<input autoFocus required maxLength={120} value={values.name} onChange={e=>{field('name',e.target.value);setSuggestions([]);setSearchError('');setQuery(e.target.value);}}/></label>
        {searchError&&<p role="status" className="muted">{searchError}</p>}
        {suggestions.length>0&&<ul className="security-suggestions" aria-label="Aktien und ETF Vorschläge">{suggestions.map(v=><li key={v.symbol+v.exchange+v.currency}><button type="button" onClick={()=>{setValues(previous=>({...previous,name:v.name,symbol:v.symbol,exchange:v.exchange,currency:v.currency}));setQuery('');setSuggestions([]);}}><strong>{v.name}</strong><span>{v.symbol} · {v.exchange} · {v.type} · {v.currency}</span></button></li>)}</ul>}
        <div className="stock-form-row"><label>Symbol<input required readOnly={Boolean(s?.quotes.length)} maxLength={25} value={values.symbol} onChange={e=>field('symbol',e.target.value.toUpperCase())} placeholder="z. B. AAPL"/></label>
        <label>Währung<select disabled={Boolean(s?.quotes.length)} value={values.currency} onChange={e=>field('currency',e.target.value)}>{currencies.map(c=><option key={c}>{c}</option>)}</select></label></div>
        <div className="stock-form-row"><label>Börse · optional<input readOnly={Boolean(s?.quotes.length)} maxLength={40} value={values.exchange} onChange={e=>field('exchange',e.target.value)}/></label>
        <label>Gruppe · optional<input maxLength={60} value={values.group} onChange={e=>field('group',e.target.value)}/></label></div>
        <div className="stock-form-row"><label>Zielkurs · optional<input inputMode="decimal" maxLength={20} value={values.target} onChange={e=>field('target',e.target.value)}/></label>
        <label>Zielrichtung<select value={values.targetDirection} onChange={e=>field('targetDirection',e.target.value)}><option value="below">Bei oder unter Zielkurs</option><option value="above">Bei oder über Zielkurs</option></select></label></div>
        <label>Notiz · optional<textarea rows={3} maxLength={2000} value={values.note} onChange={e=>field('note',e.target.value)}/></label>
      </>}</div>
      {error&&<p role="alert" className="form-error">{error}</p>}
      <div className="dialog-actions"><button type="button" className="secondary" onClick={close} disabled={busy}>Abbrechen</button><button className="primary" disabled={busy}>{busy?'Wird gespeichert …':'Speichern'}</button></div>
    </form>
  </Dialog>;
}

export function Stocks({data,onChange}:{data:AppState;onChange:(data:AppState)=>void}){
  const [filter,setFilter]=useState('all'),[search,setSearch]=useState(''),[group,setGroup]=useState(''),[selected,setSelected]=useState<string|null>(null);
  const [editor,setEditor]=useState<Editor|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const lock=useRef(false);
  const ids=data.stocks.map(s=>s.id).join(',');
  const refreshed=useRef(new Map<string,number>());
  useEffect(()=>{
    if(!data.quoteProviderAvailable||!ids)return;
    const abort=new AbortController();let active=true;
    async function tick(){
      if(lock.current||document.visibilityState==='hidden')return;
      const id=ids.split(',').find(id=>Date.now()-(refreshed.current.get(id)||0)>=300_000);
      if(!id)return;
      lock.current=true;refreshed.current.set(id,Date.now());
      try{const response=await fetch('/api/stocks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'refresh',id}),signal:abort.signal});const body=await response.json();if(active){if(response.ok)onChange(body);else setError(body.error||'Kursabruf fehlgeschlagen.');}}
      catch{if(active)setError('Automatischer Kursabruf fehlgeschlagen. Erneut abrufen.');}
      finally{lock.current=false;}
    }
    void tick();const timer=setInterval(()=>void tick(),10_000);
    return()=>{active=false;clearInterval(timer);abort.abort();};
  },[ids,data.quoteProviderAvailable,onChange]);
  async function mutate(payload:Record<string,unknown>){
    if(lock.current)throw new Error('Bitte laufenden Vorgang abwarten.');
    lock.current=true;setBusy(true);setError('');
    try{
      const response=await fetch('/api/stocks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const body=await response.json();if(!response.ok)throw new Error(body.error||'Speichern fehlgeschlagen.');onChange(body);
    }finally{lock.current=false;setBusy(false);}
  }
  async function act(payload:Record<string,unknown>){try{await mutate(payload);}catch(e){setError(e instanceof Error?e.message:'Änderung fehlgeschlagen.');}}
  const groups=[...new Set(data.stocks.map(s=>s.group).filter(Boolean))].sort();
  const stock=data.stocks.find(s=>s.id===selected);
  const latest=(s:Stock)=>s.quotes.at(-1);
  const reached=(s:Stock)=>targetReached(latest(s)?.priceMicros,s.targetMicros,s.targetDirection);
  const percent=(s:Stock)=>s.quotes.length>1?changePercent(s.quotes.at(-1)!.priceMicros,s.quotes.at(-2)!.priceMicros):null;
  const source=(value:string)=>value==='twelve-data'?'Twelve Data':'Manuell';
  const visible=data.stocks.filter(s=>(filter==='all'||filter==='favorites'&&s.favorite||filter==='target'&&reached(s))&&(!group||s.group===group)&&`${s.name} ${s.symbol} ${s.exchange}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  function controls(s:Stock){return <div className="button-row"><button className={`icon-button ${s.favorite?'favorite':''}`} aria-label={`${s.name} als Favorit`} aria-pressed={s.favorite} disabled={busy} onClick={()=>void act({op:'favorite',id:s.id,favorite:!s.favorite})}><Star size={19} fill={s.favorite?'currentColor':'none'}/></button><button className="icon-button" aria-label={`${s.name} bearbeiten`} disabled={busy} onClick={()=>setEditor({kind:'stock',stock:s})}><Pencil size={16}/></button><button className="icon-button" aria-label={`${s.name} entfernen`} disabled={busy} onClick={()=>{if(confirm(`${s.name} mit Kursverlauf aus der Watchlist entfernen?`)){void act({op:'delete',id:s.id});setSelected(null);}}}><Trash2 size={16}/></button></div>;}
  return <section className="stocks-section">
    <div className="section-bar">{stock?<button className="back-link" onClick={()=>setSelected(null)}><ChevronLeft size={16}/> Alle Aktien</button>:<JellyRadio label="Aktienfilter" value={filter} onChange={setFilter} options={[{value:'all',label:'Alle'},{value:'favorites',label:'Favoriten'},{value:'target',label:'Ziel erreicht'}]}/>}
      <button className="primary" onClick={()=>setEditor({kind:'stock'})}><Plus size={17}/> Aktie hinzufügen</button></div>
    {error&&<div role="alert" className="stock-error">{error}</div>}
    {!stock&&<><div className="section-bar"><label className="inline-search"><Search size={17}/><input aria-label="Aktien suchen" placeholder="Name oder Symbol" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      {groups.length>0&&<label className="stock-group-filter"><span className="sr-only">Aktiengruppe</span><select value={group} onChange={e=>setGroup(e.target.value)}><option value="">Alle Gruppen</option>{groups.map(g=><option key={g}>{g}</option>)}</select></label>}</div>
      <div className="budget-grid stocks-grid">{visible.map(s=>{const quote=latest(s),change=percent(s);return <article key={s.id} className="panel stock-card">
        <div className="card-top"><span className="stock-symbol">{s.symbol}</span>{controls(s)}</div>
        <button className="stock-name" onClick={()=>setSelected(s.id)}>{s.name}</button>
        <span className="muted stock-meta">{[s.exchange,s.currency,s.group].filter(Boolean).join(' · ')}</span>
        <strong className="stock-price">{quote?stockMoney(quote.priceMicros,s.currency):'—'}</strong>
        <div className="stock-quote-meta">{quote?<span>{source(quote.source)} · {format(new Date(quote.asOf+'T12:00:00'),'dd.MM.yyyy')}</span>:<span>Noch kein Kurs</span>}{change!==null&&<span className={change>=0?'positive':'negative'} title="Veränderung zum vorherigen gespeicherten Eintrag">{change>0?'+':''}{change.toLocaleString('de-DE',{maximumFractionDigits:2})}%</span>}</div>
        {s.targetMicros&&<div className="stock-target"><span>Ziel {s.targetDirection==='below'?'≤':'≥'} {stockMoney(s.targetMicros,s.currency)}</span>{reached(s)&&<span className="badge positive">Erreicht</span>}</div>}
        <div className="stock-card-actions"><button className="secondary small" onClick={()=>setEditor({kind:'quote',stock:s})}>Kurs erfassen</button><button className="text-button" onClick={()=>setSelected(s.id)}>Verlauf</button></div>
        {data.quoteProviderAvailable&&<button className="text-button" disabled={busy} onClick={()=>void act({op:'refresh',id:s.id})}><RefreshCw size={14}/> Kurs abrufen</button>}
      </article>;})}</div>
      {!visible.length&&<div className="empty"><TrendingUp size={28}/><p>{data.stocks.length?'Keine passenden Aktien.':'Deine persönliche Watchlist.'}</p></div>}
    </>}
    {stock&&<article className="panel stock-detail"><div className="panel-heading"><div><h2>{stock.name}</h2><span className="muted stock-meta">{stock.symbol} · {stock.exchange||stock.currency}</span></div>{controls(stock)}</div>
      <div className="stock-detail-summary"><strong className="stock-price">{latest(stock)?stockMoney(latest(stock)!.priceMicros,stock.currency):'—'}</strong><button className="secondary" onClick={()=>setEditor({kind:'quote',stock})}>Kurs erfassen</button>{data.quoteProviderAvailable&&<button className="secondary" disabled={busy} onClick={()=>void act({op:'refresh',id:stock.id})}><RefreshCw size={15}/> Abrufen</button>}</div>
      {stock.note&&<p className="stock-note">{stock.note}</p>}
      {stock.quotes.length>1&&<div className="stock-chart" role="img" aria-label={`Gespeicherter Kursverlauf von ${stock.name} in ${stock.currency}`}><ResponsiveContainer width="100%" height="100%"><LineChart data={stock.quotes.map(q=>({date:q.asOf,price:Number(q.priceMicros)/1_000_000}))} margin={{top:20,right:25,left:15,bottom:10}}><CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="date" tick={{fill:'var(--muted)',fontSize:12}} tickFormatter={v=>format(new Date(String(v)+'T12:00:00'),'dd.MM.')}/><YAxis domain={['auto','auto']} tick={{fill:'var(--muted)',fontSize:12}} width={75}/><Tooltip contentStyle={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8}}/><Line dataKey="price" name={stock.currency} stroke="var(--accent)" dot={stock.quotes.length<30} strokeWidth={2} isAnimationActive={false}/></LineChart></ResponsiveContainer></div>}
      <div className="table-scroll"><table><caption className="sr-only">Gespeicherte Kurse in {stock.currency}</caption><thead><tr><th>Handelstag</th><th>Quelle</th><th className="right">Kurs</th><th><span className="sr-only">Aktionen</span></th></tr></thead><tbody>{[...stock.quotes].reverse().map(q=><tr key={q.id}><td>{format(new Date(q.asOf+'T12:00:00'),'dd.MM.yyyy')}</td><td className="muted">{source(q.source)}</td><td className="right amount">{stockMoney(q.priceMicros,stock.currency)}</td><td><button className="icon-button" aria-label={`Kurseintrag vom ${q.asOf} löschen`} disabled={busy} onClick={()=>{if(confirm('Diesen Kurseintrag löschen?'))void act({op:'deleteQuote',id:q.id});}}><Trash2 size={14}/></button></td></tr>)}</tbody></table>{!stock.quotes.length&&<div className="empty">Ersten Kurs erfassen.</div>}</div>
    </article>}
    {editor&&<StockEditor editor={editor} close={()=>setEditor(null)} save={async values=>{
      if(editor.kind==='quote')await mutate({op:'quote',id:editor.stock.id,price:values.price,asOf:values.asOf});
      else {const {price:_,asOf:__,...fields}=values;void _;void __;await mutate({op:editor.stock?'edit':'add',...(editor.stock?{id:editor.stock.id}:{}),...fields});}
    }}/>}
  </section>;
}
