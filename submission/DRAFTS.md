# Submission drafts — edit after the students build

**Not ready to submit.** Purpose text describes intended behavior, not verified implemented features. Bracketed sections require student facts. Do not invent student authorship, research, testing, or lessons. Confirm actual portal wording before copying.

## App title

EasyVerify — Compliance Compass (confirm the portal accepts a subtitle; keep the registered title consistent).

## Purpose

EasyVerify helps small-business owners turn employment-verification guidance into an understandable checklist. A business profile determines which supported rules need attention. Each result explains why it appears and links to its official source. Users can track their own checklist progress and see a hiring-date target under the selected working calendar. Our first version focuses on California and federal guidance; it does not perform identity verification, create government E-Verify cases, or certify legal compliance.

Use this only after those features are working. Delete any feature that is not implemented.

## Inspiration

Small businesses can struggle to distinguish Form I-9 responsibilities from E-Verify participation and contract-specific obligations. We wanted to make the decision process clearer for businesses in our community without requiring them to navigate long legal documents first.

[Students: add the actual observation that inspired you. If you interviewed someone, name their role with permission and describe what they said. If not, do not claim interviews or measured demand.]

## Technical challenge

[Students: identify a problem you actually encountered in your own code; describe the failing input, your initial implementation, the change you made, and the test that proves it worked.]

Suggested evidence to collect: an unknown FAR-clause answer that originally produced a misleading result, stale checklist completion after editing a profile, or calendar differences around a weekend. These are test opportunities, not claims that you personally solved them. The provided date helper was AI-written and must not be described as entirely student-authored.

## Learning / biggest takeaway

[Each student: explain a real lesson with one concrete example from work you did. Show how you can explain the rule matcher, storage, validation, or interface decisions. Do not use a generic fabricated learning story.]

## Version 2

We would expand state coverage only after reviewing authoritative sources and adding boundary tests. We would also add a clearer review process for outdated rules and test the interface with more small-business users. We would keep employee-sensitive information outside the application unless a later version had a defensible need and appropriate protections.

## AI disclosure — base text

We used OpenAI Codex to review our prior project notes, verify competition requirements and selected official sources, prepare a build specification and acceptance cases, draft submission material, and generate a focused civil-date calculation helper with tests. Codex did not implement the core matching engine or application interface in this build kit. We also used Claude earlier for concept development and prototype/wireframe assistance, as recorded in our project archive.

[Students: list all other AI use, generated or modified files, prompts or tasks, and your review/integration changes. Identify exactly which engine, interface, storage, and test work each student implemented. Adjust the statement if later assistance changes the scope. Do not claim “all code was written by us.”]

## Demo video — target 2:40, maximum 3:00

- **0:00–0:15 — Introductions:** “We are [confirmed participant names]. Our app is EasyVerify — Compliance Compass. It helps small-business owners understand supported employment-verification requirements and track the next steps.”
- **0:15–0:30 — Audience/problem:** explain one verified user problem; no unsupported claims about interviews or number of businesses helped.
- **0:30–1:00 — Profile:** enter a sample California business, explain contract-clause and participation inputs, generate results.
- **1:00–1:30 — Explainability:** open a real requirement; show the inputs that matched, official source, scope and review date. Change the contract answer to unknown and show the review state.
- **1:30–1:55 — Checklist:** complete one task, reload, show saved progress; clarify it is self-reported completion.
- **1:55–2:15 — Date feature:** show Monday→Thursday and short-job examples; explain configured calendar assumptions and the AI-assisted helper.
- **2:15–2:40 — Student work/tools:** name HTML/CSS/JavaScript and the actual libraries used, explain what each student implemented, disclose AI support, and state one actual lesson.

Record the functioning app, not a slide simulation. If a feature fails, fix it or omit its claim. Set the video PUBLIC on YouTube/Vimeo; play it while signed out. Leave a few seconds below three minutes.

## Final checklist

- [ ] Student-authored core app works and contribution evidence is truthful.
- [ ] Exact participant names, personal emails, parent contacts, school/home addresses and ZIP+4 entered privately in the portal.
- [ ] Hosting district and at least-half-team district eligibility confirmed.
- [ ] One entry per student; creation-date eligibility confirmed.
- [ ] Every shipped legal record reviewed; unsupported coverage visibly excluded.
- [ ] README includes setup instructions; judges can obtain source code.
- [ ] Demo 1–3 minutes, public, signed-out playback verified.
- [ ] Answers match actual app; all AI/tools/libraries disclosed.
- [ ] Students reviewed final portal entries and submitted before Oct 26, 9 AM Pacific.
- [ ] Submission receipt saved; every teammate completes the later exit questionnaire.

No registration changes, video upload, hosting deployment, or contest submission were performed by Codex.

## Updated disclosure for the full implementation

OpenAI Codex generated the full application implementation, including the interface, rules engine, validation, Supabase authentication integration, database migration and access policies, API routes, and tests. Claude previously assisted with the concept and wireframes. Student implementation, technical understanding, source review, interviews, and contribution claims must describe work that actually occurred. The earlier limited-support disclosure above is historical and must not be copied as the current disclosure.
