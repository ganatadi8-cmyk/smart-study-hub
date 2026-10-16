const { randomUUID } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const { eq, and, sql } = require('drizzle-orm');
const schema = require('./schema');

function errorCode(error) {
  for (let cause = error; cause; cause = cause.cause) if (cause.code) return cause.code;
}
function createStore(orm) {
  const referenceKey = Symbol('database reference');
  function tableFor(name) {
    if (!Object.hasOwn(schema, name)) throw new Error('Unknown study collection.');
    return schema[name];
  }
  function snapshot(id, row) {
    return { id, exists: Boolean(row), data: () => row ? structuredClone(row.data) : undefined };
  }
  function payload(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new TypeError('Record must be an object.');
    return JSON.parse(JSON.stringify(data));
  }
  function document(name, id = randomUUID(), executor = orm) {
    if (typeof id !== 'string' || !id || id.length > 1500 || id.includes('/')) throw new Error('Invalid record ID.');
    const table = tableFor(name);
    return {
      id,
      [referenceKey]: { name, id },
      async get() {
        const [row] = await executor.select({ data: table.data }).from(table).where(eq(table.id, id)).limit(1);
        return snapshot(id, row);
      },
      async set(data, options) {
        const value = payload(data);
        await executor.insert(table).values({ id, data: value }).onConflictDoUpdate({
          target: table.id,
          set: { data: options?.merge ? sql`${table.data} || ${JSON.stringify(value)}::jsonb` : value, updatedAt: sql`now()` },
        });
      },
      async create(data) {
        // A duplicate is an error: seeding and import must never overwrite live data.
        await executor.insert(table).values({ id, data: payload(data) });
      },
      async update(data) {
        const rows = await executor.update(table).set({
          data: sql`${table.data} || ${JSON.stringify(payload(data))}::jsonb`, updatedAt: sql`now()`,
        }).where(eq(table.id, id)).returning({ id: table.id });
        if (!rows.length) throw Object.assign(new Error('Record not found.'), { status: 404 });
      },
      async delete() { await executor.delete(table).where(eq(table.id, id)); },
    };
  }
  function collection(name, filters = []) {
    const table = tableFor(name);
    return {
      doc: id => document(name, id),
      where(field, operator, value) {
        if (operator !== '==' || typeof field !== 'string' || !/^[a-zA-Z][a-zA-Z0-9]*$/.test(field)) throw new Error('Unsupported filter.');
        return collection(name, [...filters, [field, value]]);
      },
      async get() {
        // Field names and values are SQL parameters, never interpolated identifiers.
        const conditions = filters.map(([field, value]) => typeof value === 'string' ? sql`${table.data}->>${field} = ${value}` : sql`${table.data}->${field} = ${JSON.stringify(value)}::jsonb`);
        const rows = await orm.select({ id: table.id, data: table.data }).from(table).where(and(...conditions));
        const docs = rows.map(row => snapshot(row.id, row));
        return { docs, size: docs.length, empty: !docs.length, forEach: fn => docs.forEach(fn) };
      },
      async add(data) { const ref = document(name); await ref.create(data); return ref; },
    };
  }
  return {
    collection,
    async ready() {
      // Check every migrated table, not just whether the server accepts connections.
      for (const table of Object.values(schema)) await orm.select({ id: table.id }).from(table).limit(1);
    },
    async runTransaction(callback) {
      for (let attempt = 0; ; attempt++) {
        try {
          return await orm.transaction(async executor => {
            const writes = [];
            const bind = ref => {
              const key = ref[referenceKey];
              if (!key) throw new Error('Transaction requires a reference from this database.');
              return document(key.name, key.id, executor);
            };
            // Queue writes to preserve the existing read-first API contract.
            const tx = { get: ref => bind(ref).get() };
            for (const operation of ['set', 'create', 'update', 'delete']) {
              tx[operation] = (ref, ...args) => { writes.push(() => bind(ref)[operation](...structuredClone(args))); };
            }
            const result = await callback(tx);
            for (const write of writes) await write();
            return result;
          }, { isolationLevel: 'serializable' });
        } catch (error) {
          // Real PostgreSQL conflicts, including concurrent first submissions, retry
          // the ENTIRE transaction. No external side effects belong in callbacks.
          if (!['40001', '40P01'].includes(errorCode(error)) || attempt >= 7) throw error;
          await delay(Math.min(10 * 2 ** attempt, 250) + Math.floor(Math.random() * 20));
        }
      }
    },
  };
}
module.exports = { createStore, errorCode };
