import Link from "next/link";
import {
  ArrowRight,
  Check,
  ArrowUpRight,
  FileCheck2,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import { Header } from "@/components/brand";
export default function Home() {
  return (
    <>
      <Header />
      <main id="main" className="new-landing">
        <section className="launch-hero">
          <div className="launch-copy">
            <p className="launch-intro">
              <span className="live-dot" />
              Hiring guidance, with the reasoning attached.
            </p>
            <h1>
              Hire with a<br />
              <em>clear next step.</em>
            </h1>
            <p className="launch-description">
              A first day, a stack of paperwork, and overlapping rules. Turn
              what you know about your business into a practical hiring plan.
            </p>
            <div className="actions">
              <Link href="/plan" className="button mint">
                Build your hiring plan <ArrowRight size={18} />
              </Link>
              <Link href="/demo" className="hero-text-link">
                Explore the workspace <ArrowUpRight size={17} />
              </Link>
            </div>
            <p className="launch-footnote">
              No account needed to start. No employee documents required.
            </p>
          </div>
          <div className="hire-path" aria-label="Example of a hiring plan">
            <div className="path-heading">
              <span>THE NEXT HIRE</span>
              <span className="path-status">Plan, explain, act</span>
            </div>
            <div className="path-line">
              <span className="path-node">
                <Check size={17} />
              </span>
              <div>
                <small>Before the first day</small>
                <h3>Offer accepted</h3>
                <p>Start the plan once the offer is accepted.</p>
              </div>
            </div>
            <div className="path-line">
              <span className="path-node active">
                <FileCheck2 size={19} />
              </span>
              <div>
                <small>New hire · first paid day</small>
                <h3>Complete Section 1</h3>
                <p>The person joining completes their attestation.</p>
                <span className="source-chip">
                  USCIS · source attached <ArrowUpRight size={12} />
                </span>
              </div>
            </div>
            <div className="path-line">
              <span className="path-node">
                <CalendarDays size={18} />
              </span>
              <div>
                <small>Employer · working-calendar target</small>
                <h3>Review acceptable documents</h3>
                <p>See your date, your responsibilities, and why they apply.</p>
              </div>
            </div>
            <Link href="/plan" className="path-bottom">
              Make the dates yours <ArrowRight size={17} />
            </Link>
          </div>
        </section>
        <section className="useful-strip">
          <span>
            <ShieldCheck size={18} />
            Official sources beside every step
          </span>
          <span>
            <CalendarDays size={18} />
            Your calendar, your targets
          </span>
          <span>
            <FileCheck2 size={18} />
            Unknown answers stay visible
          </span>
        </section>
        <section className="product-story">
          <div>
            <p className="story-label">
              A useful plan beats another search result.
            </p>
            <h2>
              Know what applies.
              <br />
              See what needs review.
            </h2>
            <p>
              Federal requirements, state restrictions, and contract clauses can
              overlap. EasyVerify shows the facts that matched, the source
              behind each step, and the questions that still need an answer.
            </p>
            <Link href="/plan" className="inline-action">
              Start with your business <ArrowRight size={17} />
            </Link>
          </div>
          <div className="story-product">
            <img
              className="preview-light"
              src="/workspace-preview.png"
              alt="EasyVerify workspace displaying requirement targets and reasons"
              width="1440"
              height="1000"
              loading="lazy"
            />
            <img
              className="preview-dark"
              src="/workspace-preview-dark.png"
              alt="EasyVerify dark workspace displaying requirement targets and reasons"
              width="1440"
              height="1000"
              loading="lazy"
            />
          </div>
        </section>
        <section className="capability-list">
          <div>
            <h2>
              Made to move
              <br />
              the work forward.
            </h2>
            <p>For the person hiring and the person joining.</p>
          </div>
          <div>
            <article>
              <span>01</span>
              <div>
                <h3>Build and share a plan</h3>
                <p>
                  Use your work location, contract answers, and start date. Open
                  the same plan on another laptop with a link.
                </p>
              </div>
              <Link href="/plan" aria-label="Build a shareable plan">
                <ArrowUpRight size={22} />
              </Link>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Ask a follow-up, in the app</h3>
                <p>
                  Choose fast local chat or Llama 3.2 inside your browser. Read
                  the rule reference beside the answer.
                </p>
              </div>
              <Link href="/assistant" aria-label="Open EasyVerify chat">
                <ArrowUpRight size={22} />
              </Link>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Understand the difference</h3>
                <p>
                  Compare an ordinary employer and a federal contractor. See the
                  inputs that change the guidance.
                </p>
              </div>
              <Link href="/demo" aria-label="Compare business profiles">
                <ArrowUpRight size={22} />
              </Link>
            </article>
          </div>
        </section>
        <section className="launch-cta">
          <h2>
            The next hire can start
            <br />
            with a clearer plan.
          </h2>
          <Link href="/plan" className="button mint">
            Build my plan <ArrowRight size={17} />
          </Link>
        </section>
        <div className="coverage-foot">
          <p>
            Federal baseline across the United States. California references are
            included with explicit review status; other state requirements still
            need research.
          </p>
          <a
            href="https://www.congressionalappchallenge.us/"
            className="contest-link"
          >
            2026 Congressional App Challenge <ArrowUpRight size={15} />
          </a>
        </div>
      </main>
    </>
  );
}
