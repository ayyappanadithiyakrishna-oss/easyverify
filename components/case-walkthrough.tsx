"use client";
import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  CASE_RESULTS,
  CASE_SOURCES,
  CASE_STEPS,
  PHOTO_DOCUMENTS,
  caseDueDate,
} from "@/lib/case-guide";

const today = () => new Date().toISOString().slice(0, 10);

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function CaseWalkthrough() {
  const [start, setStart] = useState(today());
  let due: string | null = null;
  try {
    due = caseDueDate(start);
  } catch {
    due = null;
  }

  return (
    <>
      <section className="case-due" aria-labelledby="due-heading">
        <h2 id="due-heading">When is the case due?</h2>
        <label htmlFor="case-start">First day of paid work</label>
        <input
          id="case-start"
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <p className="case-due-answer" role="status">
          {due ? (
            <>
              Create the case by <strong>{formatDate(due)}</strong>.
            </>
          ) : (
            "Choose a valid date."
          )}
        </p>
        <p className="small">
          Weekdays only, not counting company closures. Never before the offer
          is accepted and Form I-9 is complete.
        </p>
      </section>

      <section aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="case-heading">
          Six steps, in order
        </h2>
        <ol className="case-steps">
          {CASE_STEPS.map((step) => (
            <li key={step.id}>
              <span className="step-when">{step.who}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="case-photo">
          <h3>Photo matching applies to</h3>
          <ul>
            {PHOTO_DOCUMENTS.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="results-heading">
        <h2 id="results-heading" className="case-heading">
          What each result means
        </h2>
        <Tabs.Root defaultValue={CASE_RESULTS[0].id} className="case-results">
          <Tabs.List className="case-tabs" aria-label="Case results">
            {CASE_RESULTS.map((r) => (
              <Tabs.Trigger key={r.id} value={r.id} className="case-tab">
                {r.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {CASE_RESULTS.map((r) => (
            <Tabs.Content key={r.id} value={r.id} className="case-panel">
              <span className={`result-dot ${r.tone}`} aria-hidden="true" />
              <h3>{r.label}</h3>
              <p>{r.meaning}</p>
              <h4>Employer</h4>
              <ul>
                {r.employer.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <h4>Employee</h4>
              <p>{r.employee}</p>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </section>

      <p className="small case-sources">
        Paraphrased from{" "}
        <a href={CASE_SOURCES.process.url}>{CASE_SOURCES.process.title}</a>, the{" "}
        <a href={CASE_SOURCES.video.url}>USCIS video</a> and the{" "}
        <a href={CASE_SOURCES.manual.url}>User Manual</a>. EasyVerify is not
        connected to E-Verify and cannot create or submit a case. Use the
        official system, and check its pages for current rules.
      </p>
    </>
  );
}
