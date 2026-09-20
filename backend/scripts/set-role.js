require('dotenv').config();
const { auth, db } = require('../config/firebase-admin');
const [uid, role] = process.argv.slice(2);
if (!uid || !['Student', 'Faculty', 'Admin'].includes(role)) {
  console.error('Usage: npm run set-role -- <firebase-uid> Student|Faculty|Admin');
  process.exitCode = 1;
} else {
  (async () => {
    const user = await auth.getUser(uid);
    await auth.setCustomUserClaims(uid, { ...user.customClaims, role });
    await auth.revokeRefreshTokens(uid);
    await db.collection('users').doc(uid).set({ role }, { merge: true });
    console.log('Role updated. The user must sign out and sign in again.');
  })().catch(error => { console.error(error.message); process.exitCode = 1; });
}
