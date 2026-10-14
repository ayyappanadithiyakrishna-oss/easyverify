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
