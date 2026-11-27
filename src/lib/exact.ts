export type Fraction={n:bigint;d:bigint};
const gcd=(a:bigint,b:bigint):bigint=>b===0n?(a<0n?-a:a):gcd(b,a%b);
export function frac(n:bigint|number,d:bigint|number=1):Fraction{let top=BigInt(n),bottom=BigInt(d);if(!bottom)throw new Error('Division durch null.');if(bottom<0n){top=-top;bottom=-bottom;}const g=gcd(top,bottom);return {n:top/g,d:bottom/g};}
export const plus=(a:Fraction,b:Fraction)=>frac(a.n*b.d+b.n*a.d,a.d*b.d);
export const minus=(a:Fraction,b:Fraction)=>frac(a.n*b.d-b.n*a.d,a.d*b.d);
export const times=(a:Fraction,b:Fraction)=>frac(a.n*b.n,a.d*b.d);
export const divide=(a:Fraction,b:Fraction)=>frac(a.n*b.d,a.d*b.n);
export const compare=(a:Fraction,b:Fraction)=>a.n*b.d<b.n*a.d?-1:a.n*b.d>b.n*a.d?1:0;
export function bound(value:Fraction,min:Fraction=frac(0),max:Fraction=frac(100)){return compare(value,min)<0?min:compare(value,max)>0?max:value;}
export function round(value:Fraction){const sign=value.n<0n?-1n:1n;return Number((value.n*sign*2n+value.d)/(2n*value.d)*sign);}
export const exactJSON=(value:Fraction)=>({numerator:String(value.n),denominator:String(value.d)});
export const float=(value:Fraction)=>Number(value.n)/Number(value.d);
export function interpolate(x:Fraction,points:readonly (readonly [number,number])[]):Fraction{
 if(compare(x,frac(points[0][0]))<=0)return frac(points[0][1]);
 for(let i=1;i<points.length;i++){const [x1,y1]=points[i-1],[x2,y2]=points[i];if(compare(x,frac(x2))<=0)return plus(frac(y1),times(divide(minus(x,frac(x1)),frac(x2-x1)),frac(y2-y1)));}
 return frac(points.at(-1)![1]);
}
