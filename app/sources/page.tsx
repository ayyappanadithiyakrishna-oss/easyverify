import { Header } from "@/components/brand";
import { rules } from "@/lib/rules";
import { RULESET_VERSION } from "@/lib/engine";
export default function Page() {
  const sources = [
    ...new Map(rules.flatMap((r) => r.sources).map((s) => [s.url, s])).values(),
  ];
  return (
    <>
      <Header />
      <main id="main" className="document-main">
        <span className="eyebrow">SOURCE LIBRARY</span>
        <h1>
          Know what’s behind
          <br />
          your checklist.
        </h1>
        <p className="lead">
          Each requirement links to its governing source. We distinguish
          reviewed federal guidance from state and contract questions that still
          need review.
        </p>
        <div className="callout">
          Coverage: ordinary US new paid hires, federal guidance, and California
          research references. Other state requirements, specialized employment
          categories, and contractor exceptions require additional review.
        </div>
        <section className="panel">
          <div className="panel-heading">
            <h2>Source register</h2>
            <span className="badge">{RULESET_VERSION}</span>
          </div>
          {sources.map((s) => (
            <article className="source-register" key={s.url}>
              <div>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title} ↗
                </a>
                <p>{s.citation}</p>
              </div>
              <span className="badge">
                {s.reviewed ? "Reviewed " + s.reviewed : "Review pending"}
              </span>
            </article>
          ))}
        </section>
        <section className="two-columns">
          <div className="panel">
            <h2>How the engine works</h2>
            <p>
              Conditions are evaluated against your business profile. Unknown
              answers remain unresolved. Related obligations and restrictions
              are composed while retaining every source and condition trace.
            </p>
            <p>
              After a source update, old requirements need regeneration. Source
              records older than 90 days return to review status.
            </p>
          </div>
          <div className="panel">
            <h2>What completion means</h2>
            <p>
              A checked box records reported completion of an external step.
              EasyVerify does not submit Form I-9, create government cases,
              certify compliance, or examine documents.
            </p>
            <p>
              Dates use your selected working calendar and closure dates. They
              are planning targets to review against your actual circumstances.
            </p>
          </div>
        </section>
        <section id="local-assistant" className="panel">
          <h2>Use Llama 3.2 on this computer</h2>
          <p>
            The source guide works for every visitor. Optional Llama answers run
            through your own local Ollama service; Vercel does not host the
            model.
          </p>
          <p>
            Install Ollama, pull <code>llama3.2:3b</code>, and start its server
            with the EasyVerify origin allowed. Your browser may request
            local-network access. Keep the server bound to localhost.
          </p>
          <pre>
            <code>
              OLLAMA_ORIGINS=https://easyverify.vercel.app
              OLLAMA_HOST=127.0.0.1:11434 ollama serve
            </code>
          </pre>
          <p>
            Open Ask EasyVerify → Local Llama 3.2 and select “Use this
            computer’s Ollama.” Only your question and the selected rule
            reference are sent. Answers can be incorrect; read the source-guide
            reference and linked official sources.
          </p>
        </section>
      </main>
    </>
  );
}
