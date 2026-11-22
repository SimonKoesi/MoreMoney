import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'FINOVA · Dein Überblick',description:'Dein Geld. Deine Pläne. Dein Überblick.'};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="de"><body>{children}</body></html>;
}
