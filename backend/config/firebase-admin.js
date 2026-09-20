const admin = require('firebase-admin');
const projectId = process.env.FIREBASE_PROJECT_ID;
const emulated = process.env.USE_FIREBASE_EMULATORS === 'true';
if (!projectId) throw new Error('FIREBASE_PROJECT_ID is required. See backend/.env.example.');
if (emulated && process.env.NODE_ENV === 'production') throw new Error('Emulators are forbidden in production.');
if (emulated && (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST)) {
  throw new Error('Set all three Firebase emulator hosts.');
}
if (!emulated && ['FIREBASE_AUTH_EMULATOR_HOST', 'FIRESTORE_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST'].some(key => process.env[key])) {
  throw new Error('Emulator hosts require explicit USE_FIREBASE_EMULATORS=true.');
}
admin.initializeApp({
  projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  ...(!emulated ? { credential: admin.credential.applicationDefault() } : {})
});
module.exports = { admin, db: admin.firestore(), auth: admin.auth(), storage: admin.storage() };
