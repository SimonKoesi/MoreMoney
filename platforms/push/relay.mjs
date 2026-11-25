import { createServer } from 'node:http';
import { connect } from 'node:http2';
import { createCipheriv, createDecipheriv, createHash, createPrivateKey, randomBytes, sign, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const symbolPattern = /^[A-Za-z0-9._:/-]{1,32}$/;
const exchangePattern = /^[A-Za-z0-9 ._/&()-]{0,60}$/;
const idPattern = /^[0-9a-f-]{36}$/i;
const tokenPattern = /^(?:[0-9a-f]{2}){16,256}$/i;
const microsPattern = /^[1-9]\d{0,17}$/;

export function parseRegistration(body) {
  if (!body || typeof body.token !== 'string' || !tokenPattern.test(body.token) || !Array.isArray(body.rules) || body.rules.length>30) throw new Error('Invalid registration');
  const seen = new Set();
  const rules = body.rules.map(rule=>{
    if (!rule || typeof rule.id!=='string' || !idPattern.test(rule.id) || seen.has(rule.id) ||
      typeof rule.symbol!=='string' || !symbolPattern.test(rule.symbol) || typeof rule.exchange!=='string' || !exchangePattern.test(rule.exchange) ||
      !['EUR','USD','GBP','CHF'].includes(rule.currency) || typeof rule.target!=='string' || !microsPattern.test(rule.target) ||
      typeof rule.below!=='boolean' || !Number.isSafeInteger(rule.since) || rule.since<0 || rule.since>Math.floor(Date.now()/1000)+300) throw new Error('Invalid rule');
    seen.add(rule.id);
    return {id:rule.id,symbol:rule.symbol.toUpperCase(),exchange:rule.exchange,currency:rule.currency,target:rule.target,below:rule.below,since:rule.since};
  });
  return {token:body.token.toLowerCase(),rules};
}

const identity = rule => JSON.stringify([rule.symbol,rule.exchange,rule.currency,rule.target,rule.below,rule.since]);
export function reconcile(current, incoming) {
  return {...incoming,rules:incoming.rules.map(rule=>{
    const old=current?.token===incoming.token&&current.rules.find(row=>row.id===rule.id&&identity(row)===identity(rule));
    return {...rule,inside:old?old.inside:false,last:old?old.last:0};
  })};
}

export function checkThreshold(rule, quote) {
  if (quote.timestamp<rule.since || quote.timestamp<=rule.last) return null;
  const inside=rule.below ? quote.micros<=BigInt(rule.target) : quote.micros>=BigInt(rule.target);
  return {inside,last:quote.timestamp,send:inside&&!rule.inside};
}

export function parseQuote(data, rule, now=Math.floor(Date.now()/1000)) {
  if (!data || data.symbol?.toUpperCase()!==rule.symbol || data.currency!==rule.currency ||
      (rule.exchange&&data.exchange?.toUpperCase()!==rule.exchange.toUpperCase()) ||
      !Number.isSafeInteger(data.timestamp) || data.timestamp<=0 || data.timestamp>now+60 || now-data.timestamp>48*3600 ||
      typeof data.close!=='string' || !/^\d{1,12}(\.\d{1,6})?$/.test(data.close)) throw new Error('Quote unavailable');
  const [whole,decimal='']=data.close.split('.');
  const micros=BigInt(whole)*1000000n+BigInt(decimal.padEnd(6,'0'));
  if (micros<=0n) throw new Error('Quote unavailable');
  return {timestamp:data.timestamp,micros};
}

export function createTicker({read,write,quote,push,onError=()=>{}}) {
  let running=false;
  return async function tick() {
    if(running)return;
    running=true;
    try {
      const initial=read();
      if(!initial)return;
      const quotes=new Map();
      for (const rule of initial.rules) {
        try {
          const key=JSON.stringify([rule.symbol,rule.exchange,rule.currency]);
          if(!quotes.has(key))quotes.set(key,quote(rule));
          const latest=await quotes.get(key);
          const current=read();
          const present=current?.token===initial.token&&current.rules.find(row=>row.id===rule.id&&identity(row)===identity(rule));
          if(!present)continue;
          const result=checkThreshold(present,latest);
          if(!result)continue;
          if(result.send){
            const event=createHash('sha256').update(JSON.stringify([rule.id,identity(rule),latest.timestamp])).digest('hex');
            const status=await push(current.token,event);
            if(status===410){if(read()?.token===current.token)write(null);return;}
            if(status!==200)throw new Error('Push rejected');
          }
          const after=read();
          if(after?.token===current.token)write({...after,rules:after.rules.map(row=>row.id===rule.id&&identity(row)===identity(rule)?{...row,inside:result.inside,last:result.last}:row)});
        } catch { onError(); }
      }
    } finally { running=false; }
  };
}

function encryptedStore(filename, key) {
  mkdirSync(dirname(filename),{recursive:true,mode:0o700});
  const read=()=>{
    let raw;
    try { raw=readFileSync(filename); } catch (error) { if(error.code==='ENOENT')return null;throw error; }
    const cipher=createDecipheriv('aes-256-gcm',key,raw.subarray(0,12));
    cipher.setAuthTag(raw.subarray(12,28));
    return JSON.parse(Buffer.concat([cipher.update(raw.subarray(28)),cipher.final()]).toString());
  };
  const write=value=>{
    if(!value){rmSync(filename,{force:true});return;}
    const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,nonce);
    const content=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
    const temporary=filename+'.'+randomBytes(8).toString('hex');
    try { writeFileSync(temporary,Buffer.concat([nonce,cipher.getAuthTag(),content]),{mode:0o600,flag:'wx'});renameSync(temporary,filename); }
    finally { rmSync(temporary,{force:true}); }
  };
  return {read,write};
}

