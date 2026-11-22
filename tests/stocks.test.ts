import { describe, expect, it } from 'vitest';
import { changePercent, parseProviderQuote, priceInput, priceMicros, stockCommand, targetReached } from '../src/lib/stocks';
describe('Aktien-Watchlist',()=>{
  it('speichert Kurse mit sechs Nachkommastellen ohne Float-Rechnung',()=>{
    expect(priceMicros('0,000001')).toBe('1');expect(priceMicros('123.456789')).toBe('123456789');
    expect(priceInput('123456789')).toBe('123,456789');expect(priceInput('120000000')).toBe('120');
    for(const invalid of ['0','-1','1e6','1.234,56','0.0000001'])expect(()=>priceMicros(invalid)).toThrow();
  });
  it('vergleicht beide Zielrichtungen exakt',()=>{
    expect(targetReached('100000001','100000000','below')).toBe(false);
    expect(targetReached('100000000','100000000','below')).toBe(true);
    expect(targetReached('100000001','100000000','above')).toBe(true);
    expect(targetReached(undefined,'100000000','below')).toBe(false);
  });
  it('rundet die Veränderung symmetrisch auf zwei Stellen',()=>{
    expect(changePercent('130000000','120000000')).toBe(8.33);
    expect(changePercent('110000000','120000000')).toBe(-8.33);
    expect(changePercent('1000000','0')).toBeNull();
  });
  it('normalisiert Symbole und verhindert Script-/URL-Eingaben',()=>{
    const result=stockCommand.parse({op:'add',name:'Apple',symbol:'aapl',currency:'USD'});
    expect(result.op==='add'&&result.symbol).toBe('AAPL');
    expect(stockCommand.safeParse({op:'add',name:'A',symbol:'https://evil.example',currency:'USD'}).success).toBe(false);
  });
  it('akzeptiert nur zum Instrument passende Providerdaten',()=>{
    const stock={symbol:'AAPL',exchange:'NASDAQ',currency:'USD'};
    const data={symbol:'AAPL',exchange:'NASDAQ',currency:'USD',close:'123.4567',datetime:'2026-11-20'};
    expect(parseProviderQuote(data,stock)).toEqual({priceMicros:'123456700',asOf:'2026-11-20'});
    expect(()=>parseProviderQuote({...data,currency:'EUR'},stock)).toThrow();
    expect(()=>parseProviderQuote({...data,symbol:'MSFT'},stock)).toThrow();
    expect(()=>parseProviderQuote({...data,exchange:'XETRA'},stock)).toThrow();
    expect(()=>parseProviderQuote({status:'error',message:'provider failure'},stock)).toThrow();
  });
});
