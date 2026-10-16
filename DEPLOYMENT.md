# Publish Smart Study Hub with Neon

The code supports a public website/API on Vercel and application data in Neon PostgreSQL. A successful build is not a deployment. Real hosting access, database URLs and Firebase credentials must be configured before the app can go live.

## 1. Create the Neon database

In [Neon Console](https://console.neon.tech/), create a dedicated `smart-study-hub` project/database or an isolated database/branch. Do not replace the existing diary database. Choose a region near the Vercel API region. Copy the pooled and direct connection strings from **Connect**.

| Setting | Used for | Where to save it |
| --- | --- | --- |
| `DATABASE_URL` | Normal API queries; pooled hostname | Backend Vercel sensitive environment variable and local backend `.env` |
| `DATABASE_URL_UNPOOLED` | Drizzle schema migrations; direct hostname | Trusted operator machine / private migration job |

The URLs contain passwords. Do not place them in frontend settings, GitHub, screenshots, or public links. The normal API uses `pg` with a small reusable pool and Vercel's pool lifecycle helper. All remote database connections enforce verified TLS.

On a trusted machine, from `backend/`:

```sh
npm ci
npm run db:migrate
```

The command uses `DATABASE_URL_UNPOOLED` from `backend/.env`. The committed Drizzle migration creates six `study_*` tables and indexes. It does not drop or alter old Firestore data. New schema changes should be generated with `npm run db:generate`, reviewed and tested on a Neon development branch before applying to production. Never run production migrations implicitly in `npm run build`.

## 2. Import existing Firestore records, if any

Firebase login accounts and optional stored files remain in their current services. Only Firestore application records move.

1. Back up the old records and pause writes on the old application. Keep it paused until the database cutover is verified.
2. Configure backend Firebase Admin credentials for the same Firebase project and the target Neon `DATABASE_URL`. Give the import operator read access to Firestore.
3. Run `npm run db:import-firestore` for a dry run. It checks all six source collections and prints counts, not document contents.
4. Set `FIRESTORE_WRITES_PAUSED=true` and run `npm run db:import-firestore -- --apply`.
5. The import retains record IDs, test attempts, scores, replies, file references and rate counters. It can be resumed: identical existing records are skipped; differing records stop the process for manual resolution. It never overwrites or deletes source records.
6. Compare source/import counts and sample records. Only then point the website at the Neon-backed API and reopen writes. Do not delete the old Firestore data yet. After accepting writes in Neon, do not revert to the stale Firestore API without a reconciliation plan.

Skip this section if there are no source records. Run `npm run seed` to create the optional sample test; it does not overwrite an existing test.

## 3. Deploy the API on Vercel

Import `ganatadi8-cmyk/smart-study-hub` as a project with **Root Directory `backend`**, Express framework, Node 24. Deploy the branch containing the Neon migration until it is merged to `main`. Set production environment variables:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Sensitive, pooled Neon URL |
| `FIREBASE_PROJECT_ID` | `studyhub-16fdf-53e36` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Sensitive, complete Admin service-account JSON matching the project |
| `PUBLIC_API_URL` | Actual stable API origin plus `/api` |
| `CORS_ORIGINS` | Actual stable website origin, no trailing slash |
| `USE_FIREBASE_EMULATORS` | `false` |
| `FIREBASE_STORAGE_BUCKET` | Optional actual bucket name; enables document uploads |
| `OPENAI_API_KEY` | Optional sensitive key; enables AI |
| `OPENAI_MODEL` | `gpt-4o-mini` or another compatible model |
| `AI_REQUESTS_PER_HOUR` | `20` |
| `AI_GLOBAL_REQUESTS_PER_HOUR` | `200` |

Set secrets directly in Vercel's backend environment settings. Do not paste keys into chat or upload a service-account file to GitHub. Normal Auth/Storage credentials no longer require Firestore access. Remove all emulator host variables in production. No persistent local upload disk is used.

Use stable project domains for API URLs and CORS. If those settings change after the first deployment, redeploy. Configure this app's production API to be reachable by the public website; Firebase tokens continue to protect restricted actions. Leave preview deployments protected unless deliberately testing a public preview.

## 4. Deploy the website on Vercel

Import the same repository as a second project with **Root Directory `frontend`**, Vite, Node 24. The committed `frontend/vercel.json` includes build/output settings and SPA fallback.

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | Actual stable API origin plus `/api` |
| `VITE_FIREBASE_API_KEY` | Firebase web app API key (public web configuration) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase web app auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `studyhub-16fdf-53e36` |
| `VITE_FIREBASE_APP_ID` | Firebase web app ID |
| `VITE_USE_FIREBASE_EMULATORS` | `false` |

Add the final website hostname to Firebase Authentication authorized domains. Rebuild after changing a `VITE_*` variable. Never add database URLs or Admin credentials to this project. Make the website's production deployment public if needed; this does not mean making Neon publicly writable.

## 5. Verify before sharing

- Public website and direct reload of `/login` work in a signed-out browser.
- API `/api/health` returns 200. `/api/ready` returns `{"status":"ready","database":"postgresql"}`; this checks all six migrated tables.
- Signup, email verification, login and profile reload succeed; `study_users` shows the saved profile in Neon.
- Browse resources, post/reload a discussion, submit/retry a seeded test. Points are awarded once.
- Assign Faculty with the operator script, sign out/back in, and share a video link. If Storage is configured, verify PDF upload/download/delete.
- If enabled, AI requires verified login and applies shared database quotas.

Give users the verified website URL. Give the owner the private Neon project dashboard URL for inspecting the tables. A PostgreSQL connection string is an application credential, not a web page or public database browser.

## Local checks

`npm test` in `backend` and `npm run lint && npm run build` in `frontend`. To run SQL integration tests locally, set `TEST_DATABASE_URL` to a disposable local PostgreSQL database. CI provisions PostgreSQL 17 automatically. Fake Auth/Storage tests and local PostgreSQL checks do not validate hosted IAM, Firebase email delivery, or live Neon/Vercel access.
