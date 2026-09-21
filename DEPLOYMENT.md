# Deploy the frontend and backend on Vercel

This repository is deployment-ready but does not contain a Vercel account connection or live Firebase credentials. Deployment URLs only exist after successful deployments; no example hostname below is a live link.

## Hosting layout

| Component | Provider | Vercel root directory |
| --- | --- | --- |
| Website | Vercel (Vite) | `frontend` |
| API | Vercel (Express) | `backend` |
| Database | Cloud Firestore in your Firebase project | Not hosted in Vercel |
| Login | Firebase Authentication | Not hosted in Vercel |
| Uploaded documents | Firebase Storage | Not hosted in Vercel |

Create two Vercel projects linked to this repository. Deploy the reviewed `improve/security-and-setup` branch, or merge the reviewed PR before deploying `main`. Set Node.js 24.x in both projects. Each directory includes its own `vercel.json`. Do not deploy the repository root as a Vite project.

## 1. Firebase

Use an existing project or create one in [Firebase Console](https://console.firebase.google.com/). Enable Email/Password Authentication, create Firestore, and provision a Storage bucket. Register a web app and keep its public configuration. Follow the root README to deploy the default-deny database/storage rules. The project owner must configure any required billing.

Obtain the backend service-account JSON through your project's service account settings. Add the complete JSON directly to **the backend Vercel project's sensitive environment variables**, not a chat message, frontend setting, or repository file. Use a service account authorized to manage Auth and access this project's Firestore and Storage. The backend rejects a project-ID mismatch.

## 2. API project

Import the repo with root directory `backend` and Express framework. Choose the intended production branch. Use these production environment variables:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `FIREBASE_PROJECT_ID` | Actual Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | Optional; set to the actual bucket name only after Storage is provisioned. Without it, document uploads are disabled and HTTPS video links still work. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Complete service-account JSON; sensitive |
| `PUBLIC_API_URL` | Actual stable backend URL plus `/api` |
| `CORS_ORIGINS` | Actual stable website origin, no trailing slash |
| `USE_FIREBASE_EMULATORS` | `false` |
| `OPENAI_API_KEY` | Optional sensitive key; AI is unavailable without it |
| `OPENAI_MODEL` | `gpt-4o-mini` or another compatible configured model |
| `AI_REQUESTS_PER_HOUR` | `20` |
| `AI_GLOBAL_REQUESTS_PER_HOUR` | `200` |

Use the actual project domains assigned by Vercel for `PUBLIC_API_URL` and `CORS_ORIGINS`, then redeploy if these were added after the first deployment. Remove all emulator host variables and do not set `GOOGLE_APPLICATION_CREDENTIALS` to a path on your laptop: that path does not exist inside Vercel.

The API exports its Express application from `server.js`. It does not rely on a writable disk or a permanent listening process on Vercel. Firebase clients initialize once per function instance. Vercel automatically sets `VERCEL=1`; uploads are capped at **4 MiB** there, leaving room for multipart metadata below the platform's 4.5 MB payload limit. Elsewhere the existing 10 MiB limit remains. `/api/resources/upload-config` tells the frontend the active limit. Old larger documents require a direct-storage download flow or another backend host before migration to Vercel.

## 3. Website project

Import the same repo again with root directory `frontend` and Vite framework. The build and output settings are already in `frontend/vercel.json`. Set:

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | Actual stable backend URL plus `/api` |
| `VITE_FIREBASE_API_KEY` | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase web app auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Same Firebase project ID as the backend |
| `VITE_FIREBASE_APP_ID` | Firebase web app ID |
| `VITE_USE_FIREBASE_EMULATORS` | `false` |

Add the final website hostname to Firebase Authentication's authorized domains. Rebuild after changing any `VITE_*` variable. The SPA rewrite allows direct visits to `/login`, `/dashboard`, etc. If the backend has Vercel Deployment Protection enabled, configure it so the intended public website can call the API; Firebase authentication still protects private actions. Do not disable protection on unrelated projects.

## 4. Verify and collect real links

1. Open the website and directly reload `/login`.
2. Open the backend root: it should identify Smart Study Hub API.
3. Open backend `/api/health`: expect 200 and `status: ok`.
4. Open backend `/api/ready`: expect 200 and `status: ready` (proves a Firestore read succeeded).
5. Sign up, send/complete email verification, then reload the page. The saved profile should remain.
6. Assign Faculty via the trusted role script, sign out and back in, and upload/download/delete a small PDF.
7. Seed a test, submit it as a student and retry. Points must be awarded once.
8. If configured, send an AI question from a verified account.

Return the actual website URL, backend root, backend `/api/health`, backend `/api/ready`, and the project's Firebase Console links for Firestore, Authentication and Storage. Firebase Console links require the owner's Google login; they are not public database endpoints. Do not report deployment success until the appropriate checks succeed.

## Reference

- [Vercel Express deployment](https://vercel.com/docs/frameworks/backend/express)
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel function payload limits](https://vercel.com/docs/functions/limitations)
