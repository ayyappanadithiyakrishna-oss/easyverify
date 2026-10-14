"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, ArrowUp, BookOpen } from "lucide-react";
import {
  helpAnswer,
  llamaMessages,
  sensitiveQuestion,
  groundedAnswer,
  type HelpAnswer,
} from "@/lib/help";
type Entry = HelpAnswer & { question: string; engine: string };
export function HelpPanel({ full = false }: { full?: boolean }) {
  const [open, setOpen] = useState(full);
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
  const [modelChoice, setModelChoice] = useState("fast");
  const modelName = modelChoice === "llama" ? "Llama 3.2" : "SmolLM2";
  const [modelReady, setModelReady] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState("");
  const [partial, setPartial] = useState("");
  const worker = useRef<Worker | null>(null);
  const pending = useRef<{
    resolve: (answer: string) => void;
    reject: (error: Error) => void;
  } | null>(null);
  useEffect(
    () => () => {
      worker.current?.terminate();
      pending.current?.reject(new Error("Chat closed."));
    },
    [],
  );
  function getWorker() {
    if (!worker.current) {
      worker.current = new Worker("/llama-worker.js", { type: "module" });
      worker.current.onmessage = (event) => {
        const data = event.data;
        if (data.type === "chunk")
          setPartial((previous) => previous + data.text);
        if (data.type === "status") setModelStatus(data.text);
        if (data.type === "ready") {
          setModelReady(true);
          setModelLoading(false);
          setModelStatus(`${modelName} is ready on this device.`);
        }
        if (data.type === "answer") {
          pending.current?.resolve(data.answer);
          pending.current = null;
        }
        if (data.type === "error") {
          setModelLoading(false);
          setError(data.message);
          pending.current?.reject(new Error(data.message));
          pending.current = null;
        }
      };
      worker.current.onerror = (event) => {
        setModelLoading(false);
        setError(
          event.message || "This browser could not start the local model.",
        );
        pending.current?.reject(new Error("Local model unavailable."));
        pending.current = null;
      };
    }
    return worker.current;
  }
  function loadModel() {
    setError("");
    setModelLoading(true);
    getWorker().postMessage({ type: "load", model: modelChoice });
  }
  function generate(messages: { role: string; content: string }[]) {
    return new Promise<string>((resolve, reject) => {
      pending.current = { resolve, reject };
      getWorker().postMessage({
        type: "generate",
        messages,
        model: modelChoice,
      });
    });
  }
  function stopModel() {
    worker.current?.terminate();
    worker.current = null;
    pending.current?.reject(new Error("Local generation stopped."));
    pending.current = null;
    setModelLoading(false);
    setModelReady(false);
    setModelStatus("");
  }

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function ask(value: string) {
    if (!value.trim() || busy) return;
    setQuestion("");
    setError("");
    setBusy(true);
    setPartial("");
    const reference = helpAnswer(value);
    let answer = reference.answer;
    let engine = "Rule reference";
    if (modelReady && !sensitiveQuestion(value)) {
      try {
        const referenceMessage = llamaMessages(value, reference);
        const history = entries
          .slice(-2)
          .filter((entry) => !sensitiveQuestion(entry.question))
          .flatMap((entry) => [
            { role: "user", content: entry.question },
            { role: "assistant", content: entry.answer },
          ]);
        answer = await generate([
          referenceMessage[0],
          ...history,
          referenceMessage[1],
        ]);
        if (!groundedAnswer(answer, reference.answer))
          throw new Error(
            "The model’s answer did not match the rule reference. Showing the reference instead.",
          );
        engine = `${modelName} · in this browser`;
      } catch (error) {
        answer = reference.answer;
        setPartial("");
        setError(
          error instanceof Error
            ? error.message
            : "Local model failed; showing the cited reference.",
        );
      }
    } else if (local && !sensitiveQuestion(value)) {
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
    <div
      className={full ? "assistant-widget assistant-full" : "assistant-widget"}
    >
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
              <strong>Chat with EasyVerify</strong>
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
              Ask about a step, compare situations, and ask follow-up questions.
              Keep names and identity information out of chat.
            </p>
            {!modelReady && (
              <div className="model-onboarding">
                <strong>A local chatbot, inside EasyVerify.</strong>
                <label>
                  Model
                  <select
                    value={modelChoice}
                    disabled={modelLoading}
                    onChange={(e) => {
                      stopModel();
                      setModelChoice(e.target.value);
                    }}
                  >
                    <option value="fast">Fast local chat · SmolLM2</option>
                    <option value="llama">Llama 3.2 · larger model</option>
                  </select>
                </label>
                <p className="small">
                  {modelChoice === "llama"
                    ? "Built with Llama 3.2. About 1.7 GB to download; startup and CPU answers can be slow."
                    : "A smaller instruction model, about 137 MB to download, for more accessible local chat."}{" "}
                  Answers run in this browser, without Ollama or an account.
                  Your browser may cache the model if storage permits.
                </p>
                <button
                  className="button full"
                  disabled={modelLoading}
                  onClick={loadModel}
                >
                  {modelLoading ? "Loading local AI…" : `Load ${modelName}`}
                </button>
              </div>
            )}
            {modelStatus && (
              <p role="status" className="small">
                {modelStatus}
              </p>
            )}
            {entries.length > 0 && (
              <button
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setEntries([]);
                  setError("");
                  setPartial("");
                }}
              >
                New conversation
              </button>
            )}
            {(modelLoading || modelReady) && (
              <button className="text-button" onClick={stopModel}>
                Stop local model
              </button>
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
                  {/Llama|SmolLM2/.test(entry.engine) && (
                    <details>
                      <summary>Read the source-guide reference</summary>
                      <p>{helpAnswer(entry.question).answer}</p>
                    </details>
                  )}
                </article>
              ))}
              {busy && (
                <div className="help-answer">
                  <p>
                    {partial
                      ? "The local model is drafting an answer…"
                      : "Preparing your answer…"}
                  </p>
                </div>
              )}
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
            <summary>Advanced: desktop Ollama</summary>
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
      {!full && (
        <button
          ref={launcher}
          className="help-launcher"
          aria-controls="help-panel"
          aria-expanded={open}
          aria-label={open ? "Close source guide" : "Chat with EasyVerify"}
          onClick={() => setOpen(!open)}
        >
          <MessageCircle size={19} />
          <span>Ask EasyVerify</span>
        </button>
      )}
    </div>
  );
}

export function HelpWidget() {
  const pathname = usePathname();
  return pathname === "/assistant" ? null : <HelpPanel />;
}