export function createRelay({pairingKey,store,tick}) {
  const expected=createHash('sha256').update(`Bearer ${pairingKey}`).digest();
  return createServer(async (request,response)=>{
    const json=(status,body)=>{response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify(body));};
    if(request.url!=='/v1/device')return json(404,{ok:false});
    const actual=createHash('sha256').update(request.headers.authorization||'').digest();
    if(!timingSafeEqual(expected,actual))return json(401,{ok:false});
    try {
      if(request.method==='DELETE'){store.write(null);return json(200,{ok:true});}
      if(request.method==='GET')return json(200,{ok:true,registered:Boolean(store.read())});
      if(request.method!=='PUT')return json(405,{ok:false});
      let size=0;
      const chunks=[];
      for await(const chunk of request){size+=chunk.length;if(size>20000){request.destroy();return;}chunks.push(chunk);}
      const registration=parseRegistration(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      store.write(reconcile(store.read(),registration));
      json(200,{ok:true});
    } catch { json(400,{ok:false}); }
  }).on('close',()=>tick?.stop());
}

function apnsSender({team,keyId,key,topic,environment}) {
  let session,issued=0,jwt='';
  const base64=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
  return (device,event)=>new Promise((resolve,reject)=>{
    const now=Math.floor(Date.now()/1000);
    if(now-issued>=2400){
      const payload=`${base64({alg:'ES256',kid:keyId})}.${base64({iss:team,iat:now})}`;
      jwt=`${payload}.${sign('sha256',Buffer.from(payload),{key,dsaEncoding:'ieee-p1363'}).toString('base64url')}`;
      issued=now;
    }
    if(!session||session.closed||session.destroyed){
      session=connect(environment==='production'?'https://api.push.apple.com':'https://api.sandbox.push.apple.com');
      session.on('error',()=>session?.destroy());
    }
    const stream=session.request({':method':'POST',':path':`/3/device/${device}`,authorization:`bearer ${jwt}`,'apns-topic':topic,'apns-push-type':'alert','apns-priority':'10','apns-expiration':String(now+3600),'apns-collapse-id':event});
    let status=0;
    stream.on('response',headers=>{status=Number(headers[':status']);});
    stream.on('error',reject);
    stream.on('end',()=>resolve(status));
    stream.setTimeout(10000,()=>{stream.close();reject(new Error('APNs timeout'));});
    stream.resume();
    stream.end(JSON.stringify({aps:{alert:{title:'MoreMoney',body:'Ein Kursalarm wurde ausgelöst.'},sound:'default'}}));
  });
}

async function main() {
  const env=process.env;
  const required=['MOREMONEY_PUSH_PAIRING_KEY','MOREMONEY_PUSH_STORAGE_KEY','MOREMONEY_APNS_TEAM_ID','MOREMONEY_APNS_KEY_ID','MOREMONEY_APNS_KEY_FILE','MOREMONEY_APNS_ENV','MOREMONEY_TWELVE_DATA_KEY'];
  if(required.some(name=>!env[name]))throw new Error('Push service configuration incomplete');
  if(!/^[a-f0-9]{64}$/i.test(env.MOREMONEY_PUSH_STORAGE_KEY)||!/^[A-Za-z0-9_-]{32,128}$/.test(env.MOREMONEY_PUSH_PAIRING_KEY)||!['development','production'].includes(env.MOREMONEY_APNS_ENV))throw new Error('Push service configuration invalid');
  const store=encryptedStore(resolve(env.MOREMONEY_PUSH_STATE_FILE||'data/moremoney-push.enc'),Buffer.from(env.MOREMONEY_PUSH_STORAGE_KEY,'hex'));
  store.read();
  const push=apnsSender({team:env.MOREMONEY_APNS_TEAM_ID,keyId:env.MOREMONEY_APNS_KEY_ID,key:createPrivateKey(readFileSync(env.MOREMONEY_APNS_KEY_FILE)),topic:env.MOREMONEY_APNS_TOPIC||'de.moremoney.ios',environment:env.MOREMONEY_APNS_ENV});
  const quote=async rule=>{
    const url=new URL('https://api.twelvedata.com/quote');
    url.searchParams.set('symbol',rule.symbol);
    if(rule.exchange)url.searchParams.set('exchange',rule.exchange);
    url.searchParams.set('apikey',env.MOREMONEY_TWELVE_DATA_KEY);
    const response=await fetch(url,{signal:AbortSignal.timeout(10000),redirect:'error'});
    if(!response.ok)throw new Error('Quote unavailable');
    return parseQuote(await response.json(),rule);
  };
  const tick=createTicker({...store,quote,push,onError:()=>console.warn('MoreMoney Push: Kurs- oder Zustelldienst vorübergehend nicht verfügbar.')});
  const delay=Math.max(60000,Number(env.MOREMONEY_PUSH_INTERVAL_MS)||300000);
  const timer=setInterval(()=>void tick().catch(()=>console.warn('MoreMoney Push: Prüfung fehlgeschlagen.')),delay);
  const server=createRelay({pairingKey:env.MOREMONEY_PUSH_PAIRING_KEY,store,tick:{stop:()=>clearInterval(timer)}});
  server.listen(Number(env.MOREMONEY_PUSH_PORT)||8787,'127.0.0.1',()=>console.log('MoreMoney Push: lokaler Relay bereit.'));
  server.requestTimeout=15000;
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{clearInterval(timer);server.close();});
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) main().catch(()=>{console.error('MoreMoney Push: Start fehlgeschlagen. Konfiguration und lokalen Datenspeicher prüfen.');process.exitCode=1;});
