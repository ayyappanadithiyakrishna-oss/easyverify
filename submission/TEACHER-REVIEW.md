# EasyVerify teacher review

## What to review

Open the public application, then choose **Try the working demo**. The demo uses isolated sample records and no real worker information.

1. Compare Riverside Workshop and Inland Contract Services. Their FAR clause answers produce different matched and unresolved requirements.
2. Open Section 2; examine the input trace, source, responsibility, and calendar target.
3. Report completion, reload, and confirm that demo progress persists.
4. Edit a profile and save. The version changes and prior confirmations no longer count for the new profile.
5. Add a sample hire after confirming offer acceptance. Compare normal versus short-job timing.
6. Open sources and examine which records are reviewed and which remain unresolved.
7. Try narrow-screen navigation, print the current report, and export a JSON report.

## Backend review

The live employer/new-hire path uses Supabase Auth and tenant-isolated database tables. Invitations are generated with cryptographic tokens, stored as hashes, bound to verified recipient emails, and redeemed transactionally. Profile saves and completion records use optimistic versions; activity records are immutable to normal client roles.

Database tests run the actual SQL migration against an isolated PostgreSQL instance. Live sign-up/email/reset/cross-device verification requires provisioning the selected Supabase organization and configuring deployment credentials. Check `VERIFICATION.md` for the current delivery status; do not assume these live paths have been verified from the demo.

## Authorship

OpenAI Codex generated this implementation and tests. Claude assisted earlier with concept development and the screen references. Students should not describe the repository as entirely student-written. The finished contest entry needs truthful individual contributions and disclosure under the official rules.

## Suggested 2:40 demo

- 0:00–0:20: participant names, EasyVerify, audience, one-sentence purpose.
- 0:20–1:00: compare the two business profiles and explain the changed output.
- 1:00–1:35: open a requirement, show source and input trace, explain unknown answers.
- 1:35–2:00: completion, persistence, and profile-change invalidation.
- 2:00–2:20: deadline or short-job example and meaningful tests.
- 2:20–2:40: actual student contributions, tools, AI assistance, and remaining coverage.
