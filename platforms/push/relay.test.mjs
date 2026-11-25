import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRelay, createTicker, parseQuote, parseRegistration, reconcile } from './relay.mjs';

const now=Math.floor(Date.now()/1000);
const sample={token:'ab'.repeat(32),rules:[{id:randomUUID(),symbol:'SYN',exchange:'NYSE',currency:'USD',target:'5000000',below:false,since:now-15}]};

test('quote identity, precise threshold, stale quotes, delivery retry and rearming',async()=>{
  let state=reconcile(null,parseRegistration(sample)), sent=0, failed=0;
  let current=parseQuote({symbol:'SYN',exchange:'NYSE',currency:'USD',timestamp:now-20,close:'5.000000'},sample.rules[0],now);
  assert.throws(()=>parseQuote({symbol:'OTHER',exchange:'NYSE',currency:'USD',timestamp:now,close:'5'},sample.rules[0],now));
  const tick=createTicker({read:()=>state,write:value=>{state=value;},quote:async()=>current,push:async()=>++sent===1?503:200,onError:()=>failed++});
  await tick();assert.equal(sent,0);
  current={timestamp:now,micros:5000000n};
  await tick();assert.equal(sent,1);assert.equal(failed,1);assert.equal(state.rules[0].inside,false);
  await tick(); await tick();assert.equal(sent,2);assert.equal(state.rules[0].inside,true);
  state=reconcile(state,parseRegistration(sample));assert.equal(state.rules[0].inside,true);
  current={timestamp:now+1,micros:4999999n};await tick();assert.equal(state.rules[0].inside,false);
  current={timestamp:now+2,micros:5100000n};await tick();assert.equal(sent,3);
});

test('relay requires pairing and removes registration on disconnect',async()=>{
  let state=null;
  const key='synthetic-test-pairing-key-0000000000';
  const server=createRelay({pairingKey:key,store:{read:()=>state,write:value=>{state=value;}}});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const url=`http://127.0.0.1:${server.address().port}/v1/device`;
  const headers={Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
  try {
    assert.equal((await fetch(url,{method:'PUT',body:JSON.stringify(sample)})).status,401);
    assert.equal((await fetch(url,{method:'PUT',headers,body:JSON.stringify({...sample,rules:[sample.rules[0],sample.rules[0]]})})).status,400);
    assert.equal((await fetch(url,{method:'PUT',headers,body:JSON.stringify(sample)})).status,200);
    assert.deepEqual(await (await fetch(url,{headers})).json(),{ok:true,registered:true});
    assert.equal((await fetch(url,{method:'DELETE',headers})).status,200);
    assert.deepEqual(await (await fetch(url,{headers})).json(),{ok:true,registered:false});
  } finally { await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve())); }
});
