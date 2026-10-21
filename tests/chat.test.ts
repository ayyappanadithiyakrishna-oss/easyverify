import test from "node:test";
import assert from "node:assert/strict";
import { chatContext, conversationMessages, downloadLabel } from "../lib/chat";
import { helpAnswer } from "../lib/help";
import { CHAT_MODELS } from "../lib/chat-models";

test("general questions are allowed without being forced into a hiring FAQ", () => {
  for (const question of [
    "Explain photosynthesis",
    "Write a birthday message",
    "Help me learn Python",
  ]) {
    assert.equal(chatContext(question, []).grounded, false);
    const messages = conversationMessages(
      question,
      helpAnswer(question),
      [],
      false,
    );
    assert.equal(messages.at(-1)!.content, question);
    assert.doesNotMatch(messages[0].content, /one sentence|ONLY/);
  }
});
test("compliance follow-ups retain scope across multiple turns", () => {
  const history = [
    {
      question: "When is Section 2 due?",
      answer: "Three business days",
      grounded: true,
    },
    {
      question: "Explain that",
      answer: "After paid work begins",
      grounded: true,
    },
  ];
  const mode = chatContext("Make it shorter", history);
  assert.equal(mode.grounded, true);
  assert.match(mode.retrievalQuestion, /Section 2/);
  const messages = conversationMessages(
    "Make it shorter",
    helpAnswer(mode.retrievalQuestion),
    history,
    true,
  );
  assert.match(messages[0].content, /ONLY/);
  assert.match(messages.at(-1)!.content, /Reference/);
});
test("history is bounded and sensitive input stays out of model messages", () => {
  const history = Array.from({ length: 12 }, (_, i) => ({
    question: `Question ${i}`,
    answer: "Answer",
  }));
  const messages = conversationMessages(
    "Hello",
    helpAnswer("Hello"),
    history,
    false,
  );
  assert.equal(messages.length, 10);
  const sensitive = conversationMessages(
    "SSN 123-45-6789",
    helpAnswer("SSN"),
    [{ question: "SSN 555-55-5555", answer: "private" }],
    true,
  );
  assert.doesNotMatch(JSON.stringify(sensitive), /123-45|555-55/);
});
test("model revisions are immutable and compact modes avoid a gigabyte download", () => {
  for (const model of Object.values(CHAT_MODELS)) {
    assert.match(model.revision, /^[a-f0-9]{40}$/);
    assert.ok(model.bytes < 400_000_000);
    assert.ok(model.gpuBytes < model.bytes);
  }
  assert.equal(downloadLabel(10_000_000, 20_000_000), "10.0 / 20.0 MB");
});

test("mismatch and case-process questions return useful official references", () => {
  const tnc = helpAnswer("What does a TNC mean?");
  assert.match(tnc.answer, /no adverse action/i);
  assert.ok(
    tnc.sources.some((source) => source.url.includes("verification-process")),
  );
  assert.match(
    helpAnswer("Final nonconfirmation").answer,
    /^Final Nonconfirmation/,
  );
  assert.match(
    helpAnswer("What should I do before a new hire starts?").answer,
    /Section 1/,
  );
});
