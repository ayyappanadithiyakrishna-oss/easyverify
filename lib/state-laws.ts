import type { Rule, Source } from "./types";
import { states } from "./validation";

export type StateLaw = {
  name: string;
  summary: string;
  actions: string[];
  source: Source;
};
const reviewed = "2026-10-20";
export const stateNames: Record<string, string> = Object.fromEntries(
  "AL:Alabama|AK:Alaska|AZ:Arizona|AR:Arkansas|CA:California|CO:Colorado|CT:Connecticut|DE:Delaware|DC:District of Columbia|FL:Florida|GA:Georgia|HI:Hawaii|ID:Idaho|IL:Illinois|IN:Indiana|IA:Iowa|KS:Kansas|KY:Kentucky|LA:Louisiana|ME:Maine|MD:Maryland|MA:Massachusetts|MI:Michigan|MN:Minnesota|MS:Mississippi|MO:Missouri|MT:Montana|NE:Nebraska|NV:Nevada|NH:New Hampshire|NJ:New Jersey|NM:New Mexico|NY:New York|NC:North Carolina|ND:North Dakota|OH:Ohio|OK:Oklahoma|OR:Oregon|PA:Pennsylvania|RI:Rhode Island|SC:South Carolina|SD:South Dakota|TN:Tennessee|TX:Texas|UT:Utah|VT:Vermont|VA:Virginia|WA:Washington|WV:West Virginia|WI:Wisconsin|WY:Wyoming"
    .split("|")
    .map((entry) => entry.split(":")),
);
export const stateLaws: Record<string, StateLaw> = {
  VA: {
    name: "Virginia",
    summary:
      "Virginia’s Commonwealth-agency contracting rule applies to employers averaging more than 50 employees over the previous 12 months who enter a covered contract exceeding $50,000. E-Verify covers newly hired employees performing work under that public contract.",
    actions: [
      "Confirm both thresholds: more than 50 average employees over the previous 12 months and a contract in excess of $50,000 with an agency of the Commonwealth for work or services.",
      "Register and participate for newly hired employees performing work under the covered contract. A current headcount or the federal FAR answer alone cannot establish this state-contract requirement.",
      "Review other public-employer, local-contract, or specialized obligations separately; this source covers §2.2-4308.2 only.",
    ],
    source: {
      title: "Virginia General Assembly · Public contract verification",
      url: "https://law.lis.virginia.gov/vacode/title2.2/chapter43/section2.2-4308.2/",
      citation: "Va. Code §2.2-4308.2",
      reviewed,
    },
  },
  AZ: {
    name: "Arizona",
    summary:
      "Arizona requires employers covered by A.R.S. §23-214 to use E-Verify after hiring. Keep the verification record for the employment period or at least three years, whichever is longer.",
    actions: [
      "Confirm coverage under Arizona law and enroll before processing covered new hires. Enrollment is separate from completing Form I-9.",
      "Retain the E-Verify record for the longer Arizona period; do not substitute the federal I-9 destruction date.",
      "Applicants for government economic-development incentives must also review the participation and proof requirements.",
    ],
    source: {
      title: "Arizona Legislature · Employment eligibility",
      url: "https://www.azleg.gov/ars/23/00214.htm",
      citation: "A.R.S. §23-214(A)–(B)",
      reviewed,
    },
  },
  FL: {
    name: "Florida",
    summary:
      "Florida requires private employers with 25 or more employees to use E-Verify for new employees. Public agencies and public-agency contracts have separate E-Verify requirements; a smaller employer is not automatically exempt from every provision.",
    actions: [
      "Confirm the statutory employee count and employment definitions. At 25 or more employees, private employers must use E-Verify within three business days after paid work begins.",
      "Review public-agency contract and subcontractor obligations regardless of the private-employer threshold, including required subcontractor affidavits.",
      "Retain the documentation and official verification required by §448.095 for at least three years. Review the annual first-return compliance certification.",
      "If E-Verify is unavailable for the required three-business-day period, follow the I-9 fallback and retain evidence of the outage; do not simply skip verification.",
    ],
    source: {
      title: "Florida Legislature · Employment eligibility",
      url: "https://www.leg.state.fl.us/Statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0448/Sections/0448.095.html",
      citation: "Fla. Stat. §448.095(1), (2), (5)",
      reviewed,
    },
  },
  NC: {
    name: "North Carolina",
    summary:
      "North Carolina’s private-employer rule covers employers with 25 or more employees in North Carolina. Its employee definition excludes a term of employment shorter than nine months in a calendar year. Government bodies are outside this Article’s employer definition and need a separate review.",
    actions: [
      "Count employees in North Carolina using §64-25, rather than assuming company-wide headcount establishes coverage. Review the less-than-nine-month employment exclusion.",
      "Covered employers must use E-Verify after hiring and retain the verification record throughout employment and for one year afterward.",
      "Review public procurement and government-employer obligations separately; the Article 2 exclusions do not establish a universal exemption.",
    ],
    source: {
      title: "North Carolina General Assembly · Work authorization",
      url: "https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/ByArticle/Chapter_64/Article_2.html",
      citation: "N.C. Gen. Stat. §§64-25–64-26",
      reviewed,
    },
  },
  SC: {
    name: "South Carolina",
    summary:
      "South Carolina requires private employers required to complete federal employment eligibility forms to register and use E-Verify for every new employee within three business days after employment begins.",
    actions: [
      "Confirm private-employer coverage under §§41-8-10 and 41-8-20, then register and participate in E-Verify.",
      "Submit the new-hire verification even if employment ends within three business days. Follow federal mismatch protections; a tentative nonconfirmation is not a final determination.",
      "Contractors must retain subcontractor contact numbers and provide them within 72 hours of a qualifying director request. Review the statute before applying this event-specific duty.",
    ],
    source: {
      title: "South Carolina Legislature · Private employment",
      url: "https://www.scstatehouse.gov/code/t41c008.php",
      citation: "S.C. Code §§41-8-10, 41-8-20",
      reviewed,
    },
  },
};

