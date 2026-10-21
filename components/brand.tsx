import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";
import { NavLink } from "./nav-link";
export function BrandMark() {
  return (
    <svg
      className="brand-mark"
      width="30"
      height="30"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M9 10h12M9 16h7M9 22h5"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="m18 21 3 3 6-8"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="EasyVerify home">
      <BrandMark />
      <span>EasyVerify</span>
    </Link>
  );
}
export function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <nav aria-label="Main">
          <NavLink href="/plan">Hiring plan</NavLink>
          <NavLink href="/case">E-Verify case</NavLink>
          <NavLink href="/assistant">Ask</NavLink>
          <NavLink href="/demo">Demo</NavLink>
          <NavLink href="/sources">Sources</NavLink>
          <Link href="/login">Sign in</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
