import { NextRequest, NextResponse } from 'next/server';
export function proxy(request:NextRequest){
  const expected=process.env.FINOVA_SESSION_TOKEN;
  if(expected && request.headers.get('x-finova-token')!==expected)return new NextResponse('Nicht erlaubt',{status:403});
  const response=NextResponse.next();
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('X-Frame-Options','DENY');
  response.headers.set('Referrer-Policy','no-referrer');
  response.headers.set('Content-Security-Policy',`default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV==='development'?" 'unsafe-eval'":''}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'`);
  return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
