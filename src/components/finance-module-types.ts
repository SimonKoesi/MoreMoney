import type {FinanceState} from '@/lib/finance-state';
import type {EntitySpec} from './finance-editor';
export type ModuleProps={data:FinanceState;save:(command:Record<string,unknown>)=>Promise<void>;edit:(spec:EntitySpec)=>void;refresh:()=>Promise<void>};
export const uiDay=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const currencyMoney=(amount:number,currency='EUR')=>new Intl.NumberFormat('de-DE',{style:'currency',currency}).format(amount/100);
export const dateLabel=(value:string)=>value?new Intl.DateTimeFormat('de-DE').format(new Date(value+'T12:00:00Z')):'—';
export function download(filename:string,content:string|Blob,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export const options=(values:string[])=>values.map(value=>({value,label:value}));
