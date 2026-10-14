import test from "node:test";
import assert from "node:assert/strict";
import { evaluate, match, retentionTarget, status } from "../lib/engine";
import { rules } from "../lib/rules";
import { profileSchema, hireSchema } from "../lib/validation";
import type { Profile, Rule } from "../lib/types";
const p: Profile = {
  name: "Test",
  state: "CA",
  headcount: 18,
  contractor: "none",
  far: "no",
  participation: "yes",
  calendar: "weekdays",
  closures: [],
};
const hire = {
  hire_date: "2026-10-19",
  termination_date: null,
  short_job: false,
};
const now = "2026-10-13";
test("unknown answers remain unresolved rather than false", () => {
  const m = match({ field: "far", equals: "yes" }, { ...p, far: "unknown" });
  assert.equal(m.result, null);
  assert.match(m.trace[0], /unresolved/);
});
test("all/any conditions preserve three-valued logic", () => {
  assert.equal(
    match(
      {
        all: [
          { field: "far", equals: "yes" },
          { field: "participation", equals: "no" },
        ],
      },
      { ...p, far: "unknown" },
    ).result,
    false,
  );
  assert.equal(
    match(
      {
        any: [
          { field: "far", equals: "yes" },
          { field: "participation", equals: "yes" },
        ],
      },
      { ...p, far: "unknown" },
    ).result,
    true,
  );
});
test("ordinary employer gets the deadline in a state without CA composition", () => {
  const r = evaluate({ ...p, state: "AZ" }, hire, rules, now).find(
    (r) => r.id === "everify-case",
  )!;
  assert.equal(r.result, "matched");
  assert.equal(r.due, "2026-10-22");
});
test("contractor never receives the ordinary case deadline", () => {
  const rr = evaluate(
    { ...p, contractor: "subcontractor", far: "yes" },
    hire,
    rules,
    now,
  );
  assert.equal(rr.find((r) => r.id === "everify-case")!.result, "unmatched");
  assert.equal(rr.find((r) => r.id === "contractor")!.needsReview, true);
});
test("unknown FAR clause remains review, with no ordinary timeline", () => {
  const r = evaluate({ ...p, far: "unknown" }, hire, rules, now).find(
    (r) => r.id === "everify-case",
  )!;
  assert.equal(r.result, "unresolved");
  assert.equal(r.due, null);
  assert.equal(r.needsReview, true);
});
test("California composition retains citations and unresolved source status", () => {
  const rr = evaluate(p, hire, rules, now);
  const r = rr.find((r) => r.id === "everify-case")!;
  assert.deepEqual(r.ruleIds, ["everify-case", "ca-prescreen"]);
  assert.equal(r.sources.length, 2);
  assert.equal(r.needsReview, true);
  assert.equal(r.due, null);
  assert.equal(rr.find((r) => r.id === "ca-prescreen")!.result, "unmatched");
});
test("verified restriction composition preserves the actual business-day deadline", () => {
  const copy = structuredClone(rules);
  const ca = copy.find((r) => r.id === "ca-prescreen")!;
  ca.reviewOnly = false;
  ca.sources[0].reviewed = now;
  const r = evaluate(p, hire, copy, now).find((r) => r.id === "everify-case")!;
  assert.equal(r.needsReview, false);
  assert.equal(r.due, "2026-10-22");
});
test("stale sources change actionable items to review and suppress dates", () => {
  const r = evaluate(p, hire, rules, "2027-03-01").find(
    (r) => r.id === "i9-section2",
  )!;
  assert.equal(r.needsReview, true);
  assert.equal(r.due, null);
});
test("short job target is the hire day", () =>
  assert.equal(
    evaluate(p, { ...hire, short_job: true }, rules, now).find(
      (r) => r.id === "i9-section2",
    )!.due,
    "2026-10-19",
  ));
test("retention uses later of hire plus 3 years or termination plus 1", () => {
  assert.equal(retentionTarget("2026-01-01", "2026-06-01"), "2029-01-01");
  assert.equal(retentionTarget("2026-01-01", "2029-06-01"), "2030-06-01");
  assert.equal(retentionTarget("2026-01-01", null), null);
  assert.equal(retentionTarget("2024-02-29", "2024-03-01"), "2027-02-28");
});
test("review status overrides a reported checkbox", () => {
  const r = evaluate(p, hire, rules, now).find((r) => r.id === "contractor")!;
  assert.equal(status({ ...r, needsReview: true }, true, now), "Needs review");
});
test("input validation rejects imaginary dates and contradictory contracts", () => {
  assert.equal(profileSchema.safeParse({ ...p, far: "yes" }).success, false);
  assert.equal(
    profileSchema.safeParse({ ...p, headcount: 1.5 }).success,
    false,
  );
  assert.equal(
    hireSchema.safeParse({
      name: "Test",
      email: "x@example.com",
      hire_date: "2026-02-30",
      short_job: false,
      offer_accepted: true,
    }).success,
    false,
  );
});
test("unknown contractor response cannot be manufactured into confirmed no-clause", () => {
  const draft = profileSchema.parse({
    ...p,
    contractor: "unknown",
    far: "unknown",
  });
  assert.equal(
    evaluate(draft, hire, rules, now).find((r) => r.id === "contractor")!
      .result,
    "unresolved",
  );
});
test("missing rule conditions do not execute arbitrary JavaScript", () => {
  const rule: Rule = {
    ...rules[0],
    condition: { all: [{ field: "name", equals: "process.exit()" }] },
  };
  assert.equal(evaluate(p, hire, [rule], now)[0].result, "unmatched");
});
