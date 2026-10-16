# Smart Study Hub deployment status

Verified on 2026-10-16.

## Database provisioned

- Dedicated Neon project: `smart-study-hub` (`proud-surf-00496109`).
- Region: `aws-us-east-1`; PostgreSQL 17.
- Branch: `production` (`br-young-recipe-b86ukxpf`).
- Database: `studyhub`; owner role: `studyhub_owner`.
- All six application tables exist: `study_users`, `study_resources`, `study_tests`, `study_test_attempts`, `study_discussions`, `study_rate_limits`.
- Applied the exact SQL produced by the committed Drizzle migration in a single transaction through the Neon connector because this environment could not establish a direct database connection. The Drizzle journal records hash `1abea30af7aeae8701fe5ffcb8eeef4259a442d12982033b6fd2e9b451574d65` and timestamp `1790161010057`.
- Existing Daily Diary infrastructure was not modified. No legacy Firestore data was imported; its existence has not been verified.
- No database passwords or connection strings are stored in the repository.

## Checks

24 available backend tests passed, frontend ESLint passed, and the frontend production build passed. PostgreSQL integration tests were not run locally because there is no disposable local PostgreSQL service. The database tables and migration journal were verified through the Neon connector; this does not establish application end-to-end readiness.

Hosted Vite builds now reject missing API/Firebase settings, non-HTTPS or localhost API URLs, embedded credentials/query strings, and enabled Firebase emulators.

## Remaining deployment steps

1. Restore Vercel access to team `ganatadi8-cmyks-projects` (`team_VmrxRZxMDxxxmEjASKbYQmoC`). Project inspection currently returns 403; the CLI fallback has no authenticated credentials.
2. In the `smart-study-hub-backend` project, set the pooled Neon connection as sensitive `DATABASE_URL`, Firebase Admin credentials, and the remaining variables in DEPLOYMENT.md. Verify root directory `backend` and the intended branch.
3. In `smart-study-hub-frontend`, verify root directory `frontend`; set the real API URL and Firebase web settings. Verify Firebase authorized domains and exact API CORS origin.
4. Determine whether legacy Firestore records exist. If so, follow the paused-write import process in DEPLOYMENT.md before cutover.
5. Deploy and verify API health/readiness, signup/verification/login, profile persistence, discussions, resources, and single-award test submissions.

The website is not yet verified live. Keep PR #2 in draft until deployment prerequisites and hosted flows are verified.
