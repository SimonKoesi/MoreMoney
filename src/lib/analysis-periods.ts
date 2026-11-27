import {addDays,addMonths,berlinDay,validDay} from './calendar';
export function analysisPeriod(period='month',customFrom='',customTo='',today=berlinDay()){
 const month=today.slice(0,7)+'-01';let from=month,to=today,previousFrom=addMonths(month,-1),previousTo=addMonths(today,-1),comparable=true;
 if(period==='week'){const d=new Date(today+'T12:00:00Z');from=addDays(today,-((d.getUTCDay()+6)%7));previousFrom=addDays(from,-7);previousTo=addDays(today,-7);}
 else if(period==='lastMonth'){from=addMonths(month,-1);to=addDays(month,-1);previousFrom=addMonths(from,-1);previousTo=addDays(from,-1);}
 else if(period==='three'||period==='six'){const n=period==='three'?3:6;from=addMonths(month,1-n);previousFrom=addMonths(from,-n);previousTo=addMonths(today,-n);}
 else if(period==='year'){from=today.slice(0,4)+'-01-01';previousFrom=String(Number(today.slice(0,4))-1)+'-01-01';previousTo=addMonths(today,-12);}
 else if(period==='lastYear'){from=String(Number(today.slice(0,4))-1)+'-01-01';to=from.slice(0,4)+'-12-31';previousFrom=String(Number(from.slice(0,4))-1)+'-01-01';previousTo=previousFrom.slice(0,4)+'-12-31';}
 else if(period==='all'){from='1900-01-01';previousFrom='1900-01-01';previousTo='1900-01-01';comparable=false;}
 else if(period==='custom'){if(!validDay(customFrom)||!validDay(customTo)||customFrom>customTo)throw new Error('Gültigen Zeitraum wählen.');from=customFrom;to=customTo;const days=Math.round((+new Date(to)-+new Date(from))/86400000)+1;previousTo=addDays(from,-1);previousFrom=addDays(previousTo,1-days);}
 const days=Math.round((+new Date(to)-+new Date(from))/86400000)+1,previousDays=Math.round((+new Date(previousTo)-+new Date(previousFrom))/86400000)+1;
 if(!['lastMonth','lastYear'].includes(period)&&days!==previousDays)comparable=false;
 return {from,to,previousFrom,previousTo,days,previousDays,comparable};
}
export function bucketKey(day:string,group:'day'|'week'|'month'|'year'){
 if(group==='year')return day.slice(0,4);if(group==='month')return day.slice(0,7);if(group==='day')return day;
 const d=new Date(day+'T12:00:00Z'),weekday=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()+3-weekday);const year=d.getUTCFullYear(),first=new Date(Date.UTC(year,0,4,12)),firstWeekday=(first.getUTCDay()+6)%7;first.setUTCDate(first.getUTCDate()+3-firstWeekday);const week=1+Math.round((+d-+first)/(7*86400000));return year+'-W'+String(week).padStart(2,'0');
}
