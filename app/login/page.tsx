import {Suspense} from 'react';
import {Header} from '@/components/brand';
import {AuthForm} from '@/components/auth-form';
export default function Page(){return <><Header/><main id="main" className="auth-main"><Suspense fallback={<p>Loading…</p>}><AuthForm mode="login"/></Suspense></main></>;}
