'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {FinanceState} from '@/lib/finance-state';
import {EntityEditor,type EntitySpec} from './finance-editor';
import {Subscriptions} from './subscriptions';
import {Wealth} from './wealth';
import {Bank} from './bank';
import {PrivacyCenter} from './privacy-center';
export function FinanceModules({module,onCoreChange,detail}:{module:string;detail?:string|null;onCoreChange:()=>Promise<void>}){
 const [data,setData]=useState<FinanceState|null>(null),[error,setError]=useState(''),[spec,setSpec]=useState<EntitySpec|null>(null),[busy,setBusy]=useState(false);const lock=useRef(false);
 const refresh=useCallback(async()=>{const response=await fetch('/api/finance',{cache:'no-store'});if(!response.ok){if(response.status===401)window.dispatchEvent(new Event('moremoney-security'));throw new Error('Finanzmodule konnten nicht geladen werden.');}setData(await response.json());await onCoreChange();},[onCoreChange]);
 useEffect(()=>{const abort=new AbortController();fetch('/api/finance',{signal:abort.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error('Finanzmodule konnten nicht geladen werden.');setData(await response.json());}).catch(e=>{if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Laden fehlgeschlagen.');});return()=>abort.abort();},[]);
 async function save(command:Record<string,unknown>){if(lock.current)throw new Error('Laufenden Vorgang abwarten.');lock.current=true;setBusy(true);setError('');try{let payload=command;if(['fx','goal','account','categorize','manualTransaction'].includes(String(command.op))&&command.data)payload={op:command.op,...command.data as Record<string,unknown>};const response=await fetch('/api/finance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const body=await response.json();if(!response.ok)throw new Error(body.error||'Speichern fehlgeschlagen.');if(body.saved){setError(body.error);return;}setData(body);try{await onCoreChange();}catch{setError('Gespeichert. Den Hauptüberblick bitte erneut laden.');}}catch(e){setError(e instanceof Error?e.message:'Speichern fehlgeschlagen.');throw e;}finally{lock.current=false;setBusy(false);}}
 if(!data)return <section className="panel finance-card" aria-busy={!error}>{error?<><p role="alert">{error}</p><button className="secondary" onClick={()=>{setError('');void refresh().catch(e=>setError(e.message));}}>Erneut versuchen</button></>:<div className="skeleton"/>}</section>;
 const props={data,save,edit:setSpec,refresh};
 return <div aria-busy={busy}>{error&&<div role="alert" className="form-error">{error}<button className="secondary" onClick={()=>void refresh().then(()=>setError('')).catch(()=>setError('Erneutes Laden fehlgeschlagen.'))}>Erneut laden</button></div>}{module==='subscriptions'?<Subscriptions {...props}/>:module==='worth'?<Wealth {...props}/>:module==='bank'?<Bank key={detail??'accounts'} {...props} initialTab={detail==='quality'?'quality':'accounts'}/>:<PrivacyCenter {...props}/>}{spec&&<EntityEditor spec={spec} close={()=>setSpec(null)} save={save}/>}</div>;
}
