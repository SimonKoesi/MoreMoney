import {addDays,addMonths,berlinDay,validDay} from './calendar';
import {frac,round} from './exact';
export type SavingPlan={savedCents:number;targetCents:number;monthlyRateCents:number;startDate:string;targetDate:string;interval:string;interestBps:number;status:string};
function validate(p:SavingPlan){if(![p.savedCents,p.targetCents,p.monthlyRateCents,p.interestBps].every(Number.isSafeInteger)||p.savedCents<0||p.savedCents>2_000_000_000||p.targetCents<=0||p.targetCents>2_000_000_000||p.monthlyRateCents<0||p.monthlyRateCents>2_000_000_000||p.interestBps<0||p.interestBps>10000||!validDay(p.startDate)||p.targetDate&&!validDay(p.targetDate))throw new Error('Sparplanwerte prüfen.');}
function nextPayment(start:string,interval:string,index:number){const month:Record<string,number>={monthly:1,quarterly:3,halfyearly:6,yearly:12};return interval==='weekly'?addDays(start,index*7):addMonths(start,index*(month[interval]||1));}
export function savingsProjection(plan:SavingPlan,today=berlinDay()){
 validate(plan);const rest=Math.max(0,plan.targetCents-plan.savedCents);const progress=Math.min(10000,Math.floor(plan.savedCents*10000/plan.targetCents));
 if(!rest)return {progressBps:progress,remainingCents:0,months:0,reachedAt:today,requiredRateCents:0,status:'reached',interestCents:0,contributionCents:0,path:[{date:today,value:plan.savedCents,contributed:0,interest:0}]};
 const max=addMonths(today,600);const dates:string[]=[];let index=0,date=plan.startDate;
 while(date<=max&&index<40000){if(date>today)dates.push(date);index++;date=nextPayment(plan.startDate,plan.interval,index);}
 function project(rate:number,until=max,stopAtTarget=true){let saved=plan.savedCents,interest=0,contributed=0;const path=[{date:today,value:saved,contributed,interest}];let payment=0;
  if(!rate&&!plan.interestBps)return {saved,interest,contributed,reachedAt:null,path};
  for(let month=0;month<600;month++){
   const beginning=addMonths(today.slice(0,7)+'-01',month),next=addMonths(beginning,1),end=addDays(next,-1);if(beginning>until)break;const interestBase=saved;
   while(payment<dates.length&&dates[payment]<=end&&dates[payment]<=until){saved+=rate;contributed+=rate;if(rate)path.push({date:dates[payment],value:saved,contributed,interest});payment++;if(stopAtTarget&&saved>=plan.targetCents)return {saved,interest,contributed,reachedAt:dates[payment-1],path};}
   if(end<=until&&end>today){const gain=round(frac(BigInt(interestBase)*BigInt(plan.interestBps),120000));saved+=gain;interest+=gain;if(gain)path.push({date:end,value:saved,contributed,interest});if(stopAtTarget&&saved>=plan.targetCents)return {saved,interest,contributed,reachedAt:end,path};}
   if(!Number.isSafeInteger(saved)||Math.abs(saved)>Number.MAX_SAFE_INTEGER/2)throw new Error('Prognose überschreitet den Wertebereich.');
  }
  return {saved,interest,contributed,reachedAt:null,path};
 }
 const projected=plan.status==='paused'||plan.status==='archived'||plan.status==='completed'?{saved:plan.savedCents,interest:0,contributed:0,reachedAt:null,path:[{date:today,value:plan.savedCents,contributed:0,interest:0}]}:project(plan.monthlyRateCents);
 let required:number|null=null;
 if(plan.targetDate&&plan.targetDate>=today&&plan.targetDate<=max){
  if(project(0,plan.targetDate).saved>=plan.targetCents)required=0;
  else if(dates.some(date=>date<=plan.targetDate)){let low=1,high=plan.targetCents;while(low<high){const mid=Math.floor((low+high)/2);if(project(mid,plan.targetDate).saved>=plan.targetCents)high=mid;else low=mid+1;}required=low;}
 }
 const months=projected.reachedAt?Math.max(0,(Number(projected.reachedAt.slice(0,4))-Number(today.slice(0,4)))*12+Number(projected.reachedAt.slice(5,7))-Number(today.slice(5,7))):null;
 const status=plan.status==='paused'||plan.status==='archived'?plan.status:!plan.monthlyRateCents&&!plan.interestBps?'rate-missing':plan.targetDate&&plan.targetDate<today?'behind':plan.targetDate&&projected.reachedAt?projected.reachedAt<plan.targetDate?'ahead':projected.reachedAt>plan.targetDate?'behind':'on-track':projected.reachedAt?'on-track':'unknown';
 return {progressBps:progress,remainingCents:rest,months,reachedAt:projected.reachedAt,requiredRateCents:required,status,interestCents:projected.interest,contributionCents:projected.contributed,path:projected.path};
}
export function distributeSavings(total:number,goals:{id:string;remainingCents:number;priority:number;percent?:number;targetDate?:string}[],mode:'equal'|'priority'|'deadline'|'need'|'percent'){
 if(!Number.isSafeInteger(total)||total<0||total>2_000_000_000)throw new Error('Verteilungsbetrag prüfen.');
 const active=goals.filter(g=>g.remainingCents>0);
 const deadlines=[...new Set(active.flatMap(g=>g.targetDate?[g.targetDate]:[]))].sort();
 const weighted=active.map(goal=>{
  let weight=1;
  if(mode==='priority')weight=Math.max(1,6-goal.priority);
  if(mode==='deadline'&&goal.targetDate)weight=deadlines.length-deadlines.indexOf(goal.targetDate)+1;
  if(mode==='need')weight=goal.remainingCents;
  if(mode==='percent')weight=Math.max(0,goal.percent||0);
  return {...goal,weight,amountCents:0};
 });
 if(mode==='percent'&&weighted.reduce((sum,g)=>sum+g.weight,0)!==100)throw new Error('Prozentanteile müssen zusammen 100 ergeben.');
 let left=total;
 while(left>0){
  const eligible=weighted.filter(g=>g.weight&&g.amountCents<g.remainingCents);
  if(!eligible.length)break;
  const weightSum=BigInt(eligible.reduce((sum,g)=>sum+g.weight,0));
  const share=BigInt(left);
  let rounding=left;
  const ranked=eligible.map(goal=>{
   const exact=share*BigInt(goal.weight);
   const whole=Number(exact/weightSum);
   const granted=Math.min(goal.remainingCents-goal.amountCents,whole);
   rounding-=whole;
   goal.amountCents+=granted;
   left-=granted;
   return {goal,remainder:exact%weightSum};
  }).filter(row=>row.remainder>0n).sort((a,b)=>a.remainder>b.remainder?-1:a.remainder<b.remainder?1:0);
  for(const {goal} of ranked){
   if(!rounding)break;
   if(goal.amountCents<goal.remainingCents){goal.amountCents++;left--;rounding--;}
  }
  if(mode==='percent')break;
 }
 return {allocations:weighted.map(({id,amountCents})=>({id,amountCents})),unallocatedCents:left};
}
export function wealthProjection(start:number,monthly:number,years:number,rateBps:number,inflationBps:number){
 if(![start,monthly,years,rateBps,inflationBps].every(Number.isSafeInteger)||monthly<0||years<1||years>50||Math.abs(rateBps)>10000||inflationBps<0||inflationBps>5000)throw new Error('Modellannahmen prüfen.');let value=start;
 for(let month=0;month<years*12;month++){value+=round(frac(BigInt(Math.max(0,value))*BigInt(rateBps),120000))+monthly;if(!Number.isSafeInteger(value))throw new Error('Prognose außerhalb des Wertebereichs.');}
 let real=value;for(let year=0;year<years;year++)real=round(frac(BigInt(real)*10000n,10000+inflationBps));return {nominalCents:value,realCents:real};
}
