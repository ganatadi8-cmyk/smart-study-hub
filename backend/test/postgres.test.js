const { describe, test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { sql } = require('drizzle-orm');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { connectDatabase } = require('../db/connection');
const { createStore } = require('../db/store');
const { importRecords } = require('../db/import-firestore');
const schema = require('../db/schema');

// Never run cleanup against a hosted database. CI supplies a disposable localhost Postgres.
const testUrl = process.env.TEST_DATABASE_URL;
if (testUrl && !['localhost', '127.0.0.1', '::1', '[::1]'].includes(new URL(testUrl).hostname)) {
  throw new Error('TEST_DATABASE_URL must point to a disposable local PostgreSQL server.');
}
test('missing or malformed database URLs fail without exposing credentials', () => {
  for (const value of ['', 'invalid-secret', 'https://user:secret@example.com']) {
    assert.throws(() => connectDatabase(value), error => !error.message.includes('invalid-secret') && !error.message.includes('user:secret'));
  }
});
test('migration command requires a direct URL', () => {
  const env = { ...process.env, DATABASE_URL_UNPOOLED: 'postgres://hidden:secret@ep-test-pooler.neon.tech/neondb' };
  const result = spawnSync(process.execPath, ['scripts/migrate.js'], { cwd: path.join(__dirname, '..'), env, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stdout + result.stderr, /hidden:secret/);
});

describe('real PostgreSQL persistence and HTTP flows', { skip: !testUrl && 'Set TEST_DATABASE_URL to run SQL integration tests.' }, () => {
  let connection, adminConnection, db, server, limiterServer, base, limitBase;
  const namespace = `study_test_${randomUUID().replaceAll('-', '')}`;
  before(async () => {
    adminConnection = connectDatabase(testUrl);
    await adminConnection.orm.execute(sql`CREATE SCHEMA ${sql.identifier(namespace)}`);
    const url = new URL(testUrl);
    url.searchParams.set('options', `-c search_path=${namespace}`);
    connection = connectDatabase(url.href);
    await migrate(connection.orm, { migrationsFolder: path.join(__dirname, '../drizzle'), migrationsSchema: namespace });
    // A second migration run must not destroy data or recreate tables.
    await migrate(connection.orm, { migrationsFolder: path.join(__dirname, '../drizzle'), migrationsSchema: namespace });
    db = createStore(connection.orm);
    const databasePath = require.resolve('../config/database');
    require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: { db } };
    const firebasePath = require.resolve('../config/firebase-admin');
    require.cache[firebasePath] = { id: firebasePath, filename: firebasePath, loaded: true, exports: {
      auth: { async verifyIdToken(token) {
        if (!['student', 'student-two', 'faculty'].includes(token)) throw new Error('Invalid token.');
        return { uid: token, role: token === 'faculty' ? 'Faculty' : 'Student', name: token, email: `${token}@example.com`, email_verified: true };
      } }, storage: {},
    } };
    process.env.PUBLIC_API_URL = 'http://localhost:5000/api';
    process.env.AI_REQUESTS_PER_HOUR = '2';
    process.env.AI_GLOBAL_REQUESTS_PER_HOUR = '3';
    server = require('../server').listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}/api`;
    const limiter = require('express')();
    limiter.use((req, res, next) => { req.user = { uid: req.headers['x-test-user'] || 'student' }; next(); });
    limiter.post('/', require('../middleware/aiRateLimit').aiRateLimit, (req, res) => res.json({ ok: true }));
    limiterServer = limiter.listen(0, '127.0.0.1');
    await new Promise(resolve => limiterServer.once('listening', resolve));
    limitBase = `http://127.0.0.1:${limiterServer.address().port}`;
  });
  after(async () => {
    for (const instance of [server, limiterServer]) if (instance) await new Promise(resolve => instance.close(resolve));
    if (connection) await connection.close();
    if (adminConnection) {
      await adminConnection.orm.execute(sql`DROP SCHEMA ${sql.identifier(namespace)} CASCADE`);
      await adminConnection.close();
    }
  });
  beforeEach(async () => {
    for (const table of Object.values(schema)) await connection.orm.delete(table);
    await db.collection('users').doc('student').set({ name: 'Student', role: 'Student', testScore: 0 });
    await db.collection('tests').doc('test-1').set({ branch: 'CSE', subject: 'DSA', instructorNotes: 'private', questions: [
      { question: 'LIFO?', options: ['Stack', 'Queue'], correctAnswer: 'Stack' },
    ] });
  });
  const request = (route, { method = 'GET', token = 'student', body } = {}) => fetch(`${base}${route}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const score = async uid => (await db.collection('users').doc(uid).get()).data().testScore;
  test('ready checks migrated tables and a second connection reads persisted records', async () => {
    const response = await request('/ready');
    assert.equal(response.status, 200);
    assert.equal((await response.json()).database, 'postgresql');
    const url = new URL(testUrl); url.searchParams.set('options', `-c search_path=${namespace}`);
    const second = connectDatabase(url.href);
    try {
      assert.equal((await createStore(second.orm).collection('users').doc('student').get()).data().name, 'Student');
    } finally { await second.close(); }
  });
  test('filters are parameterized and rows preserve their original document IDs', async () => {
    for (const [id, branch, type] of [['a', 'CSE', 'Notes'], ['b', 'ECE', 'Notes'], ['c', 'CSE', 'PPT']]) {
      await db.collection('resources').doc(id).set({ branch, type });
    }
    const snapshot = await db.collection('resources').where('branch', '==', 'CSE').where('type', '==', 'Notes').get();
    assert.deepEqual(snapshot.docs.map(doc => doc.id), ['a']);
    assert.equal((await db.collection('resources').where('branch', '==', "CSE' OR 1=1 --").get()).size, 0);
    assert.throws(() => db.collection('users; DROP TABLE study_users'));
  });
  test('profile synchronization preserves scores and trusts verified roles', async () => {
    await db.collection('users').doc('student').set({ role: 'Admin', testScore: 70 });
    const response = await request('/users/profile');
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.role, 'Student'); assert.equal(data.testScore, 70);
    assert.equal((await db.collection('users').doc('student').get()).data().email, 'student@example.com');
  });
  test('test listings hide correct answers and instructor-only fields', async () => {
    const [data] = await (await request('/tests')).json();
    assert.deepEqual(Object.keys(data).sort(), ['branch', 'id', 'questions', 'subject']);
    assert.deepEqual(data.questions, [{ question: 'LIFO?', options: ['Stack', 'Queue'] }]);
  });
  test('concurrent first submissions and retries award points once', async () => {
    const responses = await Promise.all(Array.from({ length: 8 }, () => request('/tests/test-1/submit', { method: 'POST', body: { answers: { 0: 'Stack' } } })));
    assert.ok(responses.every(response => response.status === 200));
    const bodies = await Promise.all(responses.map(response => response.json()));
    assert.equal(bodies.filter(result => !result.alreadySubmitted).length, 1);
    assert.equal(await score('student'), 10);
    assert.equal((await db.collection('testAttempts').get()).size, 1);
    const retry = await (await request('/tests/test-1/submit', { method: 'POST', body: { answers: { 0: 'Queue' } } })).json();
    assert.equal(retry.score, 10); assert.equal(retry.alreadySubmitted, true);
  });
  test('scores for different tests and users stay independent under concurrency', async () => {
    await db.collection('tests').doc('test-2').set((await db.collection('tests').doc('test-1').get()).data());
    const pairs = [['student', 'test-1'], ['student', 'test-2'], ['student-two', 'test-1']];
    const responses = await Promise.all(pairs.map(([token, id]) => request(`/tests/${id}/submit`, { method: 'POST', token, body: { answers: { 0: 'Stack' } } })));
    assert.ok(responses.every(response => response.status === 200));
    assert.equal(await score('student'), 20); assert.equal(await score('student-two'), 10);
  });
  test('failed transactions roll back all writes', async () => {
    await assert.rejects(db.runTransaction(async tx => {
      tx.set(db.collection('users').doc('student'), { testScore: 999 });
      tx.update(db.collection('users').doc('missing'), { name: 'invalid' });
    }));
    assert.equal(await score('student'), 0);
  });
  test('concurrent ratings do not lose updates and reject string ratings', async () => {
    await db.collection('resources').doc('r1').set({ title: 'Study notes', rating: 0, ratingCount: 0 });
    const responses = await Promise.all([1, 2, 3, 4, 5].map(rating => request('/resources/r1/rate', { method: 'POST', body: { rating } })));
    assert.ok(responses.every(response => response.status === 200));
    const resource = (await db.collection('resources').doc('r1').get()).data();
    assert.equal(resource.ratingCount, 5); assert.equal(resource.rating, 3);
    assert.equal((await request('/resources/r1/rate', { method: 'POST', body: { rating: '5' } })).status, 400);
  });
  test('discussion threads and concurrent replies persist without lost messages', async () => {
    const posted = await request('/discussions', { method: 'POST', body: { question: 'How do stacks work?' } });
    assert.equal(posted.status, 201);
    const { discussion } = await posted.json();
    const responses = await Promise.all(['one', 'two', 'three'].map(message => request(`/discussions/${discussion.id}/reply`, { method: 'POST', body: { message } })));
    assert.ok(responses.every(response => response.status === 201));
    const [saved] = await (await request('/discussions')).json();
    assert.deepEqual(saved.replies.map(reply => reply.message).sort(), ['one', 'three', 'two']);
  });
  test('shared AI limits hold across concurrent requests and separate users', async () => {
    const hit = uid => fetch(limitBase, { method: 'POST', headers: { 'x-test-user': uid } });
    const responses = await Promise.all(Array.from({ length: 6 }, () => hit('one')));
    assert.equal(responses.filter(response => response.status === 200).length, 2);
    assert.ok(responses.filter(response => response.status !== 200).every(response => response.status === 429));
    assert.equal((await hit('two')).status, 200);
    assert.equal((await hit('three')).status, 429);
  });
  test('Firestore import is resumable, preserves IDs, and refuses conflicting data', async () => {
    const records = [{ id: 'legacy-thread', data: () => ({ question: 'Legacy', timestamp: new Date('2025-01-01T00:00:00Z'), replies: [] }) }];
    assert.equal((await importRecords(db, 'discussions', records)).inserted, 0);
    assert.equal((await importRecords(db, 'discussions', records, { apply: true })).inserted, 1);
    assert.equal((await importRecords(db, 'discussions', records, { apply: true })).skipped, 1);
    assert.equal((await db.collection('discussions').doc('legacy-thread').get()).data().timestamp, '2025-01-01T00:00:00.000Z');
    await assert.rejects(importRecords(db, 'discussions', [{ id: 'legacy-thread', data: () => ({ question: 'different' }) }], { apply: true }), /different record/);
  });
});
