import test from "node:test";
import assert from "node:assert/strict";
import { stateLaws, stateNames, stateCoverage } from "../lib/state-laws";
import { states } from "../lib/validation";
import { rules } from "../lib/rules";
import { evaluate } from "../lib/engine";
import { helpAnswer } from "../lib/help";
import { planReference } from "../lib/public-plan";
import type { Profile } from "../lib/types";
const profile: Profile = {
  name: "Test",
  state: "FL",
  headcount: 25,
  contractor: "none",
  far: "no",
  participation: "no",
  calendar: "weekdays",
  closures: [],
};
const hire = {
  hire_date: "2026-10-20",
  termination_date: null,
  short_job: false,
};
test("every selectable state has named guidance or an explicit review task", () => {
  for (const state of states) {
    assert.ok(stateNames[state]);
    const applicable = evaluate(
      { ...profile, state },
      hire,
      rules,
      "2026-10-20",
    ).filter(
      (r) =>
        r.result === "matched" &&
        r.jurisdictions.some(
          (j) => j !== "Federal" && j !== "Federal contract",
        ),
    );
    assert.ok(applicable.length, state);
    assert.ok(
      applicable.every((r) => r.needsReview && r.due === null),
      state,
    );
  }
});
test("state mandate review does not invent enrollment or replace I-9 deadlines", () => {
  for (const headcount of [24, 25, 26]) {
    const result = evaluate(
      { ...profile, headcount },
      hire,
      rules,
      "2026-10-20",
    );
    assert.equal(
      result.find((r) => r.id === "everify-case")!.result,
      "unmatched",
    );
    assert.equal(result.find((r) => r.id === "i9-section2")!.due, "2026-10-23");
    assert.match(
      result.find((r) => r.id === "state-fl")!.summary,
      /25 or more/,
    );
  }
});
test("state summaries preserve threshold bases and separate recordkeeping periods", () => {
  assert.match(stateLaws.NC.summary, /in North Carolina/);
  assert.match(stateLaws.NC.summary, /nine months/);
  assert.match(stateLaws.AZ.summary, /whichever is longer/);
  assert.match(stateLaws.VA.summary, /more than 50/);
  assert.match(stateLaws.VA.summary, /previous 12 months/);
  assert.match(stateLaws.FL.actions.join(" "), /outage/);
});
test("unreviewed states never imply no state mandate", () => {
  assert.match(stateCoverage("TX"), /not a finding/);
  assert.equal(
    helpAnswer("West Virginia E-Verify laws").sources[0].reviewed,
    null,
  );
  assert.match(helpAnswer("CA E-Verify law").answer, /California/);
  const answer = helpAnswer("Texas E-Verify laws");
  assert.match(answer.answer, /review/i);
  assert.equal(answer.sources[0].reviewed, null);
});
test("chat routes full state names and uppercase codes, without treating ordinary words as states", () => {
  for (const query of [
    "Florida law",
    "FL E-Verify",
    "North Carolina requirements",
    "Virginia public contract",
  ]) {
    const answer = helpAnswer(query, new Date("2026-10-20"));
    assert.ok(
      answer.sources.some((s) => s.reviewed === "2026-10-20"),
      query,
    );
  }
  assert.match(
    helpAnswer("When is Section 1 due in my plan?").answer,
    /employee completes Section 1/,
  );
});
test("plan-specific state law questions retain the selected state and source", () => {
  const reference = planReference("state enrollment law", {
    profile,
    hireDate: hire.hire_date,
    shortJob: false,
  });
  assert.match(reference.answer, /Florida/);
  assert.ok(reference.sources.some((s) => s.url.includes("0448.095")));
});
