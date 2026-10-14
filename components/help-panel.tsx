"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, ArrowUp, BookOpen } from "lucide-react";
import {
  helpAnswer,
  llamaMessages,
  sensitiveQuestion,
  type HelpAnswer,
} from "@/lib/help";
type Entry = HelpAnswer & { question: string; engine: string };
export function HelpPanel() {
  const [open, setOpen] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) document.getElementById("help-question")?.focus();
  }, [open]);
  function close() {
    setOpen(false);
    launcher.current?.focus();
  }
  const [question, setQuestion] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [local, setLocal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function ask(value: string) {
    if (!value.trim() || busy) return;
    setQuestion("");
    setError("");
    setBusy(true);
    const reference = helpAnswer(value);
    let answer = reference.answer;
    let engine = "Source guide";
    if (local && !sensitiveQuestion(value)) {
      try {
        const result = await fetch("http://127.0.0.1:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3.2:3b",
            messages: llamaMessages(value, reference),
            stream: false,
            options: { temperature: 0, num_predict: 200, num_ctx: 2048 },
          }),
          signal: AbortSignal.timeout(90000),
        });
        if (!result.ok) throw new Error("Ollama could not answer.");
        const data = await result.json();
        if (
          typeof data.message?.content !== "string" ||
          !data.message.content.trim()
        )
          throw new Error("Ollama returned an empty answer.");
        answer = data.message.content.slice(0, 3000);
        engine = "Llama 3.2 · this computer";
      } catch {
        setError(
          "Could not reach this computer’s Ollama. Your browser may need local-network permission, and Ollama must be running with the EasyVerify origin allowed. Showing the source guide instead.",
        );
      }
    }
    setEntries((previous) => [
      ...previous.slice(-5),
      { question: value, answer, sources: reference.sources, engine },
    ]);
    setBusy(false);
  }
  return (
    <div className="assistant-widget">
      {open && (
        <section
          id="help-panel"
          className="help-panel"
          aria-label="EasyVerify help"
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
        >
          <header>
            <div>
              <BookOpen size={18} />
              <strong>Ask the source guide</strong>
            </div>
            <button
              className="icon-button"
              aria-label="Close help"
              onClick={close}
            >
              <X size={18} />
            </button>
          </header>
          <div className="help-content">
            <p className="small">
              Understand a step, find its source, or learn your way around. Keep
              names and identity information out of chat.
            </p>
            {!entries.length && (
              <div className="help-prompts">
                {[
                  "When is Section 2 due?",
                  "How do I invite a new hire?",
                  "What changes for a contractor?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => ask(prompt)}
                    disabled={busy}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            <div aria-live="polite">
              {entries.map((entry, index) => (
                <article className="help-answer" key={index}>
                  <strong>{entry.question}</strong>
                  <p>{entry.answer}</p>
                  <small>{entry.engine}</small>
                  {entry.sources.length > 0 && (
                    <ul>
                      {entry.sources.map((source) => (
                        <li key={source.url}>
                          <a href={source.url} target="_blank" rel="noreferrer">
                            {source.title}
                          </a>
                          <small>
                            {source.reviewed
                              ? `Reviewed ${source.reviewed}`
                              : "Awaiting source verification"}
                          </small>
                        </li>
                      ))}
                    </ul>
                  )}
                  {entry.engine.startsWith("Llama") && (
                    <details>
                      <summary>Read the source-guide reference</summary>
                      <p>{helpAnswer(entry.question).answer}</p>
                    </details>
                  )}
                </article>
              ))}
              {busy && <p>Preparing your answer…</p>}
            </div>
            {error && (
              <p role="status" className="small">
                {error}
              </p>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
          >
            <label className="sr-only" htmlFor="help-question">
              Your question
            </label>
            <input
              id="help-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about a step…"
              maxLength={600}
              required
            />
            <button
              className="icon-button"
              aria-label="Ask question"
              disabled={busy || !question.trim()}
            >
              <ArrowUp size={19} />
            </button>
          </form>
          <details className="help-options">
            <summary>Local Llama 3.2</summary>
            <p className="small">
              Optional: send this question and its rule reference to Ollama
              running on this computer. No workspace records are sent. Local
              answers require manual review; source text remains available
              above.
            </p>
            <label>
              <input
                type="checkbox"
                checked={local}
                onChange={(e) => setLocal(e.target.checked)}
              />{" "}
              Use this computer’s Ollama
            </label>
            <a href="/sources#local-assistant">Connection instructions</a>
          </details>
        </section>
      )}
      <button
        ref={launcher}
        className="help-launcher"
        aria-controls="help-panel"
        aria-expanded={open}
        aria-label={open ? "Close source guide" : "Ask the source guide"}
        onClick={() => setOpen(!open)}
      >
        <MessageCircle size={19} />
        <span>Ask EasyVerify</span>
      </button>
    </div>
  );
}