export function stateCoverage(state: string) {
  if (stateLaws[state])
    return `${stateLaws[state].name}: source-reviewed state guidance. Confirm employer type, statutory headcount, contracts, and exceptions before applying it.`;
  if (state === "CA")
    return "California: restrictions and inspection-notice references are included, with statutory verification still pending.";
  return `${stateNames[state] ?? state}: state and local requirements still need source review. This is not a finding that E-Verify is optional or that no state law applies.`;
}

// Review tasks deliberately do not infer employer category, in-state counts,
// public contracts, or seasonal exceptions from the limited business profile.
export const stateRules: Rule[] = states
  .filter((state) => state !== "CA")
  .map((state) => {
    const law = stateLaws[state];
    return {
      id: `state-${state.toLowerCase()}`,
      title: law
        ? `Review ${law.name} E-Verify requirements`
        : `Review ${stateNames[state]} state and local requirements`,
      summary: law?.summary ?? stateCoverage(state),
      actions: law?.actions ?? [
        "Confirm the current state statute and agency guidance with the state government or qualified counsel before deciding whether enrollment is optional.",
        "Check private/public employer status, state and local contracts, business-license conditions, employee thresholds, and industry or seasonal exceptions. The federal contractor question does not answer state-contract coverage.",
      ],
      jurisdiction: stateNames[state],
      condition: { field: "state", equals: state },
      role: "employer",
      deadline: "none",
      reviewOnly: true,
      sources: law
        ? [law.source]
        : [
            {
              title: "USA.gov · Find your state government",
              url: "https://www.usa.gov/state-governments",
              citation:
                "Government directory; not a reviewed state-law determination",
              reviewed: null,
            },
          ],
    };
  });
