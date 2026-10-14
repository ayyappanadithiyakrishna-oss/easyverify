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
          <h2>From Form I-9 to E-Verify</h2>
          {[
            [
              "1986",
              "Employer document review",
              "The Immigration Reform and Control Act established the employer verification framework that led to Form I-9.",
            ],
            [
              "1996",
              "Pilot programs authorized",
              "Congress required three pilot approaches to electronic employment verification, including Basic Pilot.",
            ],
            [
              "1997",
              "Basic Pilot launched",
              "INS and SSA introduced the voluntary program in six states, including California.",
            ],
            [
              "2004",
              "Web access introduced",
              "Employers gained internet-based access, online enrollment, and reporting.",
            ],
            [
              "2007",
              "Renamed E-Verify",
              "The program added features including photo matching and checks intended to reduce entry errors.",
            ],
            [
              "2024",
              "E-Verify+ trial",
              "USCIS began a trial intended to streamline Form I-9 and E-Verify together.",
            ],
          ].map(([year, title, description]) => (
            <article className="history-layer" key={year}>
              <span className="step">{year}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
          <p className="small">
            Historical milestones describe the program’s development; they do
            not decide which current rules apply to your business.
          </p>
          <a
            href="https://www.e-verify.gov/about-e-verify/history-and-milestones"
            target="_blank"
            rel="noreferrer"
          >
            Source: E-Verify · History and milestones ↗
          </a>
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
