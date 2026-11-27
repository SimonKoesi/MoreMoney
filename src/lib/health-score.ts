import {frac,plus,times,divide,compare,bound,round,float,interpolate,exactJSON,type Fraction} from './exact';
export const HEALTH_MODEL={version:'moremoney-health-1.0',weights:{liquidity:25,cashflow:25,debt:20,budget:15,future:10,obligations:5},curves:{liquidity:[[0,0],[50,15],[100,30],[200,50],[300,70],[400,82],[500,92],[600,100]],surplus:[[-1000,0],[0,25],[500,45],[1000,65],[1500,80],[2000,90],[3000,100]],debt:[[0,100],[1000,95],[2000,80],[3000,60],[4000,35],[5000,15],[6000,0]],fixed:[[0,100],[3000,100],[4000,90],[5000,75],[6000,55],[7500,25],[9000,0]],savings:[[0,0],[500,25],[1000,50],[1500,70],[2000,90],[2500,100]]}} as const;
export type HealthMetric={value:Fraction|null;reason:string;evidence:string[]};
export type HealthInput={liquidityMonths:HealthMetric;surplusBps:HealthMetric;cashflowStability:HealthMetric;savingsBps:HealthMetric;debtServiceBps:HealthMetric;highInterestBurden:HealthMetric;arrears:HealthMetric;fixedBps:HealthMetric;budgetAdherence:HealthMetric;expenseStability:HealthMetric;goalCoverage:HealthMetric;goalExecution:HealthMetric;longTermPlanning:HealthMetric;obligationCoverage:HealthMetric};
const metric=(name:keyof HealthInput,weight:number,curve?:keyof typeof HEALTH_MODEL.curves)=>({name,weight,curve});
const categories={liquidity:[metric('liquidityMonths',100,'liquidity')],cashflow:[metric('surplusBps',55,'surplus'),metric('cashflowStability',25),metric('savingsBps',20,'savings')],debt:[metric('debtServiceBps',60,'debt'),metric('highInterestBurden',25),metric('arrears',15)],budget:[metric('fixedBps',40,'fixed'),metric('budgetAdherence',35),metric('expenseStability',25)],future:[metric('goalCoverage',40),metric('goalExecution',35),metric('longTermPlanning',25)],obligations:[metric('obligationCoverage',100)]} as const;
export function calculateHealth(input:HealthInput){
 let weighted=frac(0),coverage=frac(0);const details=[];
 for(const [category,metrics] of Object.entries(categories)){
  const outer=HEALTH_MODEL.weights[category as keyof typeof categories];let known=frac(0),total=frac(0);const pieces=[];
  for(const {name,weight,curve} of metrics){const entry=input[name];const points=entry.value===null?null:bound(curve?interpolate(entry.value,HEALTH_MODEL.curves[curve]):entry.value);const effective=frac(outer*weight,100);
   if(points!==null){known=plus(known,effective);total=plus(total,times(points,effective));}
   pieces.push({metric:name,weight,available:points!==null,input:entry.value?exactJSON(entry.value):null,points:points?exactJSON(points):null,displayPoints:points?round(points):null,reason:entry.reason,evidence:entry.evidence,curve:curve||null});
  }
  coverage=plus(coverage,known);weighted=plus(weighted,total);const score=known.n?divide(total,known):null;
  details.push({category,plannedWeight:outer,availableWeight:exactJSON(known),coverage:float(known)/outer*100,exact:score?exactJSON(score):null,displayScore:score?round(score):null,metrics:pieces});
 }
 const exact=coverage.n?divide(weighted,coverage):null;const available=compare(coverage,frac(50))>=0;
 const display=exact&&available?round(exact):null;
 return {version:HEALTH_MODEL.version,score:display,exact:exact&&available?exactJSON(exact):null,coverage:float(coverage),exactCoverage:exactJSON(coverage),status:!available?'insufficient':compare(coverage,frac(80))<0?'provisional':'regular',classification:display===null?'Noch keine belastbare Gesamtbewertung':display<20?'Kritischer Handlungsbedarf':display<40?'Finanziell angespannt':display<60?'Verbesserungspotenzial':display<75?'Solide':display<90?'Sehr stabil':'Besonders widerstandsf?hig',details};
}
export function emptyHealthInput(reason='Noch keine best?tigten Daten'):HealthInput{
 const empty=():HealthMetric=>({value:null,reason,evidence:[]});
 return {liquidityMonths:empty(),surplusBps:empty(),cashflowStability:empty(),savingsBps:empty(),debtServiceBps:empty(),highInterestBurden:empty(),arrears:empty(),fixedBps:empty(),budgetAdherence:empty(),expenseStability:empty(),goalCoverage:empty(),goalExecution:empty(),longTermPlanning:empty(),obligationCoverage:empty()};
}
