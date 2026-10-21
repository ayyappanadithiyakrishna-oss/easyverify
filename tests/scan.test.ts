import assert from "node:assert/strict";
import test from "node:test";
import {
  AGREEMENT,
  applyResult,
  caseNumberSchema,
  emailContent,
  makeRecord,
  newToken,
  readToken,
  statusOf,
} from "../lib/scan";

const base = () => {
  const { id, token } = newToken();
  return {
    token,
    record: makeRecord({
      id,
      hireName: "Jordan Sample",
      businessName: "Riverside Workshop",
      caseNumber: "2026289123456",
    }),
  };
};

test("a signed link verifies and returns its session id", () => {
  const { token, record } = base();
  assert.equal(readToken(token), record.id);
});

test("tampered, truncated, or extended tokens are rejected", () => {
  const { token } = base();
  const [id, sig] = token.split(".");
  assert.equal(readToken(`${id}.${sig.slice(0, -1)}A`), null);
  assert.equal(readToken(`${id}.${sig.slice(1)}`), null);
  assert.equal(readToken(`${id}.${sig}.x`), null);
  assert.equal(readToken(`AAAAAAAAAAAAAAAA.${sig}`), null);
  assert.equal(readToken(""), null);
});

test("status moves waiting -> opened -> completed, and expires", () => {
  const { record } = base();
  assert.equal(statusOf(record), "waiting");
  assert.equal(statusOf({ ...record, openedAt: "2026-10-20T00:00:00Z" }), "opened");
  const done = applyResult(record, { similarity: 0.7, warnings: 0 });
  assert.equal(statusOf(done), "completed");
  const later = new Date(Date.parse(record.expiresAt) + 1000);
  assert.equal(statusOf(record, later), "expired");
  assert.equal(statusOf(done, later), "completed");
});

test("the stored band is computed on the server, not supplied by the client", () => {
  const { record } = base();
  assert.equal(applyResult(record, { similarity: 0.7, warnings: 0 }).result?.band, "strong");
  assert.equal(applyResult(record, { similarity: 0.05, warnings: 1 }).result?.band, "different");
});

test("a result never stores photos, an email address, or extra fields", () => {
  const { record } = base();
  const done = applyResult(record, { similarity: 0.5, warnings: 2 });
  assert.deepEqual(Object.keys(done.result!).sort(), ["band", "similarity", "warnings"]);
  assert.ok(!("email" in done));
});

test("case numbers accept ids and reject junk", () => {
  assert.ok(caseNumberSchema.safeParse("2026289123456").success);
  assert.ok(caseNumberSchema.safeParse("2026-289-123456").success);
  assert.ok(!caseNumberSchema.safeParse("123").success);
  assert.ok(!caseNumberSchema.safeParse("<script>alert(1)</script>").success);
});

test("the email carries the agreement and escapes names", () => {
  const mail = emailContent({
    hireName: '<b>"Jo"</b>',
    businessName: "A & B",
    url: "https://easyverify.vercel.app/check/abc.def",
  });
  for (const line of AGREEMENT) assert.ok(mail.text.includes(line));
  assert.ok(!mail.html.includes("<b>"));
  assert.ok(mail.html.includes("&#38;"));
  assert.ok(mail.html.includes("/check/abc.def"));
});
