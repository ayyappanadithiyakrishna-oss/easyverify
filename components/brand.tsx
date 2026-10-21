import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="EasyVerify home">
      EasyVerify
    </Link>
  );
}
export function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <nav aria-label="Main">
          <Link href="/plan">Hiring plan</Link>
          <Link href="/case">E-Verify case</Link>
          <Link href="/assistant">Ask</Link>
          <Link href="/demo">Demo</Link>
          <Link href="/sources">Sources</Link>
          <Link href="/login">Sign in</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
