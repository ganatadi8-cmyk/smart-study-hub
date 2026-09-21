# Smart Study Hub

An engineering study platform with branch-based materials, faculty uploads, student tests, discussions, a leaderboard, and an optional AI tutor.

## Stack and layout

- `frontend/`: React, Vite, Tailwind, Firebase Authentication.
- `backend/`: Express, Firebase Admin, Firestore, Firebase Storage, OpenAI.
- `backend/test/`: HTTP regression tests with isolated fake Firebase dependencies. No credentials or paid API calls.
- `firebase.json`, `firestore.rules`, `storage.rules`: local emulator configuration and default-deny client rules.

Use Node **24 LTS** (`.nvmrc`), npm, and a Firebase project. No mock login or silent in-memory database fallback remains.

## Real Firebase setup

1. In your Firebase project, enable Authentication → Email/Password. Add your frontend hostname to authorized domains. Create Firestore and a Storage bucket. Use the bucket's actual name, not a guessed suffix. Provision these services and any billing needed in your own project.
2. Register a Firebase web app. Copy `frontend/.env.example` to `frontend/.env` and fill the web app configuration. These web identifiers are public configuration, not Admin credentials. Never put an OpenAI key or service-account private key in `VITE_*` variables.
3. Copy `backend/.env.example` to `backend/.env`. Set the project ID, bucket and public API URL. Use Application Default Credentials on managed infrastructure, or set `GOOGLE_APPLICATION_CREDENTIALS` to an absolute service-account JSON path **outside the repository**. Give the API service account access to Auth, Firestore and its Storage bucket. No credentials are included here.
4. Deploy the repository's Firestore and Storage rules with the Firebase CLI, after choosing the correct project:
   ```sh
   firebase deploy --only firestore:rules,storage --project YOUR_PROJECT_ID
   ```
   These rules deny all direct client database/storage access. The API uses Admin credentials; it enforces its own authorization. Do not mix these rules into an unrelated Firebase app without checking its needs.
5. In one terminal:
   ```sh
   cd backend
   npm ci
   npm start
   ```
6. In another terminal:
   ```sh
   cd frontend
   npm ci
   npm run dev
   ```
7. Open `http://localhost:5173`, sign up and use **Verify email** to send a verification link. New accounts always become students. The profile is saved in Firestore when the signed-in app loads it.
8. Optionally run `npm run seed` from `backend/` to create a sample test. This is create-only. Publish changed questions under a new test ID because scoring is once per student per test ID.

Without an OpenAI key, AI chat returns a clear unavailable message; all other features still start. Missing Firebase configuration fails visibly instead of silently creating demo accounts/data. `/api/health` checks the process; `/api/ready` checks Firestore access.

## Local Firebase emulators (no cloud credentials)

Install the Firebase CLI and the Java runtime required by that CLI's Firestore emulator. From the repository root:

```sh
firebase emulators:start --project demo-smart-study-hub --import=.firebase-data --export-on-exit=.firebase-data
```

For the very first run, omit `--import=.firebase-data`. In `backend/.env`, use:

```dotenv
FIREBASE_PROJECT_ID=demo-smart-study-hub
FIREBASE_STORAGE_BUCKET=demo-smart-study-hub.appspot.com
USE_FIREBASE_EMULATORS=true
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
```

Remove `GOOGLE_APPLICATION_CREDENTIALS`. In `frontend/.env`, use the same project ID, `demo-key` for the API key, `demo-smart-study-hub.firebaseapp.com` for authDomain, `demo-app` for appId, and `VITE_USE_FIREBASE_EMULATORS=true`. Keep the API URL set to your local backend. Start both apps as above. Verification links appear in the Auth emulator output. Emulator export/import preserves development data; without export, emulator data is disposable.

Emulators are explicitly forbidden when the backend runs with `NODE_ENV=production`. Frontend emulator connections are enabled only by Vite development mode. Automated regression tests do not need running emulators.

## Faculty and administrator roles

