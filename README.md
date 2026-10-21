# EasyVerify — Compliance Compass

Public site: https://easyverify.vercel.app · Working demo: https://easyverify.vercel.app/demo

Employment-verification guidance and onboarding tracking for Inland Empire small businesses. Next.js 16.4, React 19.3, TypeScript, and Supabase.

## Run locally

Use Node.js 24:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The public `/demo` route is an isolated sample workspace with two businesses; its changes stay in that browser and are never sent to a customer database. The real `/workspace` and `/onboarding` routes require a configured Supabase backend.

```sh
npm run check
npm run build
npm audit
```

## Features

- Business profiles, exact headcount, contract-clause and participation inputs.
- Declarative, three-valued rule matching with input traces and explicit source review status.
- Composition of related federal and California records with all sources retained.
- Calendar-aware targets, short-job deadlines, retention calculations, and checklist tracking.
- Two-profile comparison, requirement details, source register, activity history, JSON report export, and print layout.
- Supabase email/password sign-up, verification, login, password recovery, and logout.
- Tenant-isolated backend schema, transactional mutations, optimistic profile version checks, protected new-hire records, and recipient-bound one-use invitations.

No biometric matching, government E-Verify connection, completed I-9 storage, or compliance certification is claimed.

## Backend setup

1. Create a dedicated Supabase project in the selected EasyVerify organization. Do not use the unrelated Snip project.
2. Apply `supabase/migrations/20261014055821_easyverify.sql` using the Supabase CLI or migration tool.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` in local and Vercel environments. No service-role key is needed by this application.
4. In Supabase Auth, enable email/password and email confirmation; configure the production site URL and allowed callback redirects. Confirmation emails must return to `/auth/callback`; hash-based templates may use `/auth/confirm`.
5. Use a production SMTP sender for general public sign-up. Supabase's default sender restricts recipient coverage; do not claim unrestricted email delivery until tested.
6. Test two unrelated employers and an invited hire using the actual deployed Supabase project. Run security advisors after migration.

Google and Microsoft login are deliberately absent until those providers are configured and tested. Creating an invitation produces a copyable link; it does not send email.

## Test evidence and limits

The suite includes 8 original date tests, 16 rule/validation tests, and 11 database tests. The database tests execute the actual migration in an isolated PostgreSQL WASM instance using test auth identities. They verify RLS, permissions, recipient matching, one-time redemption, expiration/revocation, role-specific completion, stale versions, atomic rollback, audit immutability, and rate limits. These are meaningful database checks, but are not a substitute for live Supabase Auth/email/PostgREST verification.

California Labor Code §§2814 and 90.2 were blocked by the official site's security verification. These records remain explicitly unverified review items. Federal contractor exceptions also remain review tasks. Other states are outside state-law coverage. No unresolved legal record is treated as verified.

## Provenance and authorship

Product history and screen references were recovered from the authoritative Opusol vault. The latest Claude screen files are preserved under `archive/claude-wireframes`; older local static work is under `archive/static`. These are reference archives, not the active app.

This implementation was generated with OpenAI Codex. Claude previously assisted with concept and wireframes. `submission/CONTRIBUTIONS.md` records the assistance accurately. The Congressional App Challenge requires significant student technical contributions and full AI disclosure; this repository does not establish eligibility by itself.

See `submission/TEACHER-REVIEW.md`, `research/SOURCES.md`, and `submission/DRAFTS.md` for review instructions, source limits, and contest preparation.

## October 14 design and feature update

The supplied Cursor reference is preserved in DESIGN.md, with project purpose in PRODUCT.md. ThemeToggle persists a light/dark choice under `easyverify-theme`; the initial theme follows the OS and is applied before paint. All workspace forms, reports, and public pages share the same theme tokens. Printed reports use light colors.

Ask EasyVerify is a source guide with citations, optional local Llama 3.2:3b answers, and no server-side chat storage. On this Mac, Ollama 0.40.4 is installed in `/Applications/Ollama.app`; the model has been downloaded and a localhost-only user LaunchAgent starts its service at login. `scripts/start-ollama-mac.sh` also starts it manually. The public website's local model option requires Ollama on the visitor's own computer and browser local-network permission; it is not a cloud-hosted Llama endpoint. No public tunnel or paid model API was created.

The optional `/identity-check` lab compares two consented photos entirely in the browser with YuNet (face detection, MIT) and SFace (face recognition, Apache-2.0) from the OpenCV Zoo, run through ONNX Runtime Web. The model files load only after comparison is requested. The report shows a cosine-similarity score, a plain-language band, and photo-quality warnings. On the standard LFW test pairs the reference pipeline is 98.7% accurate and our TypeScript port matched it on a 300-pair sample (98.3%), with no false matches in either; see `research/FACE-MODEL.md` for method, limits, and retraining pointers. It stores no photos or face data, makes no liveness or identity claim, and never changes onboarding state. Model credits and licenses are under public/models and public/vendor.

Google OAuth is implemented through Supabase `signInWithOAuth` and the existing PKCE callback. `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` remains false until the correct Supabase project, Google OAuth credentials, allowed redirects, and end-to-end callback are configured and tested. This update does not resolve the inaccessible EasyVerify organization.

See research/IMPROVEMENT-REVIEW.md for the Claude/rubric review, feature boundaries, and priorities. The teacher package records AI contributions; this full implementation does not establish contest eligibility.

## Public release: open it from another laptop

The repository is PUBLIC. The hosted site, `/plan`, and `/assistant` are public and require no GitHub account. The planner can recreate a plan on another device through a validated share link. Names/employee records are excluded; checklist completion remains a session-local report, not synchronized account data.

The browser chatbot is actual local Llama 3.2 inference, using Transformers.js 4.3.1, ONNX Runtime, and the pinned ONNX Community 1B q4 model. It downloads approximately 1.69 GB after the visitor chooses Load Llama 3.2. It runs in a Worker with WebAssembly and does not require Ollama or a hosted inference API. Browser memory/storage limits and CPU speed affect usability; the rules reference remains available. npm run build:worker generates the worker, and prebuild runs it automatically. npm run dev automatically generates the worker through predev on a fresh checkout.

The optional desktop Ollama adapter is retained under Advanced. The old CAC image was replaced with a discreet official-site text link, and the public design uses an ink-blue hiring sequence and mint actions.

Alternative hosting configuration is included: Dockerfile for standalone Next.js, render.yaml for a free Render service, and port 7860 compatibility for Docker Hugging Face Spaces. Neither alternate host has been provisioned; their accounts are not connected. See research/HOSTING.md for limits. The Supabase EasyVerify organization/Google OAuth credentials are still unavailable, so those live account services remain unconfigured.

The default local model is now HuggingFaceTB/SmolLM2-135M-Instruct (about 137 MB), with Llama 3.2 q4 available as the larger option. Both are real local inference. The browser's model-cache quota in QA was about 930 MB, so the larger Llama file could not be cached there. A conservative relevance/numeric guard rejects clearly unsupported output and shows the original reference; it is not legal validation.

From a generated plan, Ask about this plan opens chat with the validated public inputs. Context and dates come from the rules engine, not model arithmetic. Each conversation entry preserves its own original reference so later profile edits cannot silently change the explanation behind an older answer.
