"use client";
import "./face-check.css";
import { useCallback, useEffect, useState } from "react";
import { Copy, Mail, Link2, RefreshCw } from "lucide-react";
import type { Business, Hire } from "@/lib/types";
import { verdictFor } from "@/lib/face/verdict";

const STORAGE_KEY = "easyverify-face-sessions-v1";

type Remote = {
  hireName: string;
  caseNumber: string;
  status: "waiting" | "opened" | "completed" | "expired";
  createdAt: string;
  expiresAt: string;
  openedAt: string | null;
  emailSentAt: string | null;
  completedAt: string | null;
  result: { similarity: number; band: string; warnings: number } | null;
};

type Saved = Record<string, { token: string; url: string }>;

function readSaved(): Saved {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeSaved(value: Saved) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* The link can still be copied from the page. */
  }
}
const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

const STATUS_LABEL: Record<Remote["status"], string> = {
  waiting: "Waiting to be opened",
  opened: "Opened, not finished",
  completed: "Results received",
  expired: "Link expired",
};

export function FaceCheckPanel({
  mode,
  business,
  hires,
  hire,
  onPick,
  onSend,
}: {
  mode: "send" | "status";
  business: Business;
  hires: Hire[];
  hire: Hire | undefined;
  onPick: (id: string) => void;
  onSend: () => void;
}) {
  const [caseNumber, setCaseNumber] = useState("");
  const [saved, setSaved] = useState<Saved>({});
  const [remote, setRemote] = useState<Remote | null>(null);
  const [busy, setBusy] = useState<"" | "create" | "email" | "refresh">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setSaved(readSaved()), []);
  const session = hire ? saved[hire.id] : undefined;

  const refresh = useCallback(async () => {
    if (!session) return setRemote(null);
    setBusy("refresh");
    try {
      const response = await fetch(
        `/api/scan?token=${encodeURIComponent(session.token)}`,
        { cache: "no-store" },
      );
      setRemote(response.ok ? await response.json() : null);
    } finally {
      setBusy("");
    }
  }, [session]);

  useEffect(() => {
    setMessage("");
    setError("");
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!remote || remote.status === "completed" || remote.status === "expired")
      return;
    const timer = setInterval(() => void refresh(), 15000);
    return () => clearInterval(timer);
  }, [remote, refresh]);

  async function post(body: Record<string, unknown>) {
    const response = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  async function generate() {
    if (!hire) return;
    setBusy("create");
    setError("");
    setMessage("");
    try {
      const data = await post({
        action: "create",
        hireName: hire.name,
        businessName: business.profile.name,
        caseNumber,
      });
      const next = { ...readSaved(), [hire.id]: { token: data.token, url: data.url } };
      writeSaved(next);
      setSaved(next);
      setMessage("Link created. Copy it or email it to the new hire.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the link.");
    } finally {
      setBusy("");
    }
  }

  async function copy() {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.url);
      setMessage("Link copied.");
    } catch {
      setError("Could not copy automatically. Select the link and copy it.");
    }
  }

  async function email() {
    if (!hire || !session) return;
    setBusy("email");
    setError("");
    setMessage("");
    try {
      await post({ action: "email", token: session.token, to: hire.email });
      setMessage(`Email sent to ${hire.email}.`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Email was not sent.");
    } finally {
      setBusy("");
    }
  }

  const picker = (
    <div className="fc-field">
      <label htmlFor="fc-hire">Employee</label>
      <select
        id="fc-hire"
        value={hire?.id ?? ""}
        onChange={(e) => onPick(e.target.value)}
      >
        {hires.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
    </div>
  );

  if (!hire)
    return (
      <section className="panel">
        <p>Add a new hire first. Then you can send them a face check.</p>
      </section>
    );

  const verdict = remote?.result ? verdictFor(remote.result.similarity) : null;

  const statusSection = (
    <section className="panel fc-status" aria-labelledby="fc-status-heading">
      <div className="panel-heading">
        <h2 id="fc-status-heading">Status of {hire.name}</h2>
        {session && (
          <button
            type="button"
            className="text-button"
            onClick={() => void refresh()}
            disabled={busy === "refresh"}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        )}
      </div>
      {!session || !remote ? (
        <p>
          No face check has been sent to {hire.name} yet.{" "}
          {mode === "status" && (
            <button type="button" className="text-button" onClick={onSend}>
              Send one
            </button>
          )}
        </p>
      ) : (
        <>
          <p className={`fc-state ${remote.status}`}>
            <strong>{STATUS_LABEL[remote.status]}</strong>
          </p>
          <dl className="fc-timeline">
            <div>
              <dt>E-Verify case number</dt>
              <dd>{remote.caseNumber}</dd>
            </div>
            <div>
              <dt>Link created</dt>
              <dd>{when(remote.createdAt)}</dd>
            </div>
            <div>
              <dt>Email sent</dt>
              <dd>{when(remote.emailSentAt) ?? "Not emailed"}</dd>
            </div>
            <div>
              <dt>Opened</dt>
              <dd>{when(remote.openedAt) ?? "Not yet"}</dd>
            </div>
            <div>
              <dt>Results received</dt>
              <dd>{when(remote.completedAt) ?? "Not yet"}</dd>
            </div>
          </dl>
          {remote.result && verdict && (
            <div className={`scan-verdict ${verdict.band}`}>
              <h3>{verdict.title}</h3>
              <p>
                Similarity {remote.result.similarity.toFixed(2)}
                {remote.result.warnings
                  ? ` · ${remote.result.warnings} photo-quality warning${remote.result.warnings > 1 ? "s" : ""}`
                  : ""}
                . The employee ran this on their own device. It is not identity
                verification and does not change any onboarding step.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );

  if (mode === "status")
    return (
      <>
        {picker}
        {statusSection}
      </>
    );

  return (
    <>
      <section className="panel" aria-labelledby="fc-send-heading">
        <h2 id="fc-send-heading">Send an optional face check</h2>
        <p>
          The new hire compares two photos on their own device and sends back
          only a similarity result. Photos never reach EasyVerify.
        </p>
        <div className="fc-form">
          {picker}
          <div className="fc-field">
            <label htmlFor="fc-case">E-Verify case number</label>
            <input
              id="fc-case"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="From the case you created in E-Verify"
              autoComplete="off"
              spellCheck={false}
              maxLength={24}
            />
          </div>
          <button
            type="button"
            className="button"
            onClick={generate}
            disabled={busy === "create" || caseNumber.trim().length < 6}
          >
            <Link2 size={16} />
            {session ? "Generate a new link" : "Generate link"}
          </button>
        </div>
        {session && (
          <div className="fc-link">
            <input
              aria-label="Private link for the new hire"
              readOnly
              value={session.url}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button type="button" className="button secondary" onClick={copy}>
              <Copy size={16} /> Copy link
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={email}
              disabled={busy === "email"}
            >
              <Mail size={16} /> Email {hire.email}
            </button>
          </div>
        )}
        <div role="status" aria-live="polite">
          {message && <p className="fc-ok">{message}</p>}
          {error && <p className="fc-error">{error}</p>}
        </div>
        <p className="small">
          The email includes the agreement the hire reads before starting.
          Taking part is optional, and declining must not affect their Form I-9
          or E-Verify case. Do not use the result for hiring decisions. Some
          states regulate biometric data, so review your obligations first.
        </p>
      </section>
      {statusSection}
    </>
  );
}
