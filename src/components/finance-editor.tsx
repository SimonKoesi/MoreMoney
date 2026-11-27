'use client';
import {useId,useRef,useState} from 'react';
import {Dialog} from './ui/dialog';
import {IconPicker} from './ui/icon-picker';
import {SubscriptionMark,subscriptionLogoUrl} from './subscription-mark';
import {quantityInput,quantityMicros} from '@/lib/quantity';
import {cents} from '@/lib/finance';
export type EditorField={key:string;label:string;kind?:'money'|'number'|'date'|'checkbox'|'textarea'|'select'|'url'|'quantity'|'color'|'icon'|'category'|'logo';options?:{value:string;label:string}[];optional?:boolean;group?:string;mustCheck?:boolean};
export type EntitySpec={title:string;op:string;initial:Record<string,unknown>;fields:EditorField[]};
export function EntityEditor({spec,save,close}:{spec:EntitySpec;save:(data:Record<string,unknown>)=>Promise<void>;close:()=>void}){
 const [values,setValues]=useState<Record<string,string|boolean>>(()=>Object.fromEntries(spec.fields.map(field=>{const value=spec.initial[field.key];return [field.key,value===null&&field.optional?'':field.kind==='checkbox'?Boolean(value):field.kind==='money'?String(Number(value||0)/100):field.kind==='quantity'?quantityInput(String(value||'1000000')):value===null?'':String(value??'')];})));
 const draft=useRef<Record<string,unknown>>({...spec.initial,id:spec.initial.id||crypto.randomUUID()});
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);const lock=useRef(false);
 const fieldId=useId();
 const [logo,setLogo]=useState<string|null|undefined>(undefined);
 const [logoError,setLogoError]=useState('');
 const [readingLogo,setReadingLogo]=useState(false);
 const logoRead=useRef(0);
 const savedLogo=subscriptionLogoUrl(String(spec.initial.id??''),typeof spec.initial.logoVersion==='string'?spec.initial.logoVersion:null);
 const preview=logo===undefined?savedLogo:logo??'';
 function readLogo(file:File){
  const generation=++logoRead.current;
  setLogoError('');
  setReadingLogo(false);
  if(file.size>250000||!['image/png','image/jpeg','image/webp'].includes(file.type)){
   setLogoError('PNG, JPEG oder WebP bis 250 KB wählen.');
   return;
  }
  setReadingLogo(true);
  const reader=new FileReader();
  reader.onload=()=>{if(generation===logoRead.current){setLogo(String(reader.result));setReadingLogo(false);}};
  reader.onerror=()=>{if(generation===logoRead.current){setLogoError('Datei konnte nicht gelesen werden.');setReadingLogo(false);}};
  reader.readAsDataURL(file);
 }

 const input=(field:EditorField)=>{const value=values[field.key];if(field.kind==='logo')return <div key={field.key} className="subscription-logo-field">
  <SubscriptionMark icon={String(values.icon||'repeat')} src={preview}/>
  <label>{field.label}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event=>{const file=event.currentTarget.files?.[0];if(file)readLogo(file);event.currentTarget.value='';}}/></label>
  {preview&&<button className="text-button" type="button" disabled={busy} onClick={()=>{logoRead.current++;setReadingLogo(false);setLogo(null);setLogoError('');}}>Logo entfernen</button>}
  {logoError&&<div><p className="form-error" role="alert">{logoError}</p><button className="text-button" type="button" onClick={()=>setLogoError('')}>Dateiauswahl zurücksetzen</button></div>}
 </div>;if(field.kind==='icon')return <IconPicker key={field.key} label={field.label} value={String(value)} options={field.options} onChange={value=>setValues({...values,[field.key]:value})}/>;return <label key={field.key}>{field.kind==='checkbox'?<><input type="checkbox" required={field.mustCheck} checked={Boolean(value)} onChange={e=>setValues({...values,[field.key]:e.target.checked})}/>{field.label}</>:<>{field.label}{field.kind==='select'?<select aria-label={field.label} value={String(value)} onChange={e=>setValues({...values,[field.key]:e.target.value})} required={!field.optional}>{field.optional&&<option value="">Keine Zuordnung</option>}{field.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:field.kind==='category'?<><input required={!field.optional} list={fieldId+field.key} value={String(value)} onChange={e=>setValues({...values,[field.key]:e.target.value})} maxLength={100}/><datalist id={fieldId+field.key}>{field.options?.map(o=><option key={o.value} value={o.value}/>)}</datalist></>:field.kind==='textarea'?<textarea rows={3} value={String(value)} onChange={e=>setValues({...values,[field.key]:e.target.value})} maxLength={2000}/>:<input required={!field.optional} type={field.kind==='date'?'date':field.kind==='number'?'number':field.kind==='url'?'url':field.kind==='color'?'color':'text'} inputMode={field.kind==='money'||field.kind==='quantity'?'decimal':undefined} value={String(value)} onChange={e=>setValues({...values,[field.key]:e.target.value})} maxLength={300}/>}</>}</label>;};
 const groups=[...new Set(spec.fields.map(f=>f.group||''))];
 return <Dialog title={spec.title} onClose={()=>{if(!lock.current)close();}}><form onInvalidCapture={event=>{const details=(event.target as HTMLElement).closest('details');if(details)details.open=true;}} onSubmit={async event=>{event.preventDefault();if(lock.current||readingLogo||logoError)return;lock.current=true;setBusy(true);setError('');try{const data={...draft.current};for(const field of spec.fields){if(field.kind==='logo'){if(logo!==undefined)data.logoUpload=logo===null?null:logo.split(',',2)[1];continue;}const value=values[field.key];data[field.key]=value===''&&field.optional&&(field.kind==='select'||spec.initial[field.key]===null)?null:field.kind==='money'?cents(String(value)):field.kind==='quantity'?quantityMicros(String(value)):field.kind==='number'?Number(value):field.kind==='checkbox'?Boolean(value):value===''&&spec.initial[field.key]===null?null:value;}await save({op:spec.op,data});close();}catch(e){setError(e instanceof Error?e.message:'Speichern fehlgeschlagen.');}finally{lock.current=false;setBusy(false);}}}>
  {groups.map(group=>group?<details key={group} className="editor-group"><summary>{group}</summary><div className="form-fields">{spec.fields.filter(f=>f.group===group).map(input)}</div></details>:<div key="main" className="form-fields">{spec.fields.filter(f=>!f.group).map(input)}</div>)}
  {error&&<p role="alert" className="form-error">{error}</p>}<div className="dialog-actions"><button type="button" className="secondary" disabled={busy} onClick={close}>Abbrechen</button><button className="primary" disabled={busy||readingLogo||!!logoError}>{busy?'Wird gespeichert …':'Speichern'}</button></div>
 </form></Dialog>;
}
