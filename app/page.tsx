import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileCheck2,
  Layers,
  CalendarDays,
} from "lucide-react";
import { Header } from "@/components/brand";
export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="hero">
          <div>
            <span className="eyebrow">FOR INLAND EMPIRE SMALL BUSINESSES</span>
            <h1>
              Know the rules.
              <br />
              See your next step.
            </h1>
            <p className="hero-description">
              Federal requirements, California restrictions, and contract
              obligations can overlap. EasyVerify turns that complexity into a
              checklist you can understand.
            </p>
            <div className="actions">
              <Link href="/register" className="button">
                Set up your business <ArrowRight size={17} />
              </Link>
              <Link href="/demo" className="button secondary">
                Try the working demo
              </Link>
            </div>
            <p className="small">
              Built around official sources. Every requirement has a reason.
            </p>
          </div>
          <div className="hero-preview">
            <div className="preview-top">
              <span>MY REQUIREMENTS</span>
              <span className="badge">California</span>
            </div>
            <h2>A clear path for every hire.</h2>
            <div className="preview-row">
              <Check size={19} />
              <div>
                <strong>Complete Form I-9 · Section 1</strong>
                <small>Employee · first day of paid work</small>
              </div>
            </div>
            <div className="preview-row">
              <FileCheck2 size={19} />
              <div>
                <strong>Review documents · Section 2</strong>
                <small>Employer · business-day target</small>
              </div>
            </div>
            <div className="preview-row">
              <Layers size={19} />
              <div>
                <strong>Review your contract clause</strong>
                <small>Why it applies: FAR E-Verify clause</small>
              </div>
            </div>
            <div className="preview-note">
              <span>Federal + state layers</span>
              <Link href="/demo">
                See the reasoning <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
        <section className="how">
          <div className="section-heading">
            <span className="eyebrow">HOW IT WORKS</span>
            <h2>
              From your business
              <br />
              to a practical checklist.
            </h2>
          </div>
          <div className="feature">
            <span className="step">01</span>
            <h3>Tell us about your business</h3>
            <p>
              Work location, employee count, contract status, and E-Verify
              participation.
            </p>
          </div>
          <div className="feature">
            <span className="step">02</span>
            <h3>Understand what applies</h3>
            <p>
              See the source, the matching inputs, and where a requirement needs
              further review.
            </p>
          </div>
          <div className="feature">
            <span className="step">03</span>
            <h3>Keep every hire on track</h3>
            <p>
              Invite new hires, organize responsibilities, and track reported
              completion.
            </p>
          </div>
        </section>
        <section className="closing">
          <CalendarDays size={30} />
          <div>
            <h2>Less guessing. More clarity.</h2>
            <p>A focused workspace for hiring steps, dates, and decisions.</p>
          </div>
          <Link href="/demo" className="button secondary">
            Explore two business profiles <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    </>
  );
}
