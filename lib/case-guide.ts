import { addBusinessDays } from "../support/dates.mjs";

/**
 * Walkthrough content paraphrased from USCIS's E-Verify verification-process
 * page and "Create a new E-Verify Case" video. EasyVerify never connects to
 * E-Verify; this explains what the official system does.
 */
export const CASE_SOURCES = {
  process: {
    title: "E-Verify · Verification process",
    url: "https://www.e-verify.gov/employers/verification-process",
  },
  video: {
    title: "USCIS · Create a new E-Verify Case (video)",
    url: "https://www.youtube.com/watch?v=NyqZOegUGEs",
  },
  manual: {
    title: "E-Verify User Manual §2.2 · Create a case",
    url: "https://www.e-verify.gov/e-verify-user-manual-20-initial-verification/22-create-a-case",
  },
} as const;

export const CASE_STEPS = [
  {
    id: "i9",
    title: "Complete Form I-9",
    who: "Employee and employer",
    body: "Every case starts from a finished Form I-9. E-Verify adds to the I-9 process and does not replace it.",
  },
  {
    id: "create",
    title: "Create the case",
    who: "Employer",
    body: "Enter the information from the I-9 into the official E-Verify system. The case is due by the third business day after paid work begins, and not before the offer is accepted.",
  },
  {
    id: "photo",
    title: "Match the photo, if asked",
    who: "Employer",
    body: "For some documents, E-Verify shows a photo to compare with the document in hand. Choose whether they match; a mismatch asks for a copy of the document.",
  },
  {
    id: "result",
    title: "Read the result",
    who: "Employer",
    body: "Most results appear within seconds. Some need more time or more action from the employee.",
  },
  {
    id: "next",
    title: "Take the next step",
    who: "Employer and employee",
    body: "What happens next depends on the result. See each one below.",
  },
  {
    id: "close",
    title: "Close the case",
    who: "Employer",
    body: "Close the case once it has a final result. Employment Authorized cases close automatically.",
  },
] as const;

export const PHOTO_DOCUMENTS = [
  "U.S. passport or passport card",
  "Permanent Resident Card (Form I-551)",
  "Employment Authorization Document (Form I-766)",
];

export type CaseResult = {
  id: string;
  label: string;
  tone: "good" | "wait" | "act" | "final";
  meaning: string;
  employer: string[];
  employee: string;
};

export const CASE_RESULTS: CaseResult[] = [
  {
    id: "authorized",
    label: "Employment Authorized",
    tone: "good",
    meaning: "The information matched government records.",
    employer: [
      "Nothing further is needed. The case closes automatically.",
      "Keep Form I-9 for the required retention period.",
    ],
    employee: "No action.",
  },
  {
    id: "more-time",
    label: "Needs More Time",
    tone: "wait",
    meaning: "The case was referred to DHS for further verification.",
    employer: [
      "Wait. Check the case again later for an updated result.",
      "Do not take action against the employee because of the delay.",
    ],
    employee: "No action unless contacted.",
  },
  {
    id: "tnc",
    label: "Tentative Nonconfirmation",
    tone: "act",
    meaning:
      "The information did not match records. It does not by itself mean the person cannot work.",
    employer: [
      "Tell the employee privately and give them the official notice.",
      "Let them choose whether to contest. Take no adverse action while the case is pending.",
    ],
    employee:
      "Decide whether to contest, then follow the instructions on the notice.",
  },
  {
    id: "continuance",
    label: "Case in Continuance",
    tone: "wait",
    meaning:
      "The employee contacted DHS or visited a Social Security office, and more time is needed.",
    employer: ["Wait for E-Verify to update the case."],
    employee: "Follow up with the agency if asked.",
  },
  {
    id: "resubmit",
    label: "Close Case and Resubmit",
    tone: "final",
    meaning:
      "DHS or Social Security needs this case closed and a new one created.",
    employer: [
      "Close the case, then create a new one using the correct information.",
    ],
    employee: "Confirm the information if asked.",
  },
  {
    id: "final",
    label: "Final Nonconfirmation",
    tone: "final",
    meaning: "E-Verify could not confirm work eligibility.",
    employer: [
      "Close the case. Review the official guidance before any employment decision.",
      "Either party can ask for further review through E-Verify's help line.",
    ],
    employee: "Ask the employer or E-Verify about further review.",
  },
];

/** Third business day after paid work begins, honoring closures. */
export function caseDueDate(
  start: string,
  options: { workingDays?: number[]; closures?: string[] } = {},
): string {
  return addBusinessDays(start, 3, options);
}
