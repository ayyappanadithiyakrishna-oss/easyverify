import { HelpWidget } from "@/components/help-panel";
import type { Metadata } from "next";
import "./globals.css";
import "./site.css";
export const metadata: Metadata = {
  title: {
    default: "EasyVerify · Compliance Compass",
    template: "%s · EasyVerify",
  },
  description:
    "Understand employment-verification requirements, see why they apply, and organize your next steps.",
  icons: { icon: "/compass.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('easyverify-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})()`,
          }}
        />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
        <HelpWidget />
        <footer className="site-footer">
          <p>
            Informational guidance, not legal advice. Completion is
            self-reported and is not a certification. Federal baseline for the
            United States; California references carry an explicit review
            status.
          </p>
          <nav aria-label="Footer">
            <a href="/sources">Sources &amp; coverage</a>
            <a href="/history">Program history</a>
            <a href="https://www.congressionalappchallenge.us/">
              Congressional App Challenge
            </a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
