import {sameOrigin} from '@/lib/validation';
import {parseSuggestions} from '@/lib/stocks';
export const runtime='nodejs';
let last=0;
export async function GET(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Anfrage nicht erlaubt.'},{status:403});
 const query=new URL(request.url).searchParams.get('q')?.trim()||'';
 if(query.length<2||query.length>100)return Response.json({results:[]});
 const key=process.env.MOREMONEY_TWELVE_DATA_KEY;
 if(!key)return Response.json({error:'Für die Namenssuche einen eigenen Kursanbieter-Zugang einrichten.'},{status:400});
 if(Date.now()-last<300)return Response.json({error:'Kurz warten und erneut suchen.'},{status:429});last=Date.now();
 try{
  const url=new URL('https://api.twelvedata.com/symbol_search');url.searchParams.set('symbol',query);url.searchParams.set('outputsize','12');url.searchParams.set('apikey',key);
  const response=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12_000)});
  if(!response.ok)throw new Error();
  const body=await response.text();if(body.length>100_000)throw new Error();
  return Response.json({results:parseSuggestions(JSON.parse(body))},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Suche momentan nicht verfügbar. Zugang und Anbieterlimit prüfen.'},{status:502});}
}
