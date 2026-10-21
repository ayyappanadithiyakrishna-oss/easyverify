"use client";
import "./face-check.css";
import { useEffect, useState } from "react";
import { FaceLab } from "@/components/face-lab";
import { AGREEMENT } from "@/lib/scan-agreement";

type Session = {
  hireName: string;
  businessName: string;
  caseNumber: string;
  status: "waiting" | "opened" | "completed" | "expired";
};

export function CheckClient({ token }: { token: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/scan?token=${encodeURIComponent(token)}&open=1`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!alive) return;
        if (!response.ok) setError(data.error || "This link is not valid.");
        else setSession(data);
      })
      .catch(() => alive && setError("Could not reach EasyVerify. Try again."));
    return () => {
      alive = false;
    };
  }, [token]);

  if (error)
    return (
      <>
        <h1>This link did not work.</h1>
        <p className="lead">
          {error} Ask the business that invited you to send a new link.
        </p>
      </>
    );
  if (!session) return <p role="status">Opening your link…</p>;
  if (session.status === "expired")
    return (
      <>
        <h1>This link has expired.</h1>
        <p className="lead">Ask {session.businessName} to send a new one.</p>
      </>
    );
  if (session.status === "completed" || done)
    return (
      <>
        <h1>Thank you, {session.hireName}.</h1>
        <p className="lead">
          Your results were sent to {session.businessName}. You can close this
          page.
        </p>
      </>
    );

  return (
    <>
      <span className="eyebrow">{session.businessName}</span>
      <h1>Hi {session.hireName}, an optional photo comparison.</h1>
      <p className="lead">
        Compare two photos of yourself on this device. Only a similarity score
        is sent back.
      </p>
      <p className="check-case">
        <strong>E-Verify case number:</strong> {session.caseNumber}
      </p>
      <section className="check-agreement" aria-labelledby="agreement-heading">
        <h2 id="agreement-heading">Agreement</h2>
        <ul>
          {AGREEMENT.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <label className="consent-label">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />{" "}
          I have read this and agree to take part.
        </label>
      </section>
      {agreed && (
        <FaceLab
          session={{
            token,
            businessName: session.businessName,
            onSent: () => setDone(true),
          }}
        />
      )}
    </>
  );
}
