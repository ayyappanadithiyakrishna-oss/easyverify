import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";
import { Compass } from "lucide-react";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="EasyVerify home">
      <span className="brand-mark">
        <Compass size={24} />
      </span>
      <span>
        EasyVerify<small>COMPLIANCE COMPASS</small>
      </span>
    </Link>
  );
}
export function Header() {
  return (
    <header className="site-header">
      <Brand />
      <nav aria-label="Main">
        <ThemeToggle />
        <Link href="/demo">Explore demo</Link>
        <Link href="/sources">Sources</Link>
        <Link href="/history">History</Link>
        <Link href="/identity-check">Face lab</Link>
        <Link href="/login" className="button secondary">
          Log in
        </Link>
        <Link href="/register" className="button">
          Get started
        </Link>
      </nav>
    </header>
  );
}
