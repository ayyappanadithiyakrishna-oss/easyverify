import { StateCoveragePanel } from "@/components/state-coverage";
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
        <span className="eyebrow">Source library</span>
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
          Coverage: ordinary US new paid hires and federal guidance. State-law
          summaries cover Arizona, Florida, North Carolina, South Carolina, and
          Virginia. California statutory verification is pending. Other states
          have explicit research tasks; employer categories, local laws, and
          contract exceptions still require review. A reviewed source is not a
          complete legal determination.
        </div>
        <section id="state-coverage" className="panel">
          <StateCoveragePanel state="CA" directory />
        </section>
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
      </main>
    </>
  );
}
