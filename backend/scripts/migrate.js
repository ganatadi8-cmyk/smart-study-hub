require('dotenv').config();
const path = require('node:path');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { connectDatabase } = require('../db/connection');

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED;
  if (!url) throw new Error('DATABASE_URL_UNPOOLED is required for migrations. Use the direct Neon URL.');
  if (new URL(url).hostname.includes('-pooler')) throw new Error('Use a direct Neon URL, not a pooled URL, for migrations.');
  const connection = connectDatabase(url);
  try {
    await migrate(connection.orm, { migrationsFolder: path.join(__dirname, '../drizzle') });
    console.log('Neon schema migrations completed.');
  } finally { await connection.close(); }
}
main().catch(() => {
  console.error('Schema migration failed. Check DATABASE_URL_UNPOOLED, database permissions, and network access. Credentials were not printed.');
  process.exitCode = 1;
});
