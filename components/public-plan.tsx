"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Copy, Printer, Check, ChevronDown } from "lucide-react";
import { stateCoverage } from "@/lib/state-laws";
import { states } from "@/lib/validation";
import { rules } from "@/lib/rules";
import { evaluate } from "@/lib/engine";
import {
  planHire,
  publicPlanSchema,
  readSharedPlan,
  sharePlan,
  type PublicPlan,
} from "@/lib/public-plan";
import type { Profile } from "@/lib/types";
const defaultProfile: Profile = {
  name: "Your business",
  state: "CA",
  headcount: 1,
  contractor: "unknown",
  far: "unknown",
  participation: "unknown",
  calendar: "weekdays",
  closures: [],
};
export function PublicPlanner() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [date, setDate] = useState("");
  const [closureText, setClosureText] = useState("");
  const [short, setShort] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [plan, setPlan] = useState<PublicPlan | null>(null);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  useEffect(() => {
    const value = readSharedPlan(new URLSearchParams(location.search).get("p"));
    if (value) {
      setProfile(value.profile);
      setClosureText(value.profile.closures.join(", "));
      setDate(value.hireDate);
      setShort(value.shortJob);
      setAccepted(true);
      setPlan(value);
    }
  }, []);
  const requirements = plan
    ? evaluate(plan.profile, planHire(plan), rules).filter(
        (rule) => rule.result !== "unmatched",
      )
    : [];
  function update(field: keyof Profile, value: string | number) {
    setProfile((previous) => ({ ...previous, [field]: value }));
  }
  return (
    <div className="public-planner">
      <section className="planner-form">
        <div className="planner-heading">
          <span className="badge">Free · no account required</span>
          <h1>
            A hiring plan.
            <br />
            Built around your business.
          </h1>
          <p>
            Choose the facts you know. Unknown answers stay visible. No employee
            names, documents, or identity numbers are needed.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const result = publicPlanSchema.safeParse({
              profile: {
                ...profile,
                closures: closureText
                  .split(",")
                  .map((date) => date.trim())
                  .filter(Boolean),
              },
              hireDate: date,
              shortJob: short,
            });
            if (!result.success) {
              setMessage(result.error.issues[0].message);
              return;
            }
            setPlan(result.data);
            window.dispatchEvent(
              new CustomEvent("easyverify-plan", {
                detail: sharePlan(result.data),
              }),
            );
            setCompleted([]);
            setMessage(
              "Your plan is ready. Open any step to see its source and reasoning.",
            );
          }}
        >
          <div className="form-grid">
            <label>
              Work location
              <select
                value={profile.state}
                onChange={(e) => update("state", e.target.value)}
              >
                {states.map((state) => (
                  <option key={state}>{state}</option>
                ))}
              </select>
            </label>
            <label>
              Number of employees
              <input
                type="number"
                min="1"
                max="1000000"
                required
                value={profile.headcount}
                onChange={(e) => update("headcount", Number(e.target.value))}
              />
            </label>
            <label>
              First day of paid work
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              Working calendar
              <select
                value={profile.calendar}
                onChange={(e) => update("calendar", e.target.value)}
              >
                <option value="weekdays">Monday–Friday</option>
                <option value="sixDays">Monday–Saturday</option>
                <option value="everyDay">Every day</option>
              </select>
            </label>
            <label>
              Federal contractor status
              <select
                value={profile.contractor}
                onChange={(e) => update("contractor", e.target.value)}
              >
                <option value="unknown">Not sure</option>
                <option value="none">Not a contractor</option>
                <option value="prime">Prime contractor</option>
                <option value="subcontractor">Subcontractor</option>
              </select>
            </label>
            <label>
              FAR E-Verify clause
              <select
                value={profile.far}
                onChange={(e) => update("far", e.target.value)}
              >
                <option value="unknown">Not sure</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label>
              E-Verify participation
              <select
                value={profile.participation}
                onChange={(e) => update("participation", e.target.value)}
              >
                <option value="unknown">Not sure</option>
                <option value="yes">Enrolled</option>
                <option value="no">Not enrolled</option>
              </select>
            </label>
            <label>
              Closure dates
              <input
                placeholder="2026-12-25, 2027-01-01"
                value={closureText}
                onChange={(e) => setClosureText(e.target.value)}
              />
            </label>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={short}
              onChange={(e) => setShort(e.target.checked)}
            />
            The job lasts fewer than three business days
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={accepted}
              required
              onChange={(e) => setAccepted(e.target.checked)}
            />
            The job offer has been accepted
          </label>
          <button className="button" disabled={!accepted}>
            Build my plan <ArrowRight size={17} />
          </button>
        </form>
      </section>
      <section className="planner-results" aria-label="Your hiring plan">
        <div className="planner-results-top">
          <h2>{plan ? "Your next steps" : "Your plan starts here"}</h2>
          {plan && (
            <div className="actions">
              <Link
                href={`/assistant?p=${encodeURIComponent(sharePlan(plan))}`}
                className="button secondary"
              >
                Ask about this plan
              </Link>
              <button
                className="icon-button"
                aria-label="Print hiring plan"
                onClick={() => {
                  const closed = Array.from(
                    document.querySelectorAll<HTMLDetailsElement>(
                      ".plan-step:not([open])",
                    ),
                  );
                  closed.forEach((detail) => (detail.open = true));
                  requestAnimationFrame(() => {
                    window.print();
                    closed.forEach((detail) => (detail.open = false));
                  });
                }}
              >
                <Printer size={18} />
              </button>
              <button
                className="button secondary"
                onClick={async () => {
                  try {
                    const url = new URL("/plan", location.origin);
                    url.searchParams.set("p", sharePlan(plan));
                    history.replaceState(null, "", url.toString());
                    await navigator.clipboard.writeText(url.toString());
                    setMessage(
                      "Plan link copied. It contains business answers and the start date; completion stays on this device.",
                    );
                  } catch {
                    setMessage(
                      "Could not copy. Your browser may block clipboard access.",
                    );
                  }
                }}
              >
                <Copy size={15} />
                Copy plan link
              </button>
            </div>
          )}
        </div>
        {message && (
          <p role="status" className="callout">
            {message}
          </p>
        )}
        {!plan ? (
          <div className="planner-empty">
            <div className="orbit-mark">
              <ArrowRight size={32} />
            </div>
            <h3>
              Clear responsibilities.
              <br />
              Dates you can explain.
            </h3>
            <p>
              Build a plan to see federal requirements, state-specific guidance,
              and the employer, contract, or local-law questions that need
              review.
            </p>
          </div>
        ) : (
          <>
            <p className="small">
              {plan.profile.state} · {plan.profile.headcount} employees · First
              paid day {plan.hireDate}. {stateCoverage(plan.profile.state)}
            </p>
            {requirements.map((requirement) => (
              <details className="plan-step" key={requirement.id}>
                <summary>
                  <span className="plan-step-icon">
                    {completed.includes(requirement.id) ? (
                      <Check size={20} />
                    ) : (
                      <span>{requirement.role === "hire" ? "H" : "E"}</span>
                    )}
                  </span>
                  <span>
                    <strong>{requirement.title}</strong>
                    <small>
                      {requirement.needsReview
                        ? "Needs review"
                        : requirement.due
                          ? `Target: ${requirement.due}`
                          : "No fixed target"}{" "}
                      · {requirement.role === "hire" ? "New hire" : "Employer"}
                    </small>
                  </span>
                  <ChevronDown size={17} />
                </summary>
                <div className="plan-step-body">
                  <p>{requirement.summary}</p>
                  <ul>
                    {requirement.actions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                  <h3>Why this appears</h3>
                  <ul>
                    {requirement.trace.map((trace) => (
                      <li key={trace}>{trace}</li>
                    ))}
                  </ul>
                  <div className="plan-citations">
                    {requirement.sources.map((source) => (
                      <a
                        href={source.url}
                        key={source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.title} ↗{" "}
                        <small>
                          {source.reviewed
                            ? `Reviewed ${source.reviewed}`
                            : "Review pending"}
                        </small>
                      </a>
                    ))}
                  </div>
                  <button
                    className="button secondary"
                    disabled={requirement.needsReview}
                    onClick={() =>
                      setCompleted((previous) =>
                        previous.includes(requirement.id)
                          ? previous.filter((id) => id !== requirement.id)
                          : [...previous, requirement.id],
                      )
                    }
                  >
                    {completed.includes(requirement.id)
                      ? "Undo reported completion"
                      : "Report this step complete"}
                  </button>
                </div>
              </details>
            ))}
            <p className="small">
              Completion is reported by you and kept only for this session. A
              share link recreates the plan on another device; it does not share
              employee records or completion.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
