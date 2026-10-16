import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  // Keep local builds available; validate provider settings before publishing.
  if (process.env.VERCEL === '1') {
    const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
    const required = ['VITE_API_URL', 'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID']
    const missing = required.filter(key => !env[key]?.trim())
    if (missing.length) throw new Error(`Missing website settings: ${missing.join(', ')}. Set them in the frontend Vercel project and rebuild.`)
    let api
    try { api = new URL(env.VITE_API_URL) } catch { /* report only the setting name */ }
    if (!api || api.protocol !== 'https:' || api.username || api.password ||
        /^(localhost|127\..*|\[::1\])$/i.test(api.hostname) ||
        api.search || api.hash || api.pathname.replace(/\/$/, '') !== '/api') {
      throw new Error('VITE_API_URL must be the public HTTPS backend URL ending in /api, without credentials, query parameters, or a fragment.')
    }
    if (env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      throw new Error('Disable VITE_USE_FIREBASE_EMULATORS for hosted deployments.')
    }
  }
  return { plugins: [react()] }
})
