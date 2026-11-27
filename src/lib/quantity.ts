export function quantityMicros(value:string):string {
  const normalized=value.trim();
  if(!/^\d{1,9}(?:[.,]\d{1,6})?$/.test(normalized))throw new Error('Menge mit maximal sechs Nachkommastellen eingeben.');
  const [whole,fraction='']=normalized.split(/[.,]/);
  const micros=BigInt(whole)*1_000_000n+BigInt(fraction.padEnd(6,'0'));
  if(micros<=0n)throw new Error('Menge muss größer als null sein.');
  return micros.toString();
}
export function quantityInput(micros:string|null){
  if(!micros)return '';
  const value=BigInt(micros);
  const fraction=(value%1_000_000n).toString().padStart(6,'0').replace(/0+$/,'');
  return (value/1_000_000n).toString()+(fraction?','+fraction:'');
}
