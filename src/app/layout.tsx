import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'MoreMoney · Dein Überblick',description:'Dein Geld. Deine Pläne. Dein Überblick.',icons:{icon:'/favicon.ico',apple:'/app-icon.png'}};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="de" data-theme="dark"><body>{children}</body></html>;
}
