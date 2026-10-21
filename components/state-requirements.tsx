"use client";
import { useState } from "react";
import { states } from "@/lib/validation";
import { stateCoverage, stateNames } from "@/lib/state-laws";
import { rules } from "@/lib/rules";

export function StateRequirements() {
  const [state, setState] = useState("CA");
  const applicable = rules.filter(
    (rule) =>
      rule.id === `state-${state.toLowerCase()}` ||
      (state === "CA" && rule.id.startsWith("ca-")),
  );
  return (
    <section className="state-requirements" aria-labelledby="state-heading">
      <h2 id="state-heading">Your state changes the process</h2>
      <p>
        Check enrollment and restrictions before opening a case. A state
        mandate, a federal contract clause, and voluntary enrollment are
        separate reasons to participate.
      </p>
      <label htmlFor="case-state">State where the employee works</label>
      <select
        id="case-state"
        value={state}
        onChange={(event) => setState(event.target.value)}
      >
        {states.map((code) => (
          <option key={code} value={code}>
            {stateNames[code]} ({code})
          </option>
        ))}
      </select>
      <p role="status" className="callout">
        {stateCoverage(state)}
      </p>
      {applicable.map((rule) => (
        <article key={rule.id}>
          <h3>{rule.title}</h3>
          <p>{rule.summary}</p>
          <ul>
            {rule.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          <p className="small">
            Applicability needs review: this guide does not collect all employer
            categories, in-state employee counts, state contracts, or
            exceptions.
          </p>
          {rule.sources.map((source) => (
            <p key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title} ↗
              </a>
              <br />
              <small>
                {source.citation} ·{" "}
                {source.reviewed
                  ? `Source reviewed ${source.reviewed}`
                  : "Statutory review pending"}
              </small>
            </p>
          ))}
        </article>
      ))}
      <p>
        <a href="/plan">
          Build a hiring plan with your state and business details →
        </a>
      </p>
    </section>
  );
}
