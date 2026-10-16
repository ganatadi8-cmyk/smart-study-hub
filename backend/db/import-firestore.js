const { errorCode } = require('./store');
const COLLECTIONS = ['users', 'resources', 'tests', 'testAttempts', 'discussions', 'rateLimits'];
function normalize(value) {
  if (value === null || ['string', 'boolean', 'number'].includes(typeof value)) return value;
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, normalize(item)]));
  }
  throw new Error('Unsupported Firestore value. Export/convert this field before importing.');
}
async function importRecords(db, name, records, { apply = false } = {}) {
  if (!COLLECTIONS.includes(name)) throw new Error('Unsupported source collection.');
  const result = { read: 0, inserted: 0, skipped: 0 };
  for await (const record of records) {
    result.read++;
    const ref = db.collection(name).doc(record.id);
    const data = normalize(record.data());
    if (!apply) continue;
    try { await ref.create(data); result.inserted++; }
    catch (error) {
      if (errorCode(error) !== '23505') throw error;
      // Only an identical existing record is safe to skip. A different record is
      // a conflict to resolve deliberately, not a successful migration.
      const existing = await ref.get();
      const { isDeepStrictEqual } = require('node:util');
      if (!existing.exists || !isDeepStrictEqual(existing.data(), data)) {
        throw new Error('Target contains a different record. Import stopped without overwriting it.');
      }
      result.skipped++;
    }
  }
  return result;
}
module.exports = { COLLECTIONS, importRecords, normalize };
