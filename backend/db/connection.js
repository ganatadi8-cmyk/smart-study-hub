const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { attachDatabasePool } = require('@vercel/functions');

function connectDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL is required. Set the backend Neon PostgreSQL connection string.');
  let url;
  try { url = new URL(connectionString); } catch { throw new Error('DATABASE_URL must be a valid PostgreSQL URL.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL must use postgres:// or postgresql://.');
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname);
  if (!local || process.env.NODE_ENV === 'production') url.searchParams.set('sslmode', 'verify-full');
  const pool = new Pool({ connectionString: url.href, max: 5, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
  pool.on('error', () => console.error('An idle database connection closed.'));
  if (process.env.VERCEL) attachDatabasePool(pool);
  return { pool, orm: drizzle(pool), close: () => pool.end() };
}
module.exports = { connectDatabase };
