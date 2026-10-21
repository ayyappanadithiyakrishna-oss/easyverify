import { stateLaws, stateNames } from "@/lib/state-laws";
import { states } from "@/lib/validation";

export function StateCoveragePanel({
  state,
  directory = false,
}: {
  state: string;
  directory?: boolean;
}) {
  const law = stateLaws[state];
  const researched = Object.keys(stateLaws).length;
  return (
    <div className="coverage-panel">
      <div className="panel-heading">
        <h2>State requirements</h2>
        <span className="badge">{stateNames[state] ?? state}</span>
      </div>
      <p className="coverage-status">
        {law
          ? "State summary available"
          : state === "CA"
            ? "Statutory verification pending"
            : "State research needed"}
      </p>
      <p>
        {law?.summary ??
          (state === "CA"
            ? "California restrictions and inspection-notice references are included. Their current statutory text still needs verification."
            : "We have not established this state’s E-Verify requirements. Do not treat the federal checklist as a state-law exemption.")}
      </p>
      {law && (
        <a href={law.source.url} target="_blank" rel="noreferrer">
          {law.source.citation} ↗
        </a>
      )}
      <div className="coverage-totals">
        <strong>
          {researched}
          <span>researched summaries</span>
        </strong>
        <strong>
          {states.length - researched}
          <span>need further research</span>
        </strong>
      </div>
      <p className="small">
        All 50 states and DC have a review path. A review path is not a
        researched state-specific determination. Local laws, contracts, and
        exceptions may add requirements.
      </p>
      {directory ? (
        <details className="coverage-directory">
          <summary>See coverage for all states and DC</summary>
          <ul>
            {states.map((code) => (
              <li key={code}>
                <span>{stateNames[code]}</span>
                <span>
                  {stateLaws[code]
                    ? "Summary researched"
                    : code === "CA"
                      ? "Verification pending"
                      : "Research needed"}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <a href="/sources#state-coverage">View all state coverage →</a>
      )}
    </div>
  );
}
