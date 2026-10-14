import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sharePlan,
  readSharedPlan,
  planHire,
  type PublicPlan,
} from "../lib/public-plan";
const plan: PublicPlan = {
  profile: {
    name: "Private business name",
    state: "CA",
    headcount: 4,
    contractor: "none",
    far: "no",
    participation: "unknown",
    calendar: "weekdays",
    closures: ["2026-12-25"],
  },
  hireDate: "2026-10-19",
  shortJob: false,
};
test("share links round-trip rule inputs without business names or employee data", () => {
  const encoded = sharePlan(plan);
  assert.ok(!encoded.includes("Private business"));
  const read = readSharedPlan(encoded)!;
  assert.equal(read.hireDate, plan.hireDate);
  assert.deepEqual(read.profile.closures, plan.profile.closures);
  assert.equal(read.profile.participation, "unknown");
  assert.equal(planHire(read).offer_accepted, true);
});
test("untrusted share links reject contradictory contracts and imaginary dates", () => {
  assert.equal(readSharedPlan("{invalid"), null);
  assert.equal(
    readSharedPlan(JSON.stringify({ ...plan, hireDate: "2026-02-30" })),
    null,
  );
  assert.equal(
    readSharedPlan(
      JSON.stringify({ ...plan, profile: { ...plan.profile, far: "yes" } }),
    ),
    null,
  );
  assert.equal(readSharedPlan("x".repeat(4097)), null);
});
