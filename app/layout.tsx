import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:{default:'EasyVerify · Compliance Compass',template:'%s · EasyVerify'},description:'Understand employment-verification requirements, see why they apply, and organize your next steps.',icons:{icon:'/compass.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip" href="#main">Skip to content</a>{children}<footer className="site-footer"><span>EasyVerify · Compliance Compass</span><span>Informational guidance. Completion is self-reported, not a legal certification.</span><a href="/sources">Sources & coverage</a></footer></body></html>;}
