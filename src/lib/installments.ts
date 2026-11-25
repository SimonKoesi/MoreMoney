export type Purchase = {totalCents:number;downPaymentCents:number;rateCents:number;firstDueDate:string;principalCents?:number|null;interestBps?:number|null;termMonths?:number|null};
export type Due={index:number;date:string;amountCents:number;interestCents?:number;principalCents?:number;balanceCents?:number};
export function installmentSchedule(p:Purchase):Due[]{
  if(p.principalCents!=null)return loanSchedule(p.principalCents,p.interestBps??0,p.termMonths??0,p.firstDueDate);
  const {totalCents:total,downPaymentCents:down,rateCents:rate}=p;
  if(![total,down,rate].every(Number.isSafeInteger)||total<=0||total>2_000_000_000||down<0||down>=total||rate<=0||rate>2_000_000_000)throw new Error('Gesamtpreis, Anzahlung und Rate prüfen.');
  const count=Math.ceil((total-down)/rate);
  if(count>600)throw new Error('Höchstens 600 Monatsraten möglich.');
  const origin=new Date(p.firstDueDate+'T12:00:00Z');
  if(isNaN(+origin)||origin.toISOString().slice(0,10)!==p.firstDueDate)throw new Error('Gültige erste Fälligkeit wählen.');
  const rows:{index:number;date:string;amountCents:number}[]=down?[{index:0,date:p.firstDueDate,amountCents:down}]:[];
  for(let n=0;n<count;n++){
    const month=new Date(Date.UTC(origin.getUTCFullYear(),origin.getUTCMonth()+n,1,12));
    const last=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate();
    month.setUTCDate(Math.min(origin.getUTCDate(),last));
    rows.push({index:n+1,date:month.toISOString().slice(0,10),amountCents:Math.min(rate,total-down-n*rate)});
  }
  return rows;
}

// Fixed nominal annual rate, monthly interest rounded to cents. No fees/day-count conventions.
export function loanSchedule(principal:number,interestBps:number,months:number,firstDueDate:string):Due[]{
 if(![principal,interestBps,months].every(Number.isSafeInteger)||principal<=0||principal>2_000_000_000||interestBps<0||interestBps>10000||months<1||months>600)throw new Error('Darlehensbetrag, Sollzins (0–100 %) und Laufzeit (1–600 Monate) prüfen.');
 const interest=(balance:number)=>Number((BigInt(balance)*BigInt(interestBps)+60_000n)/120_000n);
 const remaining=(rate:number)=>{let balance=principal;for(let n=0;n<months&&balance>0;n++){const charge=interest(balance);if(rate<=charge)return 1;balance=Math.max(0,balance+charge-rate);}return balance;};
 let low=1,high=principal+interest(principal);
 while(low<high){const mid=Math.floor((low+high)/2);if(remaining(mid)===0)high=mid;else low=mid+1;}
 const dates=installmentSchedule({totalCents:months,rateCents:1,downPaymentCents:0,firstDueDate});
 let balance=principal;
 const rows=[];
 for(let n=0;n<months&&balance>0;n++){
  const interestCents=interest(balance),amountCents=Math.min(low,balance+interestCents),principalCents=amountCents-interestCents;
  balance-=principalCents;
  rows.push({index:n+1,date:dates[n].date,amountCents,interestCents,principalCents,balanceCents:balance});
 }
 if(rows.reduce((sum,row)=>sum+row.amountCents,0)>2_000_000_000)throw new Error('Gesamtrückzahlung zu groß.');
 return rows;
}
