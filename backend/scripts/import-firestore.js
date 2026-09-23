require('dotenv').config();
const { admin } = require('../config/firebase-admin');
const { db, closeDatabase } = require('../config/database');
const { COLLECTIONS, importRecords } = require('../db/import-firestore');
const apply = process.argv.includes('--apply');
async function* pages(source, name) {
  let last;
  for (;;) {
    let query = source.collection(name).orderBy(admin.firestore.FieldPath.documentId()).limit(200);
    if (last) query = query.startAfter(last);
    const snapshot = await query.get();
    for (const document of snapshot.docs) yield document;
    if (snapshot.size < 200) break;
    last = snapshot.docs.at(-1);
  }
}
(async () => {
  console.log(apply ? 'Importing into Neon. Existing records will never be overwritten.' : 'DRY RUN: reading and validating Firestore. No records will be written.');
  if (apply && process.env.FIRESTORE_WRITES_PAUSED !== 'true') throw new Error('Pause writes on the old app and set FIRESTORE_WRITES_PAUSED=true before import.');
  if (apply) await db.ready();
  const source = admin.firestore(); // The only runtime Firestore access is this operator-only import.
  for (const name of COLLECTIONS) {
    const counts = await importRecords(db, name, pages(source, name), { apply });
    console.log(`${name}: read=${counts.read} inserted=${counts.inserted} already-identical=${counts.skipped}`);
  }
  console.log('Finished. Keep the old Firestore database intact until the deployed app and counts are verified.');
})().catch(error => {
  console.error(['Pause writes', 'Unsupported Firestore', 'Target contains'].some(prefix => error.message.startsWith(prefix)) ? error.message : 'Import failed. Check source/target permissions, schema, connectivity and unsupported source fields.');
  process.exitCode = 1;
}).finally(async () => { await closeDatabase(); await admin.app().delete(); });
