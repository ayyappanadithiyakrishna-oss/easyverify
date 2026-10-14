import test from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "../lib/navigation";
test("callback keeps legitimate same-origin onboarding routes", () =>
  assert.equal(safeNext("/onboarding?token=abc"), "/onboarding?token=abc"));
test("callback blocks external, protocol-relative, backslash, and control-character redirects", () => {
  for (const next of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
  ])
    assert.equal(safeNext(next), "/workspace");
});
