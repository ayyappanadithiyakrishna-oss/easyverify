import { Header } from "@/components/brand";
export default function Page() {
  return (
    <>
      <Header />
      <main id="main" className="document-main">
        <span className="eyebrow">WHY REQUIREMENTS COME IN LAYERS</span>
        <h1>
          One business.
          <br />
          More than one rule.
        </h1>
        <p className="lead">
          Form I-9, E-Verify participation, government contracts, and state
          restrictions answer different questions. EasyVerify keeps those layers
          visible.
        </p>
        <section className="panel">
          <div className="history-layer">
            <span className="step">01</span>
            <div>
              <h2>Form I-9 establishes the baseline</h2>
              <p>
                Employer and employee responsibilities apply through the
                official Form I-9 process. Joining E-Verify does not replace
                that process.
              </p>
            </div>
          </div>
          <div className="history-layer">
            <span className="step">02</span>
            <div>
              <h2>E-Verify adds an electronic case workflow</h2>
              <p>
                Participating employers compare Form I-9 information against
                government records through the official program.
              </p>
            </div>
          </div>
          <div className="history-layer">
            <span className="step">03</span>
            <div>
              <h2>Contracts can add obligations</h2>
              <p>
                The FAR E-Verify clause changes which guidance needs review.
                Government contracting alone is not enough to determine every
                applicable requirement.
              </p>
            </div>
          </div>
          <div className="history-layer">
            <span className="step">04</span>
            <div>
              <h2>California adds a state layer</h2>
              <p>
                A federal checklist cannot establish California compliance.
                State restrictions and notice duties need their own source
                review.
              </p>
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>Explore the program’s history</h2>
          <p>
            Read the official timeline for the development of the Basic Pilot
            program and E-Verify. We keep historical context separate from
            current legal applicability.
          </p>
          <a
            href="https://www.e-verify.gov/about-e-verify/history-and-milestones"
            target="_blank"
            rel="noreferrer"
          >
            E-Verify · History and milestones ↗
          </a>
        </section>
      </main>
    </>
  );
}
