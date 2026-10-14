import test from "node:test";
import assert from "node:assert/strict";
import { addBusinessDays, section2Target } from "../support/dates.mjs";
test("official Monday-to-Thursday example", () =>
  assert.equal(section2Target("2026-10-19"), "2026-10-22"));
test("Friday spans a weekend", () =>
  assert.equal(section2Target("2026-10-23"), "2026-10-28"));
test("short jobs are due on hire date", () =>
  assert.equal(
    section2Target("2026-10-23", { jobLastsLessThanThreeDays: true }),
    "2026-10-23",
  ));
test("calendar handles year boundary", () =>
  assert.equal(addBusinessDays("2026-12-31", 3), "2027-01-05"));
test("configured closure shifts target", () =>
  assert.equal(
    addBusinessDays("2026-10-19", 3, { closures: ["2026-10-20"] }),
    "2026-10-23",
  ));
test("Saturday-working business has a different target", () =>
  assert.equal(
    addBusinessDays("2026-10-23", 3, { workingDays: [1, 2, 3, 4, 5, 6] }),
    "2026-10-27",
  ));
test("invalid date and impossible calendar are rejected", () => {
  assert.throws(() => addBusinessDays("2026-02-30", 3));
  assert.throws(() => addBusinessDays("2026-10-19", 3, { workingDays: [] }));
  assert.throws(() => addBusinessDays("2026-10-19", -1));
  assert.throws(() =>
    section2Target("2026-10-19", { jobLastsLessThanThreeDays: "false" }),
  );
});
test("zero days returns validated starting date", () =>
  assert.equal(addBusinessDays("2028-02-29", 0), "2028-02-29"));
