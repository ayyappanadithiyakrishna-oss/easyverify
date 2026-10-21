"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// The chat panel and its helpers are large and not needed to read a page, so
// they load only after the browser is idle.
const HelpPanel = dynamic(
  () => import("./help-panel").then((m) => m.HelpPanel),
  { ssr: false },
);

export function HelpWidget() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setReady(true), {
        timeout: 4000,
      });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(id);
  }, []);
  return pathname === "/assistant" || !ready ? null : <HelpPanel />;
}
