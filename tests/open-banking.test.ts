import { generateKeyPairSync, verify } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { enableBanking, parseReturn } from '@/lib/enable-banking';

const pair=generateKeyPairSync('rsa',{modulusLength:2048});
const applicationId='61728c9e-cf5b-48e8-88e3-d567c60057bb';
const key=pair.privateKey.export({type:'pkcs8',format:'pem'}).toString();
const redirect='https://moremoney.invalid/bank';
const accountUid='574180bf-1d0c-4b9d-aaac-5615509583bc';
const account={uid:accountUid,identity:'synthetic',name:'Testkonto',type:'Girokonto',currency:'EUR',maskedIban:'DE •••• 1234'};

it('verifies the app, signs requests and requests read-only access for a German bank',async()=>{
 const sample={name:'Sparkasse Teststadt',country:'DE',maximum_consent_validity:86400};
 const transport=vi.fn().mockResolvedValueOnce(Response.json({kid:applicationId,active:true,environment:'PRODUCTION',redirect_urls:[redirect],services:['AIS']})).mockResolvedValueOnce(Response.json({aspsps:[sample]})).mockResolvedValueOnce(Response.json({url:'https://auth.enablebanking.com/ais/start?sessionid=synthetic'}));
 const client=enableBanking({applicationId,privateKey:key,redirect},transport);
 expect(await client.verify()).toBe('PRODUCTION');
 expect(await client.institutions('DE')).toEqual([sample]);
 expect(await client.start(sample,'synthetic-state')).toContain('https://auth.enablebanking.com/');
 const args=transport.mock.calls[2];
 expect(args[0]).toBe('https://api.enablebanking.com/auth');
 expect(JSON.parse(args[1].body)).toMatchObject({access:{balances:true,transactions:true,transactions_extended_history:false},aspsp:{country:'DE',name:sample.name},state:'synthetic-state',psu_type:'personal',redirect_url:redirect});
 const [head,body,signature]=args[1].headers.Authorization.slice(7).split('.');
 expect(verify('RSA-SHA256',Buffer.from(head+'.'+body),pair.publicKey,Buffer.from(signature,'base64url'))).toBe(true);
});

it('checks callback origin and state, rejects replay material from unrelated URLs',()=>{
 expect(parseReturn(redirect+'?state=right&code=synth',redirect,'right')).toBe('synth');
 expect(()=>parseReturn(redirect+'?state=wrong&code=synth',redirect,'right')).toThrow();
 expect(()=>parseReturn('https://else.invalid/bank?state=right&code=synth',redirect,'right')).toThrow();
 expect(()=>parseReturn(redirect+'?state=right&code=x&code=y',redirect,'right')).toThrow();
});

it('deduplicates stable references across pages and ignores unsettled amounts',async()=>{
 const entry={entry_reference:'synthetic-001',transaction_amount:{currency:'EUR',amount:'12.34'},credit_debit_indicator:'DBIT',status:'BOOK',booking_date:'2026-11-25',creditor:{name:'Synthetischer Händler'}};
 const transport=vi.fn().mockResolvedValueOnce(Response.json({transactions:[entry],continuation_key:'page2'})).mockResolvedValueOnce(Response.json({transactions:[entry,{...entry,entry_reference:'pending',status:'PDNG'}]})).mockResolvedValueOnce(Response.json({balances:[{balance_type:'CLAV',balance_amount:{currency:'EUR',amount:'84.32'}},{balance_type:'ITBD',balance_amount:{currency:'EUR',amount:'87.66'},reference_date:'2026-11-25'}]}));
 const result=await enableBanking({applicationId,privateKey:key,redirect},transport).movements(account,'2026-11-01','2026-11-25');
 expect(result.balanceCents).toBe(8766);
 expect(result.entries).toMatchObject([{amountCents:1234,kind:'expense',title:'Synthetischer Händler'}]);
 expect(transport.mock.calls[1][0]).toContain('continuation_key=page2');
});
