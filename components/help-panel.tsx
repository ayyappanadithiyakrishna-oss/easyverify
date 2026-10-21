"use client";
import {
  planReference,
  readSharedPlan,
  type PublicPlan,
} from "@/lib/public-plan";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  ArrowUp,
  Square,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  helpAnswer,
  sensitiveQuestion,
  groundedAnswer,
  type HelpAnswer,
} from "@/lib/help";
import { chatContext, conversationMessages, downloadLabel } from "@/lib/chat";
import { CHAT_MODELS, type ChatModel } from "@/lib/chat-models";

type Entry = HelpAnswer & {
  question: string;
  engine: string;
  reference: string;
  grounded: boolean;
};
type Download = {
  file: string;
  loaded: number;
  total: number;
  progress: number;
};
const starters = [
  "Explain E-Verify in plain English",
  "Help me write a welcome email",
  "What should I do before a new hire starts?",
];

export function HelpPanel({ full = false }: { full?: boolean }) {
  const [open, setOpen] = useState(full);
  const launcher = useRef<HTMLButtonElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState<PublicPlan | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [modelChoice, setModelChoice] = useState<ChatModel>("fast");
  const [modelReady, setModelReady] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [sourceOnly, setSourceOnly] = useState(false);
  const [modelStatus, setModelStatus] = useState("");
  const [download, setDownload] = useState<Download | null>(null);
  const [partial, setPartial] = useState("");
  const [busy, setBusy] = useState(false);
  const [grounded, setGrounded] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState("");
  const [error, setError] = useState("");
  const worker = useRef<Worker | null>(null);
  const lock = useRef(false);
  const run = useRef(0);
  const pending = useRef<{
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  } | null>(null);
  const loading = useRef<Promise<void> | null>(null);
  const ready = useRef<{
    resolve: () => void;
    reject: (error: Error) => void;
  } | null>(null);
  useEffect(() => {
    if (open) document.getElementById("help-question")?.focus();
  }, [open]);
  useEffect(() => {
    setContext(readSharedPlan(new URLSearchParams(location.search).get("p")));
    const update = (event: Event) =>
      setContext(readSharedPlan((event as CustomEvent<string>).detail));
    window.addEventListener("easyverify-plan", update);
    return () => window.removeEventListener("easyverify-plan", update);
  }, []);
  useEffect(() => {
    const panel = transcript.current;
    if (panel) panel.scrollTop = panel.scrollHeight;
  }, [entries, partial, busy]);
  useEffect(
    () => () => {
      run.current++;
      worker.current?.terminate();
      ready.current?.reject(new Error("Chat closed."));
      pending.current?.reject(new Error("Chat closed."));
    },
    [],
  );

  function getWorker() {
    if (!worker.current) {
      const instance = new Worker("/llama-worker.js", { type: "module" });
      worker.current = instance;
      instance.onmessage = (event) => {
        if (worker.current !== instance) return;
        const data = event.data;
        if (data.type === "chunk")
          setPartial((old) => (old + data.text).slice(0, 6000));
        if (data.type === "progress") setDownload(data);
        if (data.type === "status") setModelStatus(data.text);
        if (data.type === "ready") {
          setModelReady(true);
          setModelLoading(false);
          setDownload(null);
          setModelStatus(
            `Ready · ${data.device === "webgpu" ? "GPU" : "CPU"} · loaded in ${data.seconds.toFixed(1)}s`,
          );
          ready.current?.resolve();
          ready.current = null;
        }
        if (data.type === "answer") {
          pending.current?.resolve(data.answer);
          pending.current = null;
        }
        if (data.type === "error") {
          setModelLoading(false);
          setError(data.message);
          ready.current?.reject(new Error(data.message));
          ready.current = null;
          pending.current?.reject(new Error(data.message));
          pending.current = null;
        }
      };
      instance.onerror = () => {
        const error = new Error(
          "Local chat could not start. Retry, or use the source guide without downloading.",
        );
        setModelLoading(false);
        setError(error.message);
        ready.current?.reject(error);
        ready.current = null;
        pending.current?.reject(error);
        pending.current = null;
        instance.terminate();
        worker.current = null;
        setModelReady(false);
      };
    }
    return worker.current;
  }
  async function loadModel() {
    if (modelReady) return;
    if (loading.current) return loading.current;
    setError("");
    setModelLoading(true);
    setDownload(null);
    // Best effort only: some browsers deny durable storage. Cache API is
    // still used when available, without persisting conversation content.
    void navigator.storage?.persist?.().catch(() => false);
    const promise = new Promise<void>((resolve, reject) => {
      ready.current = { resolve, reject };
    });
    loading.current = promise;
    try {
      getWorker().postMessage({ type: "load", model: modelChoice });
      await promise;
    } finally {
      if (loading.current === promise) {
        loading.current = null;
        setModelLoading(false);
      }
    }
  }
  function stopModel() {
    run.current++;
    worker.current?.terminate();
    worker.current = null;
    ready.current?.reject(
      new Error("Download stopped. Saved files may be reused on retry."),
    );
    ready.current = null;
    pending.current?.reject(new Error("Generation stopped."));
    pending.current = null;
    loading.current = null;
    lock.current = false;
    setBusy(false);
    setModelLoading(false);
    setModelReady(false);
    setPartial("");
    setActiveQuestion("");
    setDownload(null);
    setModelStatus("");
  }
  async function ask(value: string) {
    if (!value.trim() || lock.current) return;
    lock.current = true;
    const current = ++run.current;
    setQuestion("");
    setError("");
    setBusy(true);
    setPartial("");
    setActiveQuestion(value);
    const mode = chatContext(value, entries);
    setGrounded(mode.grounded);
    const reference = sensitiveQuestion(value)
      ? helpAnswer(value)
      : context &&
          mode.grounded &&
          !/tentative|nonconfirmation|mismatch|\btnc\b|photo match|case process|verification process/i.test(
            mode.retrievalQuestion,
          )
        ? planReference(mode.retrievalQuestion, context)
        : helpAnswer(mode.retrievalQuestion);
    let answer = reference.answer;
    let engine = "Source guide";
    try {
      if (!sourceOnly && !sensitiveQuestion(value)) {
        await loadModel();
        if (current !== run.current) return;
        answer = await new Promise<string>((resolve, reject) => {
          pending.current = { resolve, reject };
          getWorker().postMessage({
            type: "generate",
            messages: conversationMessages(
              value,
              reference,
              entries,
              mode.grounded,
            ),
            model: modelChoice,
          });
        });
        if (mode.grounded && !groundedAnswer(answer, reference.answer)) {
          answer = reference.answer;
          setError(
            "Showing the source guide because the local explanation could not be checked against its reference.",
          );
        } else engine = "Local AI";
      } else if (sourceOnly && !mode.grounded && !sensitiveQuestion(value)) {
        answer =
          "The source guide covers EasyVerify and employment-verification requirements. Switch to Local chat for writing, explanations, and general questions.";
      }
    } catch (error) {
      if (current !== run.current) return;
      setError(
        error instanceof Error ? error.message : "Local chat unavailable.",
      );
      answer =
        mode.grounded || sensitiveQuestion(value)
          ? reference.answer
          : "I couldn’t start the local model. Your question was not sent to a server. Try again, or select Quick start for the smaller download.";
    } finally {
      if (current === run.current) {
        lock.current = false;
        setBusy(false);
        setPartial("");
        setActiveQuestion("");
      }
    }
    if (current === run.current)
      setEntries((old) => [
        ...old.slice(-19),
        {
          question: sensitiveQuestion(value)
            ? "Sensitive question withheld"
            : value,
          answer,
          engine,
          reference: reference.answer,
          grounded: mode.grounded,
          sources: mode.grounded ? reference.sources : [],
        },
      ]);
  }
  return (
    <div
      className={full ? "assistant-widget assistant-full" : "assistant-widget"}
    >
      {open && (
        <section
          id="help-panel"
          className="help-panel chat-panel"
          aria-label="EasyVerify chat"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !full) {
              setOpen(false);
              launcher.current?.focus();
            }
          }}
        >
          <header>
            <div>
              <Sparkles size={19} />
              <div>
                <strong>Ask EasyVerify</strong>
                <small>
                  {sourceOnly
                    ? "Source guide · no download"
                    : modelReady
                      ? "Local chat · on your device"
                      : "Private, on-device chat"}
                </small>
              </div>
            </div>
            <div className="chat-header-actions">
              <button
                type="button"
                className="icon-button"
                aria-label="New conversation"
                disabled={busy}
                onClick={() => {
                  setEntries([]);
                  setError("");
                }}
              >
                <Plus size={18} />
              </button>
              {!full && (
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Close help"
                  onClick={() => {
                    setOpen(false);
                    launcher.current?.focus();
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </header>
          <div className="chat-settings">
            <div
              className="chat-mode-switch"
              role="group"
              aria-label="Answer mode"
            >
              <button
                type="button"
                aria-pressed={!sourceOnly}
                disabled={busy || modelLoading}
                onClick={() => setSourceOnly(false)}
              >
                Local chat
              </button>
              <button
                type="button"
                aria-pressed={sourceOnly}
                disabled={busy || modelLoading}
                onClick={() => setSourceOnly(true)}
              >
                Source guide
              </button>
            </div>
            {!sourceOnly && (
              <>
                <label className="chat-model-label">
                  Model
                  <select
                    aria-label="Local chat model"
                    value={modelChoice}
                    disabled={busy || modelLoading}
                    onChange={(event) => {
                      stopModel();
                      setModelChoice(event.target.value as ChatModel);
                    }}
                  >
                    <option value="fast">Quick start · ≈137 MB</option>
                    <option value="quality">More capable · ≈365 MB</option>
                  </select>
                </label>
                {!modelReady && (
                  <p className="small">
                    First use downloads model files (less on a compatible GPU).
                    Saved files are reused when the browser cache is available.
                    Network speed determines download time.
                  </p>
                )}
                {!modelReady && !modelLoading && (
                  <button
                    type="button"
                    className="button"
                    onClick={() => void loadModel().catch(() => {})}
                  >
                    Prepare {CHAT_MODELS[modelChoice].name.toLowerCase()}
                  </button>
                )}
                {(modelLoading || modelReady) && (
                  <div className="chat-model-status">
                    <span role="status">
                      {modelStatus || "Preparing local chat…"}
                    </span>
                    <button
                      type="button"
                      className="text-button"
                      onClick={stopModel}
                    >
                      {modelLoading ? "Cancel download" : "Unload model"}
                    </button>
                  </div>
                )}
                {modelLoading && download && (
                  <div className="chat-download">
                    <progress
                      max="100"
                      value={Math.min(100, download.progress)}
                      aria-label="Current file download progress"
                    />
                    <span>
                      {downloadLabel(download.loaded, download.total)} · current
                      file
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <div
            className="help-content chat-transcript"
            ref={transcript}
            role="log"
            aria-label="Conversation"
            aria-live="polite"
          >
            {!entries.length && !busy && (
              <div className="chat-welcome">
                <MessageCircle size={28} />
                <h2>What can I help with?</h2>
                <p>
                  Explain a requirement, draft a message, or ask a general
                  question. Follow up naturally.
                </p>
                <div className="chat-starters">
                  {starters.map((starter) => (
                    <button
                      type="button"
                      key={starter}
                      onClick={() => {
                        setQuestion(starter);
                        document.getElementById("help-question")?.focus();
                      }}
                    >
                      {starter}
                      <ArrowUp size={15} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {context && (
              <p className="small">
                Plan context: {context.profile.state} · start {context.hireDate}
                . No employee records included.
              </p>
            )}
            {entries.map((entry, index) => (
              <article className="chat-turn" key={index}>
                <div className="chat-user">
                  <span className="sr-only">You: </span>
                  {entry.question}
                </div>
                <div className="chat-response">
                  <small>
                    {entry.engine}
                    {entry.engine === "Local AI" && !entry.grounded
                      ? " · general answer, not source-verified"
                      : ""}
                  </small>
                  <p>{entry.answer}</p>
                  {entry.sources.length > 0 && (
                    <details className="chat-sources">
                      <summary>
                        {entry.sources.length} official reference
                        {entry.sources.length === 1 ? "" : "s"}
                      </summary>
                      <ul>
                        {entry.sources.map((source) => (
                          <li key={source.url}>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {source.title} ↗
                            </a>
                            <small>
                              {source.reviewed
                                ? `Reviewed ${source.reviewed}`
                                : "Source review pending"}
                            </small>
                          </li>
                        ))}
                      </ul>
                      {entry.engine === "Local AI" && <p>{entry.reference}</p>}
                    </details>
                  )}
                </div>
              </article>
            ))}
            {busy && (
              <article className="chat-turn">
                <div className="chat-user">
                  {sensitiveQuestion(activeQuestion)
                    ? "Sensitive question withheld"
                    : activeQuestion}
                </div>
                <div className="chat-response">
                  <small>
                    {modelLoading
                      ? "Preparing model"
                      : grounded
                        ? "Checking a source-based explanation"
                        : "EasyVerify"}
                  </small>
                  <p>
                    {!grounded && partial
                      ? partial
                      : modelLoading
                        ? "Loading on your device. You can cancel below."
                        : "Thinking…"}
                  </p>
                </div>
              </article>
            )}
          </div>
          {error && (
            <p role="status" className="chat-error">
              {error}
            </p>
          )}
          <form
            className="chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void ask(question);
            }}
          >
            <label className="sr-only" htmlFor="help-question">
              Your question
            </label>
            <textarea
              id="help-question"
              rows={2}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  if (question.trim() && !busy && !modelLoading)
                    void ask(question);
                }
              }}
              placeholder="Ask anything, or follow up…"
              maxLength={2000}
              required
            />
            {busy || modelLoading ? (
              <button
                type="button"
                className="icon-button"
                aria-label="Stop response or download"
                onClick={stopModel}
              >
                <Square size={17} />
              </button>
            ) : (
              <button
                className="icon-button"
                aria-label={
                  !sourceOnly && !modelReady
                    ? "Download model and send question"
                    : "Send question"
                }
                disabled={!question.trim()}
              >
                <ArrowUp size={19} />
              </button>
            )}
          </form>
          <p className="chat-disclaimer">
            {!sourceOnly && !modelReady
              ? "Sending starts the selected download. "
              : ""}
            Small local models can make mistakes. No live web access. Keep
            identity numbers and employee documents out of chat.
          </p>
        </section>
      )}
      {!full && (
        <button
          ref={launcher}
          type="button"
          className="help-launcher"
          aria-controls="help-panel"
          aria-expanded={open}
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
