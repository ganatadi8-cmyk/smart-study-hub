# Frontend

See the [root setup guide](../README.md) for Firebase configuration, API configuration, emulator use, deployment and verification.

```sh
npm ci
# Copy .env.example to .env and fill in the Firebase web configuration.
npm run dev
npm run lint
npm run build
```

All requests use `src/services/api.js`. `VITE_API_URL` must include `/api` and is compiled into the build. Authentication is provided by Firebase; new registrations are always students.
