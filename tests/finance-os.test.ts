import {describe,it,expect} from 'vitest';
import {bankAmount,bankDate,csvRows,parseBankFile} from '@/lib/bank-import';
import {addMonths,inEuro,charges,recurringSuggestions} from '@/lib/finance-os';
import {encrypt,decrypt,encryptedBackup,openBackup} from '@/lib/local-security';
import {randomBytes} from 'node:crypto';
describe('Lokale Bankimporte',()=>{
 it('liest CSV mit Zitaten und erhält Duplikate ohne stabile Bank-ID als getrennte Zeilen',()=>{
  const value='Datum;Betrag;Name\r\n31.01.2026;"-1.234,56";"Eigener; Händler"\r\n31.01.2026;"-1.234,56";"Eigener; Händler"';
  expect(csvRows(value).rows[0][2]).toBe('Eigener; Händler');
  const parsed=parseBankFile(value,'csv',{date:'Datum',amount:'Betrag',payee:'Name'});
  expect(parsed.rows).toHaveLength(2);expect(parsed.rows[0].amountCents).toBe(-123456);expect(parsed.rows[0].externalId).not.toBe(parsed.rows[1].externalId);
  expect(bankDate('29.02.2024')).toBe('2024-02-29');expect(()=>bankDate('29.02.2026')).toThrow();expect(bankAmount('-0,01')).toBe(-1);
  expect(()=>csvRows('Datum;Betrag\n"kaputt')).toThrow();
 });
 it('liest OFX und MT940 ohne gedachte Bankverbindung',()=>{
  const ofx=parseBankFile('<OFX><CURDEF>EUR<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260131120000<TRNAMT>-12.34<FITID>synthetic-1<NAME>Eigener Anbieter<MEMO>Notiz</STMTTRN></OFX>','ofx');
  expect(ofx.errors).toEqual([]);expect(ofx.rows[0].amountCents).toBe(-1234);expect(ofx.rows[0].externalId).toBe('bank:synthetic-1');
  const mt=parseBankFile(':60F:C260101EUR1000,00\n:61:2601310131D12,34NTRFNONREF//synthetic-2\n:86:Eigener Anbieter\n:62F:C260131EUR987,66','mt940');
  expect(mt.errors).toEqual([]);expect(mt.rows[0].date).toBe('2026-01-31');expect(mt.rows[0].amountCents).toBe(-1234);
 });
 it('liest CAMT mit verschachteltem Status und verwirft Entitäten',()=>{
  const content='<Document><BkToCstmrStmt><Stmt><Ntry><Amt Ccy="EUR">12.34</Amt><CdtDbtInd>DBIT</CdtDbtInd><Sts><Cd>PDNG</Cd></Sts><BookgDt><Dt>2026-01-31</Dt></BookgDt><AcctSvcrRef>NOTPROVIDED</AcctSvcrRef><NtryDtls><TxDtls><RltdPties><Cdtr><Nm>Eigener Anbieter</Nm></Cdtr></RltdPties><RmtInf><Ustrd>Eigene Notiz</Ustrd></RmtInf></TxDtls></NtryDtls></Ntry></Stmt></BkToCstmrStmt></Document>';
  const result=parseBankFile(content,'camt');expect(result.errors).toEqual([]);expect(result.rows[0].status).toBe('pending');expect(result.rows[0].currency).toBe('EUR');expect(result.rows[0].amountCents).toBe(-1234);expect(result.rows[0].uncertainId).toBe(true);
  expect(()=>parseBankFile('<!DOCTYPE doc [<!ENTITY x SYSTEM "file:///ignored">]>'+content,'camt')).toThrow();
 });
});
it('rechnet Wechselkurse auf Cent und bleibt bei fehlenden Währungen unbekannt',()=>{
 expect(inEuro(101,'USD',[{currency:'USD',rateMicros:'920000',asOf:'2026-01-01'}])).toBe(93);
 expect(inEuro(-101,'USD',[{currency:'USD',rateMicros:'920000',asOf:'2026-01-01'}])).toBe(-93);
 expect(inEuro(100,'CHF',[])).toBeNull();expect(addMonths('2026-01-31',2)).toBe('2026-03-31');
});
it('verschlüsselt manipulationssicher und entschlüsselt Backups nur mit der richtigen Passphrase',async()=>{
 const key=randomBytes(32),plain=Buffer.from('synthetischer Finanzdatensatz');const sealed=encrypt(plain,key);expect(sealed.includes(plain)).toBe(false);expect(decrypt(sealed,key)).toEqual(plain);
 const corrupt=Buffer.from(sealed);corrupt[corrupt.length-1]^=1;expect(()=>decrypt(corrupt,key)).toThrow();
 const backup=await encryptedBackup(plain,'Synthetische Passphrase 2026');expect(await openBackup(backup,'Synthetische Passphrase 2026')).toEqual(plain);await expect(openBackup(backup,'Andere synthetische Passphrase')).rejects.toThrow();
});

it('ber?cksichtigt best?tigte Vertragsenden und bietet wiederkehrende Zahlungen nur als Vorschlag an',()=>{
 const subscription={id:'synthetic',name:'Dienst',priceCents:1000,currency:'EUR',interval:'monthly',customDays:30,startDate:'2026-01-31',minimumMonths:0,nextCharge:'2026-01-31',noticeDays:14,earliestEnd:'',endDate:'2026-03-15',trialEnd:'',autoRenew:false,usage:'regular',status:'cancelled',accountId:null,category:'Abos'};
 expect(charges(subscription,'2026-01-01','2026-04-30')).toEqual(['2026-01-31','2026-02-28']);
 const transactions=['2026-01-01','2026-02-01','2026-03-01'].map((date,index)=>({id:String(index),title:'Eigener Dienst',date,amountCents:1000+index*100,kind:'expense',accountId:'synthetic'}));
 const suggestions=recurringSuggestions(transactions,[],[]);expect(suggestions).toHaveLength(1);expect(suggestions[0].priceIncreaseCents).toBe(100);expect(recurringSuggestions(transactions,[],[suggestions[0].key])).toEqual([]);
});