Sign up normally, then obtain the Firebase Auth UID from your project console or emulator. From a trusted backend machine with Admin credentials:

```sh
npm run set-role -- FIREBASE_UID Faculty
npm run set-role -- FIREBASE_UID Admin
# To remove privileged access:
npm run set-role -- FIREBASE_UID Student
```

The script preserves other custom claims, revokes existing sessions and mirrors the role to the profile. The user must sign out and back in. API authorization always reads **verified Firebase custom claims**, never a client-submitted role or editable profile field. The script must remain an operator-only tool; do not expose it as a public endpoint.

## Security and behavior

- Tokens are verified with revocation checking; arbitrary/mock tokens fail. Passwords are handled by Firebase, not local storage.
- Resources are public to browse/download. Only verified Faculty/Admin accounts can upload. Deletion requires Faculty/Admin plus ownership (or Admin).
- Documents: PDF, DOCX, PPTX, maximum **10 MiB locally / 4 MiB on Vercel**. Extensions and detected file contents must agree; old DOC/PPT and direct video-file uploads are not accepted. Convert legacy documents to PDF or modern Office format. Videos use HTTPS links.
- Documents persist in Firebase Storage and download as attachments with `nosniff`. Type detection is not malware scanning; add a scanning/quarantine workflow before allowing untrusted file publishers at scale.
- Test listings omit answers. A Firestore transaction saves the first completed attempt and adds points once. Retrying or concurrently submitting returns the saved result. Only students can submit. A new test ID is required for a new scored attempt.
- AI requires verified email. Shared Firestore counters cap requests per user and globally per hour, including failed upstream attempts. Defaults: 20/user and 200 globally. Configure `AI_REQUESTS_PER_HOUR` and `AI_GLOBAL_REQUESTS_PER_HOUR`. Windows reset on the hour; counts persist across API instances/restarts. Do not delete rate-limit counters during a live window.
- AI permits only user/assistant messages (20 messages, 4,000 characters each, 16,000 total), limits output to 800 tokens, times out after 30 seconds, and performs no automatic paid retries. Configure `OPENAI_MODEL` for a compatible Chat Completions model. It does not search uploaded documents.
- Deleting a user removes their Firebase Auth account and profile. Historical discussions, resources and attempts are retained; this is not an erasure/export workflow.

## Deployment

For hosting both apps on Vercel, follow [DEPLOYMENT.md](DEPLOYMENT.md). It covers the two projects, Firebase secret configuration and end-to-end checks.

Set backend `NODE_ENV=production`, real Firebase credentials and bucket, `PUBLIC_API_URL=https://api.example.com/api`, and `CORS_ORIGINS=https://study.example.com` (comma-separated exact origins). Use HTTPS. CORS is a browser policy, not authentication. Never set emulator host variables in production.

Set frontend `VITE_API_URL=https://api.example.com/api` and your Firebase web settings **before** `npm run build`. Publish `frontend/dist` with SPA fallback to `index.html`. Environment changes require a rebuild. The backend needs no persistent local upload disk. Keep secrets in your host's secret manager; the service account must never ship with the frontend.

For an older installation, move previous local uploads into Storage and update each resource's `storagePath`, `mimeType`, and `fileURL`; the old `/uploads` directory is no longer served. Browser demo accounts are not real Firebase users: sign up again. Existing legitimate Firebase test scores are retained, but historic attempts without `testAttempts` records cannot be automatically deduplicated; use new test IDs or migrate attempt records before reopening scoring.

## Checks

```sh
cd backend
npm ci
npm test
cd ../frontend
npm ci
npm run lint
npm run build
```

GitHub Actions runs these checks. The API suite exercises authentication, role boundaries, profile persistence, answer secrecy, duplicate/concurrent scoring, upload validation and AI limits against deterministic fake services. It does **not** prove live Firebase IAM, emulator behavior, email delivery or OpenAI connectivity. Before launch, use the emulator or a staging project to sign up, verify email, assign a faculty role, upload/download/delete a document, submit/retry a test, and send an AI question. Never test destructive flows on production data.
