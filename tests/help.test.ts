import { test } from "node:test";
import assert from "node:assert/strict";
import { helpAnswer, llamaMessages, groundedAnswer } from "../lib/help";
const now = new Date("2026-10-14T12:00:00Z");
test("source guide links employer section two to its actual citation", () => {
  const result = helpAnswer("When is Section 2 due?", now);
  assert.match(result.answer, /three business days/);
  assert.ok(result.sources[0].url.includes("completing-section-2"));
});
test("contract and California questions retain review notices and citations", () => {
  assert.ok(helpAnswer("contractor FAR", now).sources.length);
  const result = helpAnswer("California 2814", now);
  assert.match(result.answer, /awaiting verification/);
  assert.ok(result.sources.some((source) => source.reviewed === null));
});
test("expired source reviews cannot silently appear current in chat", () => {
  assert.match(
    helpAnswer("Section 1", new Date("2027-02-01")).answer,
    /review item/,
  );
});
test("sensitive-information requests are excluded from model context", () => {
  const answer = helpAnswer("Here is my SSN", now);
  assert.equal(answer.sources.length, 0);
  assert.ok(
    !llamaMessages("My SSN 123-45-6789", answer)[1].content.includes(
      "123-45-6789",
    ),
  );
  assert.match(answer.answer, /leave identity numbers/);
  assert.match(
    llamaMessages("Section 1", helpAnswer("Section 1", now))[0].content,
    /ONLY/,
  );
});

test("unrelated model output cannot be presented as cited guidance", () => {
  const reference = helpAnswer("Section 1", now).answer;
  assert.equal(
    groundedAnswer(
      "A typical working day in Brussels. Cafes serve breakfast.",
      reference,
    ),
    false,
  );
  assert.equal(
    groundedAnswer(
      "The employee completes Section 1 on the first day of paid work.",
      reference,
    ),
    true,
  );
  assert.equal(
    groundedAnswer(
      "The employee completes Section 1 after 99 days of paid work.",
      reference,
    ),
    false,
  );
});

test("model cannot reverse an employee completion obligation", () => {
  assert.equal(
    groundedAnswer(
      "The employee does not complete Section 1 on the first day of paid work.",
      helpAnswer("Section 1", now).answer,
    ),
    false,
  );
  assert.equal(
    groundedAnswer(
      "Review Section 2 within 3 business days after paid work begins.",
      helpAnswer("Section 2", now).answer,
    ),
    true,
  );
});

test("a topical answer cannot replace the first-workday deadline with offer acceptance", () => {
  const reference = helpAnswer("When is Section 1 due?", now).answer;
  assert.equal(
    groundedAnswer(
      "When is Section 1 due? The correct time period for Section 1 is when the employee accepts the offer.",
      reference,
    ),
    false,
  );
  assert.equal(
    groundedAnswer(
      "The employee completes Section 1 on the first day of paid work after accepting the offer.",
      reference,
    ),
    true,
  );
  assert.equal(
    groundedAnswer(
      "Complete Section 1 on the first day before accepting the offer.",
      reference,
    ),
    false,
  );
});
test("mismatch explanations cannot introduce an adverse-action instruction", () => {
  const reference = helpAnswer("What does a TNC mean?", now).answer;
  assert.equal(
    groundedAnswer(
      "A tentative nonconfirmation means you should terminate the employee while the case is pending.",
      reference,
    ),
    false,
  );
});
