import {csvRows} from './csv';
export {csvRows} from './csv';
import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {cents} from './finance';
import {digest,validDay} from './finance-os';
export type ImportRow={date:string;valueDate:string;amountCents:number;currency:string;payee:string;title:string;note:string;externalId:string;status:'booked'|'pending';transfer:boolean};
export type Mapping={date:string;amount:string;currency?:string;payee?:string;title?:string;note?:string;externalId?:string;status?:string;valueDate?:string};
function guessMapping(headers:string[]):Mapping|undefined {
 const find=(pattern:RegExp)=>headers.find(header=>pattern.test(header))||'';
 const date=find(/^(buchungsdatum|buchungstag|buchung|datum|booking date|bookingdate|date)$/i);
 const amount=find(/^(betrag(?:\s*\([^)]*\))?|umsatz|amount(?:\s*\([^)]*\))?|buchungsbetrag)$/i);
 if(!date||!amount)return undefined;
 return {date,amount,valueDate:find(/^(valuta|wertstellung|wertstellungsdatum|value date)$/i),currency:find(/^(währung|waehrung|currency)$/i),payee:find(/^(empfänger|auftraggeber|begünstigter|anbieter|payee|name)$/i),title:find(/^(verwendungszweck|buchungstext|purpose|bezeichnung|title)$/i),externalId:find(/^(bankreferenz|referenz|transaction id|reference|fitid|id)$/i),status:find(/^status$/i)};
}
export function bankDate(value:string){const v=value.trim();const normalized=/^\d{2}\.\d{2}\.\d{4}$/.test(v)?v.slice(6)+'-'+v.slice(3,5)+'-'+v.slice(0,2):/^\d{8}/.test(v)?v.slice(0,4)+'-'+v.slice(4,6)+'-'+v.slice(6,8):v.slice(0,10);if(!validDay(normalized))throw new Error('Ungültiges Buchungsdatum.');return normalized;}
export function bankAmount(value:string){let text=value.trim().replace(/[ €\s]/g,'');if(text.includes(','))text=text.replaceAll('.','');return cents(text);}
function record(row:Partial<ImportRow>):ImportRow{
 const result={date:bankDate(row.date||''),valueDate:row.valueDate?bankDate(row.valueDate):'',amountCents:row.amountCents||0,currency:(row.currency||'EUR').toUpperCase(),payee:(row.payee||'').slice(0,160),title:(row.title||row.payee||'Importierte Buchung').slice(0,160),note:(row.note||'').slice(0,2000),externalId:['NOTPROVIDED','NONREF','NOTAVAILABLE'].includes((row.externalId||'').toUpperCase())?'':row.externalId||'',status:row.status||'booked',transfer:row.transfer||false};
 if(!Number.isInteger(result.amountCents)||!result.amountCents||Math.abs(result.amountCents)>2_000_000_000||!/^([A-Z]{3})$/.test(result.currency)||result.externalId.length>250)throw new Error('Betrag, Währung oder Referenz ungültig.');return result;
}
type Node=Record<string,unknown>;
const object=(v:unknown):Node=>typeof v==='object'&&v!==null&&!Array.isArray(v)?v as Node:{};
const list=(v:unknown):unknown[]=>Array.isArray(v)?v:v===undefined?[]:[v];
const text=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):String(object(v)['#text']||'');
function descend(value:unknown,key:string):unknown[]{const result:unknown[]=[];if(Array.isArray(value))for(const v of value)result.push(...descend(v,key));else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value)){if(k===key)result.push(...list(v));else result.push(...descend(v,key));}return result;}
export function parseBankFile(content:string,format:'csv'|'camt'|'mt940'|'ofx',mapping?:Mapping,defaultCurrency='EUR'):{headers:string[];mapping?:Mapping;errors:{row:number;message:string}[];rows:(ImportRow&{uncertainId?:boolean})[]}{
 if(content.length>2_000_000)throw new Error('Datei darf höchstens 2 MB enthalten.');
 const rows:ImportRow[]=[],errors:{row:number;message:string}[]=[];let headers:string[]=[];
 const accept=(row:number,fn:()=>Partial<ImportRow>)=>{try{rows.push(record(fn()));}catch(e){errors.push({row,message:e instanceof Error?e.message:'Ungültige Zeile.'});}};
 if(format==='csv'){
  const parsed=csvRows(content);headers=parsed.headers;mapping=mapping||guessMapping(headers);if(!mapping)return {headers,rows,errors};
  if(!headers.includes(mapping.date)||!headers.includes(mapping.amount))throw new Error('Datum und Betrag einer vorhandenen Spalte zuordnen.');
  parsed.rows.forEach((cells,index)=>{const get=(key:keyof Mapping)=>{const column=mapping?.[key];return column?cells[headers.indexOf(column)]||'':'';};accept(index+2,()=>({date:get('date'),valueDate:get('valueDate'),amountCents:bankAmount(get('amount')),currency:get('currency')||defaultCurrency,payee:get('payee'),title:get('title'),note:get('note'),externalId:get('externalId'),status:/pending|vorgemerkt/i.test(get('status'))?'pending':'booked'}));});
 }else if(format==='camt'){
  if(/<!DOCTYPE|<!ENTITY/i.test(content))throw new Error('XML-DTDs und Entitäten sind nicht erlaubt.');
  if(XMLValidator.validate(content)!==true)throw new Error('Ungültige XML-Datei.');
  const parsed:unknown=new XMLParser({ignoreAttributes:false,removeNSPrefix:true,parseTagValue:false,processEntities:false}).parse(content);
  const entries=descend(parsed,'Ntry');if(!entries.length)throw new Error('Keine CAMT.053-Buchungen gefunden.');
  entries.forEach((value,index)=>accept(index+1,()=>{
   const n=object(value),details=descend(n,'TxDtls');if(details.length>1)throw new Error('Sammelbuchung mit mehreren Details bitte als CSV mit Einzelbeträgen importieren.');
   const detail=object(details[0]),parties=object(detail.RltdPties),payee=text(object(parties.Cdtr).Nm)||text(object(parties.Dbtr).Nm)||text(descend(detail,'Nm')[0]);
   const amount=object(n.Amt),debit=text(n.CdtDbtInd)==='DBIT';
   return {date:text(object(n.BookgDt).Dt)||text(object(n.BookgDt).DtTm),valueDate:text(object(n.ValDt).Dt)||text(object(n.ValDt).DtTm),amountCents:Math.abs(bankAmount(text(n.Amt)))*(debit?-1:1),currency:text(amount['@_Ccy'])||'EUR',payee,title:payee||text(n.AddtlNtryInf),note:descend(detail,'Ustrd').map(text).join(' '),externalId:text(n.AcctSvcrRef)||text(object(detail.Refs).AcctSvcrRef)||text(object(detail.Refs).TxId),status:/PDNG/.test(text(object(n.Sts).Cd)||text(n.Sts))?'pending':'booked'};
  }));
 }else if(format==='ofx'){
  const currency=content.match(/<CURDEF>\s*([^<\r\n]+)/i)?.[1]?.trim()||'EUR';const entries=[...content.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)];if(!entries.length)throw new Error('Keine OFX-Buchungen gefunden.');
  entries.forEach((match,index)=>accept(index+1,()=>{const get=(tag:string)=>match[1].match(new RegExp('<'+tag+'>\\s*([^<\\r\\n]+)','i'))?.[1]?.trim()||'';return {date:get('DTPOSTED'),valueDate:get('DTUSER'),amountCents:bankAmount(get('TRNAMT')),currency,payee:get('NAME'),title:get('NAME')||get('MEMO'),note:get('MEMO'),externalId:get('FITID'),transfer:get('TRNTYPE')==='XFER'};}));
 }else{
  const currency=content.match(/:60[FM]:[CD]\d{6}([A-Z]{3})/)?.[1]||'EUR';const entries=content.split(/(?=:61:)/).slice(1);if(!entries.length)throw new Error('Keine MT940-Buchungen gefunden.');
  entries.forEach((chunk,index)=>accept(index+1,()=>{const match=chunk.match(/^:61:(\d{6})(?:\d{4})?(R?[CD])(?:[A-Z])?([0-9,]+)([\s\S]*)/);if(!match)throw new Error('MT940-Buchungsformat nicht erkannt.');const year=Number(match[1].slice(0,2)),date=String(year>=70?1900+year:2000+year)+match[1].slice(2);const direction=match[2].endsWith('D')?-1:1;const reversal=match[2].startsWith('R')?-1:1;const purpose=chunk.split(':86:')[1]?.split(/\r?\n:/)[0]?.trim()||'';const ref=match[4].match(/\/\/([^\r\n]+)/)?.[1]?.trim()||'';return {date,amountCents:bankAmount(match[3])*direction*reversal,currency,title:purpose.slice(0,160)||'MT940-Buchung',note:purpose,externalId:ref==='NONREF'?'':ref};}));
 }
 if(rows.length>5000)throw new Error('Höchstens 5.000 Buchungen pro Import.');
 const counts=new Map<string,number>();return {headers,mapping,errors,rows:rows.map(row=>{const fingerprint=digest([row.date,row.amountCents,row.currency,row.payee,row.title,row.note]);const occurrence=(counts.get(fingerprint)||0)+1;counts.set(fingerprint,occurrence);return {...row,externalId:row.externalId?'bank:'+row.externalId:'file:'+fingerprint+':'+occurrence,uncertainId:!row.externalId};})};
}
