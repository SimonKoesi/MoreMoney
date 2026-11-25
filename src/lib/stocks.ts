import { z } from 'zod';
export const currencies=['EUR','USD','GBP','CHF'] as const;
export function priceMicros(value:string):string {
  const normalized=value.trim();
  if(!/^\d{1,9}(?:[.,]\d{1,6})?$/.test(normalized))throw new Error('Kurs mit maximal sechs Nachkommastellen eingeben.');
  const [whole,fraction='']=normalized.split(/[.,]/);
  const micros=BigInt(whole)*1_000_000n+BigInt(fraction.padEnd(6,'0'));
  if(micros<=0n)throw new Error('Kurs muss größer als null sein.');
  return micros.toString();
}
export function priceInput(micros:string|null){
  if(!micros)return '';
  const value=BigInt(micros);
  const fraction=(value%1_000_000n).toString().padStart(6,'0').replace(/0+$/,'');
  return (value/1_000_000n).toString()+(fraction?','+fraction:'');
}
export function stockMoney(micros:string,currency:string){
  return new Intl.NumberFormat('de-DE',{style:'currency',currency,minimumFractionDigits:2,maximumFractionDigits:6}).format(Number(micros)/1_000_000);
}
export function changePercent(current:string,previous:string){
  const before=BigInt(previous);
  if(before<=0n)return null;
  const numerator=(BigInt(current)-before)*10_000n;
  const basisPoints=((numerator<0n?-numerator:numerator)+before/2n)/before*(numerator<0n?-1n:1n);
  return Number(basisPoints)/100;
}
export function targetReached(price:string|undefined,target:string|null,direction:string){
  if(!price||!target)return false;
  return direction==='below'?BigInt(price)<=BigInt(target):BigInt(price)>=BigInt(target);
}
const id=z.string().uuid();
const day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value=>{
  const parsed=new Date(value+'T12:00:00Z');
  return !isNaN(+parsed)&&parsed.toISOString().slice(0,10)===value&&value<=new Date().toISOString().slice(0,10);
},'Gültigen heutigen oder vergangenen Handelstag wählen.');
const quotePrice=z.string().refine(v=>{try{priceMicros(v);return true;}catch{return false;}},'Gültigen positiven Kurs eingeben.');
const stockFields={name:z.string().trim().min(1).max(120),symbol:z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9.^:-]{0,24}$/),exchange:z.string().trim().toUpperCase().regex(/^[A-Z0-9 ._-]{0,40}$/).default(''),currency:z.enum(currencies),group:z.string().trim().max(60).default(''),note:z.string().max(2000).default(''),target:z.union([z.literal(''),quotePrice]).default(''),targetDirection:z.enum(['below','above']).default('below')};
export const stockCommand=z.discriminatedUnion('op',[
  z.object({op:z.literal('add'),...stockFields}),
  z.object({op:z.literal('edit'),id,...stockFields}),
  z.object({op:z.literal('favorite'),id,favorite:z.boolean()}),
  z.object({op:z.literal('delete'),id}),
  z.object({op:z.literal('quote'),id,price:quotePrice,asOf:day}),
  z.object({op:z.literal('deleteQuote'),id}),
  z.object({op:z.literal('refresh'),id})
]);

export function parseProviderQuote(value:unknown,stock:{symbol:string;exchange:string;currency:string}){
  const parsed=z.object({symbol:z.string(),exchange:z.string(),currency:z.string(),datetime:z.string(),close:z.string()}).safeParse(value);
  if(!parsed.success)throw new Error('Keine gültigen Kursdaten erhalten. Zugang und Börsenabdeckung prüfen.');
  const data=parsed.data;
  if(data.symbol.toUpperCase()!==stock.symbol||data.currency!==stock.currency||(stock.exchange&&data.exchange.toUpperCase()!==stock.exchange))throw new Error('Kursdaten passen nicht zu Symbol, Börse oder Währung.');
  const asOf=day.parse(data.datetime.slice(0,10));
  return {priceMicros:priceMicros(data.close),asOf};
}

export type SecuritySuggestion={symbol:string;name:string;exchange:string;currency:typeof currencies[number];type:string};
export function parseSuggestions(input:unknown):SecuritySuggestion[]{
 const reply=z.object({data:z.array(z.object({symbol:z.string().max(25),instrument_name:z.string().max(120),exchange:z.string().max(40),currency:z.string(),instrument_type:z.string()})).max(100)}).parse(input);
 const seen=new Set<string>();
 return reply.data.filter(v=>['Common Stock','ETF','REIT','Depositary Receipt'].includes(v.instrument_type)&&currencies.includes(v.currency as typeof currencies[number])&&/^[A-Z0-9][A-Z0-9.^:-]{0,24}$/.test(v.symbol)&&/^[A-Z0-9 ._-]{0,40}$/i.test(v.exchange)).flatMap(v=>{const key=v.symbol+':'+v.exchange+':'+v.currency;if(seen.has(key))return [];seen.add(key);return [{symbol:v.symbol,name:v.instrument_name,exchange:v.exchange.toUpperCase(),currency:v.currency as typeof currencies[number],type:v.instrument_type}];}).slice(0,12);
}
