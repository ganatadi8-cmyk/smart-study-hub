const admin = require('firebase-admin');
const projectId = process.env.FIREBASE_PROJECT_ID;
const emulated = process.env.USE_FIREBASE_EMULATORS === 'true';
if (!projectId) throw new Error('FIREBASE_PROJECT_ID is required. See backend/.env.example.');
if (emulated && process.env.NODE_ENV === 'production') throw new Error('Emulators are forbidden in production.');
if (emulated && (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST)) {
  throw new Error('Set Firebase Auth and Storage emulator hosts.');
}
if (!emulated && ['FIREBASE_AUTH_EMULATOR_HOST', 'FIRESTORE_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST'].some(key => process.env[key])) {
  throw new Error('Emulator hosts require explicit USE_FIREBASE_EMULATORS=true.');
}
let credential;
if (!emulated) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    let serviceAccount;
    try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON); }
    catch { throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON.'); }
    if (serviceAccount.project_id !== projectId || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('The Firebase service account must match FIREBASE_PROJECT_ID and contain client_email and private_key.');
    }
    try { credential = admin.credential.cert(serviceAccount); }
    catch { throw new Error('The Firebase service account credential is invalid.'); }
  } else {
    credential = admin.credential.applicationDefault();
  }
}
admin.initializeApp({
  projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  ...(!emulated ? { credential } : {})
});
module.exports = { admin, auth: admin.auth(), storage: admin.storage() };
