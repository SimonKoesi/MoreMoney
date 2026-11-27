import { openBankingState } from './open-banking';

export function bankConfiguration(){
 try{
  const state=openBankingState();
  const connected=state.links.some(link=>!link.expired);
  return {configured:state.configured,provider:state.configured?'Enable Banking':null,environment:state.environment,readOnly:true,status:!state.configured?'Nicht eingerichtet':state.environment==='SANDBOX'?'Testumgebung':connected?'Verbunden':'Freigabe erforderlich'};
 }catch{return {configured:false,provider:null,environment:null,readOnly:true,status:'Konfiguration nicht verfügbar'};}
}
