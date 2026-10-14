import { HelpWidget } from "@/components/help-panel";
import type { Metadata } from "next";
import "./globals.css";
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
          <span>EasyVerify · Compliance Compass</span>
          <span>
            Informational guidance. Completion is self-reported, not a legal
            certification.
          </span>
          <a href="/sources">Sources & coverage</a>
        </footer>
      </body>
    </html>
  );
}
