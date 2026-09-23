# Smart Study Hub

An engineering study platform with branch-based resources, faculty uploads, student tests, discussions, a leaderboard, and an optional AI tutor.

## Stack

| Component | Technology |
| --- | --- |
| Website | React, Vite, Tailwind |
| API | Express / Node 24 |
| Application database | Neon PostgreSQL, Drizzle ORM, node-postgres |
| Login and verified role claims | Firebase Authentication |
| Optional document files | Firebase Storage |
| Optional AI tutor | OpenAI API |
| Hosting configuration | Vercel, separate `frontend` and `backend` projects |

**Application data is now stored in PostgreSQL, not Firestore.** Firebase Authentication is retained so existing accounts, email verification and trusted role claims continue working. Files remain in optional Firebase Storage. Moving application data does not require users to reset their passwords.

The PostgreSQL schema has six prefixed tables: `study_users`, `study_resources`, `study_tests`, `study_test_attempts`, `study_discussions`, and `study_rate_limits`. Each has a primary ID, JSONB document payload, and update timestamp. This preserves existing API shapes and Firestore document IDs during import. Drizzle tracks the SQL migrations in `backend/drizzle`; filters use parameterized queries. Test attempts have a unique user/test index. Serializable transactions with bounded retries protect scoring, profile updates, reply appends, ratings and shared AI quotas from concurrent writes.

## Setup

1. Use Node 24 and npm. Create a dedicated **smart-study-hub** Neon project/database (or an isolated branch/database), separate from your diary app.
2. Copy `backend/.env.example` to `backend/.env`. Set `DATABASE_URL` to Neon's pooled connection string and `DATABASE_URL_UNPOOLED` to the direct one. Remote connections use certificate-verified TLS. Never share these URLs publicly.
3. Set Firebase project `studyhub-16fdf-53e36` (or your own project) and backend Admin credentials. Firebase Email/Password sign-in must be enabled. Give the service account access to Auth and optional Storage. Firestore permission is required only by the one-time import script.
4. Run the database migration from a trusted machine before starting the API:
   ```sh
   cd backend
   npm ci
   npm run db:migrate
   npm run seed
   npm start
   ```
   `db:migrate` requires the direct URL; it never runs automatically during public requests or builds. `seed` creates one sample test without overwriting existing questions.
5. Copy `frontend/.env.example` to `frontend/.env`, enter your Firebase **web** configuration, and set `VITE_API_URL=http://localhost:5000/api` for development. In another terminal:
   ```sh
   cd frontend
   npm ci
   npm run dev
   ```
6. Sign up and verify your email. New users are students. Profiles and scores are saved in Neon. Do not set up new Firestore rules or databases for normal use of this version.

Missing `DATABASE_URL` fails visibly. No temporary in-memory fallback or mock login is enabled. Missing AI credentials disables only AI. Missing a Storage bucket disables only document-file uploads; HTTPS video links still work.

## Existing Firestore data

See [DEPLOYMENT.md](DEPLOYMENT.md) for the cutover sequence. `npm run db:import-firestore` performs a read-only dry run; `npm run db:import-firestore -- --apply` imports after writes to the old application have been paused and `FIRESTORE_WRITES_PAUSED=true` is set. IDs, scores, saved attempts, discussions and counters are preserved. An identical imported record is skipped on retry. A differing record stops the import rather than overwriting it. The tool never deletes Firestore data or copies passwords.

Keep the old database and document files until the new app is verified. If there are no existing Firestore records, skip the import. Existing Firebase Storage file references remain valid. Legacy resources that only refer to a laptop `/uploads` path need their files moved to Firebase Storage separately.

## Roles and access

From a trusted backend machine with Firebase credentials and `DATABASE_URL`:

```sh
npm run set-role -- FIREBASE_UID Faculty
npm run set-role -- FIREBASE_UID Admin
npm run set-role -- FIREBASE_UID Student
```

Role changes preserve unrelated Firebase custom claims, revoke old sessions and mirror the profile role into Neon. Sign out and sign in again. API authorization trusts verified Firebase claims, never editable PostgreSQL profile fields or a role supplied by the browser.

Resources are public to browse/download. Private actions require a verified session; uploads require verified Faculty/Admin. Tests hide answers until submission and award points once per student/test ID. AI requires verified email and shared per-user/global hourly limits. Uploaded documents allow PDF, DOCX and PPTX (10 MiB locally; 4 MiB on Vercel). Videos use HTTPS links. Document validation is not a malware scan. Admin user deletion removes the Auth account and profile; historical resources, discussions and attempts are retained.

## Verification

```sh
cd backend
npm ci
npm test
cd ../frontend
npm ci
npm run lint
npm run build
```

Backend unit tests use isolated fake Auth/Storage/database dependencies. SQL integration tests require a **disposable local PostgreSQL** URL in `TEST_DATABASE_URL`; without it they are explicitly skipped. CI creates PostgreSQL 17 and runs both suites. The integration suite migrates a fresh temporary schema, tests the HTTP flows against real SQL transactions, checks persistence from a second connection, and removes only its temporary schema. It rejects remote database URLs. Do not point test commands at production.

For local manual development, use a Neon dev branch or local PostgreSQL plus Firebase Auth/Storage emulators:

```sh
firebase emulators:start --only auth,storage --project demo-smart-study-hub
```

Set backend `USE_FIREBASE_EMULATORS=true`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, `FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199`, the demo project ID and Storage bucket. Set frontend demo web values and `VITE_USE_FIREBASE_EMULATORS=true`. Keep PostgreSQL configured; there is no Firestore emulator dependency. Emulator mode is forbidden in production.

## Public deployment

Follow [DEPLOYMENT.md](DEPLOYMENT.md). The website and API can be publicly reachable while database credentials, Firebase Admin keys and protected actions remain private. A public GitHub repository is not a live website. Only report the site as live after deployment and `/api/ready` plus sign-in/resource flows have been verified.
