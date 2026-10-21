# Contribution and assistance record

Do not fill student rows until the work happens. Keep commits, screenshots, test outputs, and notes as supporting evidence. A suggested ownership split is not proof of actual authorship.

| Date | Contributor | Actual work/files | Evidence | Assistance used | Can explain and reproduce? |
|---|---|---|---|---|---|
| 2026-10-13 | Codex AI | Vault review, official-source research, build kit, submission drafts; support/dates.mjs; tests/dates.test.mjs | This kit and test output | AI generated | Student review pending |
| Historical, before this kit | Claude AI | Concept and wireframe/prototype assistance per archive | Opusol Product demo feedback archive | AI generated | Team review pending |
| | Krish | | | | |
| | Shreyansh | | | | |

Before submitting, each student should be able to explain their own implementation, trace one matched and one unmatched rule, show handling of unknown data, and demonstrate an actual bug fix. Copying this kit or renaming AI files does not establish significant student contribution.

## Full implementation update

After the initial build-kit request, Sat authorized Codex to build the full app. Codex generated the Next.js interface, TypeScript rules engine, validation, Supabase auth integration, API handlers, SQL schema/RLS/transaction functions, sample workspace, tests, and deployment configuration. Earlier wording describing AI code as limited to the date helper no longer describes the full repository. Any submission must disclose the full extent of assistance.

October 14: Codex reviewed the supplied Cursor DESIGN.md, preserved Claude source conversation, and official CAC rules/graphics; implemented the warm light/dark visual system, persistent theme controls, improved landing page, source-guide chat, local Ollama adapter, optional on-device photo comparison, and gated Google OAuth handler. Codex installed Ollama and downloaded Llama 3.2:3b on the user's Mac. Human/TFJS and third-party models are credited in the repository. These are AI implementation contributions and must not be described as student-written code.

Public-release revision: Codex made the repository public after a common-secret-pattern history scan, redesigned the public pages, implemented the shareable public planner and its validation tests, integrated a real in-browser Llama 3.2 worker and conversation history, and prepared Docker/Render hosting configurations. Local AI uses a third-party pretrained Meta Llama model and Hugging Face/ONNX software; source and model licenses are recorded. The student team must accurately distinguish this generated implementation from their own technical contributions.

## October 20 update (Claude Code, Sonnet 5.5)

At Sat's request, Claude Code redesigned the landing page and shared styles (Apple-style system, Radix accordion and tabs), added the E-Verify case walkthrough at `/case` with a due-date calculator and tests, and replaced the face-comparison model: Human/FaceRes was swapped for YuNet + SFace from the OpenCV Zoo (`lib/face/`, `scripts/face-benchmark.ts`, `tests/face.test.ts`, `research/FACE-MODEL.md`). Accuracy was measured against the LFW test pairs, not claimed from the model cards. Claude also drafted `STUDENT-WORK-PLAN.md`, `USER-RESEARCH.md`, and `DEMO-SCRIPT.md`. All of this is AI-generated code and writing. It does not count as student contribution and must be disclosed. No student rows have been filled in.
