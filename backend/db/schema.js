const { pgTable, text, jsonb, timestamp, index, uniqueIndex, check } = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');

// Keep existing IDs and document payloads during the Firestore -> PostgreSQL move.
// Separate tables make the records inspectable in Neon without changing API responses.
const columns = () => ({
  id: text('id').primaryKey(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
const objectCheck = (name, table) => check(`${name}_object`, sql`jsonb_typeof(${table.data}) = 'object'`);
const users = pgTable('study_users', columns(), table => [
  objectCheck('study_users', table),
  index('study_users_role_idx').on(sql`(${table.data}->>'role')`),
]);
const resources = pgTable('study_resources', columns(), table => [
  objectCheck('study_resources', table),
  index('study_resources_filter_idx').on(sql`(${table.data}->>'branch')`, sql`(${table.data}->>'type')`),
]);
const tests = pgTable('study_tests', columns(), table => [
  objectCheck('study_tests', table),
  index('study_tests_branch_idx').on(sql`(${table.data}->>'branch')`),
]);
const testAttempts = pgTable('study_test_attempts', columns(), table => [
  objectCheck('study_test_attempts', table),
  uniqueIndex('study_test_attempts_user_test_idx').on(sql`(${table.data}->>'userId')`, sql`(${table.data}->>'testId')`),
]);
const discussions = pgTable('study_discussions', columns(), table => [objectCheck('study_discussions', table)]);
const rateLimits = pgTable('study_rate_limits', columns(), table => [objectCheck('study_rate_limits', table)]);
module.exports = { users, resources, tests, testAttempts, discussions, rateLimits };
