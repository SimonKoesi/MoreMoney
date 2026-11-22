'use client';
export default function Error({reset}:{reset:()=>void}){return <main className="loading"><h1>MoreMoney konnte nicht geladen werden</h1><button onClick={reset}>Erneut versuchen</button></main>;}
