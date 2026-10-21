import assert from "node:assert/strict";
import test from "node:test";
import { CASE_RESULTS, caseDueDate } from "../lib/case-guide";

test("case is due on the third business day after paid work begins", () => {
  assert.equal(caseDueDate("2026-10-19"), "2026-10-22");
});

test("weekends do not count toward the three days", () => {
  assert.equal(caseDueDate("2026-10-22"), "2026-10-27");
});

test("company closures push the due date out", () => {
  assert.equal(
    caseDueDate("2026-10-19", { closures: ["2026-10-20"] }),
    "2026-10-23",
  );
});

test("every result explains what the employer should do", () => {
  for (const r of CASE_RESULTS) assert.ok(r.employer.length > 0, r.id);
});

test("a tentative nonconfirmation never says the person cannot work", () => {
  const tnc = CASE_RESULTS.find((r) => r.id === "tnc")!;
  assert.match(tnc.meaning, /does not by itself mean/);
  assert.ok(tnc.employer.some((l) => /no adverse action/i.test(l)));
});
