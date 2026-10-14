'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main" className="document-main"><h1>Unable to load this page.</h1><p>Your saved workspace data has not been changed.</p><button className="button" onClick={reset}>Try again</button><a href="/">Back to home</a></main>;}
