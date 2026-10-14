# EasyVerify — Compliance Compass student build kit

Prepared October 13, 2026 from Opusol project history and the official 2026 CAC rulebook.

**Status: build kit, not a finished app or submission.** No app implementation was located in the targeted project sources; the archived artifact contains a file inventory, not recovered app code. Existing work may still exist in Uizard, Claude, or another folder. Preserve and reuse it if available.

## Contest boundary

The official rulebook requires student technical development and significant personal contributions. AI is allowed only as disclosed support for specific aspects, not the entire development. This kit does not establish eligibility by itself. Keep a real contribution log and disclose this assistance. Student team must implement and understand the core app.

**Deadline: Monday, October 26, 2026, 9:00 AM Pacific (noon EDT).** Upload a public YouTube/Vimeo demo lasting 1–3 minutes. Source code must be available if judges request it. Confirm CA-41 participation and residence/school eligibility in the portal; the district and team names here come from historical notes, not a current registration check.

## Settled direction from the archive

- Registration name: EasyVerify; product concept: Compliance Compass.
- Historical team: Krish (Adithyakrishna Ayyapan) and Shreyansh Medatati. Confirm spelling and registration before recording.
- Audience: small-business owners and HR staff in the Inland Empire.
- Latest design request: simple black and white, plain controls; do not recreate a decorative SaaS mockup.
- Main idea: business profile → explainable matching → actionable checklist → saved progress.
- Previous biometric, SSO, invitations, and identity screens are prototype history. Omit them from the first working student build: none has a verified backend or identity service in this kit.

## MVP to implement

Start with California plus the federal baseline, limited to ordinary new paid hires. Collect business name (sample only), state, exact employee count, E-Verify participation (yes/no), FAR E-Verify contract clause (yes/no/unknown), hire date, short-job flag, and working calendar. Show only California as supported until other state rules have primary-source review.

Use five views: introduction, business profile, requirements/checklist, requirement detail, and activity/profile. Desktop first, mobile usable. Use white #ffffff, ink #111111, gray text #545454, borders #d4d4d4, surface #f5f5f5; system sans-serif with monospace dates and rule IDs. Persistent navigation, visible focus, labeled inputs, no decorative animation. Signature interaction: each requirement expands to show the inputs and rule that caused it to appear.

Do not show a compliance certification or a percentage labeled “legally compliant.” Use “checklist completion.” Marking a box is self-reported. No worker documents, SSNs, face images, immigration status, or real employee data belong in this prototype. No real E-Verify case is created.

## Student implementation sequence

1. **Krish:** build profile validation and a declarative matching engine. Each record should have ID, jurisdiction, title, source URL, reviewed date, applicability predicate, explanation template, and task list. Return matched, not matched, and needs review separately. Unknown contract answers must produce a review task, never a false assurance.
2. **Shreyansh:** build the profile form, accessible navigation, requirement cards, detail view, filters, and checklist controls. Save sample profiles and progress locally; explain this visibly. Handle unavailable browser storage without losing current-screen usability.
3. **Together:** verify legal records against primary sources; implement the saved activity log; test profile edits, reload, empty state, keyboard controls, and narrow screens. Keep stable task IDs and scope completion to the profile so switching businesses cannot carry over completed tasks.
4. **Together:** integrate the AI support date helper only after reviewing every line. The helper is generic calendar arithmetic; the students decide whether a calculated target applies. Default Mon–Fri is an explicit demo assumption, not a universal legal calendar. Do not apply this helper automatically to federal-contractor case timelines.
5. **Together:** record the real demo, revise draft answers to match actual work, publish the demo, check the portal, and submit.

Suggested app files for students to create: index.html, styles.css, app.js, rules.json, engine.js, storage.js. The kit deliberately contains no finished interface or matching engine.

## Acceptance cases the students must implement and verify

| Input/action | Expected behavior |
|---|---|
| California, no FAR clause, not enrolled | Federal baseline tasks; no claim that all California private employers must enroll. CA-specific claim remains blocked until statute review. |
| California, FAR clause confirmed | Contractor review/enrollment path; explain clause basis; do not assume every federal contract qualifies. |
| FAR clause unknown | Explicit “needs review” card with the official contractor source. |
| E-Verify participant, no FAR clause | Participation obligations only after each rule is researched. |
| State outside supported coverage | “State rules not covered”; federal-only results cannot imply state compliance. |
| Monday hire, standard calendar | Section 2 target Thursday; Friday hire target Wednesday. |
| Job lasts fewer than three days | Section 2 target hire date. |
| Negative/non-integer headcount or impossible date | Clear validation; no results generated. |
| Change business/contract answers | Regenerate rule explanations and invalidate obsolete tasks; no stale completion. |
| Check task, reload, uncheck | Progress and activity remain consistent. |
| Source review missing or expired | Rule explicitly needs review, rather than appearing as verified law. |
| No tasks completed | Honest empty progress; no fabricated activity. |

## Focused AI code support

`support/dates.mjs` and `tests/dates.test.mjs` are AI-written. Test with `node --test tests/dates.test.mjs`. No runtime dependencies. No holiday calendar is auto-generated. Weekday/closure choices must be reviewed for the employer and legal rule. UTC avoids timezone and daylight-saving drift; input validation rejects invalid civil dates.

See research/SOURCES.md for verified sources and outstanding research, submission/DRAFTS.md for answers and the demo outline, and submission/CONTRIBUTIONS.md for the truthful work log.

## Work schedule

- Oct 13–15: confirm existing work, source review, profile and engine implementation.
- Oct 16–18: interface, checklist, persistence, evidence trace.
- Oct 19–21: test edge cases and get feedback from at least two real target users if possible. Do not invent interviews.
- Oct 22–23: fix findings and record a 2:40 demo.
- Oct 24–25: truthful answers, AI disclosure, public video playback check, portal review and early submission.
- Oct 26: deadline buffer; do not plan the first upload for deadline morning.
