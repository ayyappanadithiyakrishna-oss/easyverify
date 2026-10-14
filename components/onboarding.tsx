"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "./brand";
import { Workspace } from "./workspace";
import { browserClient } from "@/lib/supabase";
export function Onboarding() {
  const params = useSearchParams();
  const token = params.get("token");
  const [signedIn, setSignedIn] = useState(false);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    browserClient()
      .auth.getUser()
      .then(({ data }) => setSignedIn(!!data.user))
      .catch(() => setError("Account services are temporarily unavailable."));
  }, []);
  if (!token || joined) return <Workspace onboarding />;
  const next = `/onboarding?token=${token}`;
  async function redeem() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", token }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error);
      history.replaceState({}, "", "/onboarding");
      setJoined(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to accept invitation.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main id="main" className="auth-main">
        <section className="auth-card">
          <span className="eyebrow">NEW-HIRE ONBOARDING</span>
          <h1>Your next steps, in one place.</h1>
          <p>
            Sign in with the email address your employer invited. The link works
            once and expires after seven days.
          </p>
          <ol className="action-list">
            <li>Verify your account email.</li>
            <li>Accept the invitation to your assigned record.</li>
            <li>
              Complete paperwork through the official process and report your
              progress here.
            </li>
          </ol>
          {signedIn ? (
            <button className="button full" disabled={busy} onClick={redeem}>
              {busy ? "Accepting…" : "Accept invitation"}
            </button>
          ) : (
            <div className="actions">
              <Link
                className="button"
                href={"/login?next=" + encodeURIComponent(next)}
              >
                Log in
              </Link>
              <Link
                className="button secondary"
                href={"/register?next=" + encodeURIComponent(next)}
              >
                Create account
              </Link>
            </div>
          )}
          {error && (
            <div role="alert" className="callout error">
              {error}
            </div>
          )}
          <p className="small">
            EasyVerify does not collect identity documents or determine work
            authorization.
          </p>
        </section>
      </main>
    </>
  );
}
