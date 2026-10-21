import Link from "next/link";
import { Header } from "@/components/brand";
import { Faq } from "@/components/faq";

const steps = [
  {
    when: "Before the first day",
    title: "Offer accepted",
    body: "Start the plan once the offer is accepted.",
  },
  {
    when: "New hire · first paid day",
    title: "Complete Section 1",
    body: "The person joining completes their attestation.",
    source: "USCIS source",
  },
  {
    when: "Employer · third business day",
    title: "Review documents",
    body: "See your date and why it applies.",
  },
];

const features = [
  {
    title: "Build a plan",
    body: "Work location, contract answers and start date become dated steps. Share the plan with a link.",
    href: "/plan",
    cta: "Start planning",
  },
  {
    title: "Walk through a case",
    body: "See each step of an official E-Verify case, what every result means, and the date yours is due.",
    href: "/case",
    cta: "Open the walkthrough",
  },
  {
    title: "Ask a question",
    body: "An assistant that runs in your browser answers from the rules and cites its source.",
    href: "/assistant",
    cta: "Open the assistant",
  },
  {
    title: "See what is unknown",
    body: "Anything not yet reviewed is marked as such, right where you decide.",
    href: "/sources",
    cta: "Read the sources",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="ev-hero">
          <h1>Know what applies when you hire.</h1>
          <p className="lede">
            Answer a few questions about your business. Get a dated plan with
            an official source beside every step.
          </p>
          <div className="ev-actions">
            <Link href="/plan" className="button">
              Build your plan
            </Link>
            <Link href="/demo" className="button secondary">
              See the demo
            </Link>
          </div>
          <p className="fine">No account needed. No employee documents.</p>
        </section>

        <section className="tile-wrap" aria-label="Example plan">
          <div className="tile">
            <ol className="steps">
              {steps.map((s) => (
                <li key={s.title}>
                  <span className="step-when">{s.when}</span>
                  <h2>{s.title}</h2>
                  <p>{s.body}</p>
                  {s.source && (
                    <Link href="/sources" className="text-link">
                      {s.source}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="band">
          <div className="band-inner">
            <h2 className="band-title">Reasons, not just answers.</h2>
            <div className="features">
              {features.map((f) => (
                <div key={f.title}>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                  <Link href={f.href} className="text-link">
                    {f.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="faq-section">
          <div className="band-inner narrow">
            <h2 className="band-title">Questions</h2>
            <Faq />
          </div>
        </section>

        <section className="ev-closing">
          <h2>Start the next hire with a plan.</h2>
          <Link href="/plan" className="button">
            Build your plan
          </Link>
        </section>
      </main>
    </>
  );
}
