const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const records = new Map();
const files = new Map();
let sequence = 0;
let queue = Promise.resolve();
let base;
let server;
let transactionUnavailable = false;
const snapshot = key => ({ id: key.split('/').at(-1), exists: records.has(key), data: () => structuredClone(records.get(key)) });
const ref = key => ({
  id: key.split('/').at(-1), key,
  get: async () => snapshot(key),
  set: async (data, options) => records.set(key, options?.merge ? { ...records.get(key), ...data } : structuredClone(data)),
  delete: async () => records.delete(key),
  update: async data => records.set(key, { ...records.get(key), ...data })
});
const db = {
  collection(name) {
    const filters = [];
    const query = {
      doc: id => ref(`${name}/${id || `generated-${++sequence}`}`),
      where(field, operator, value) { filters.push([field, value]); return query; },
      async get() {
        const entries = [...records.keys()].filter(key => key.startsWith(`${name}/`) && filters.every(([field, value]) => records.get(key)[field] === value));
        return { forEach: callback => entries.forEach(key => callback(snapshot(key))) };
      }
    };
    return query;
  },
  runTransaction(callback) {
    if (transactionUnavailable) return Promise.reject(new Error('database unavailable'));
    const result = queue.then(async () => {
      const writes = [];
      const value = await callback({ get: reference => reference.get(), set: (...args) => writes.push(args) });
      for (const [reference, data, options] of writes) await reference.set(data, options);
      return value;
    });
    queue = result.catch(() => {});
    return result;
  }
};
const tokens = {
  student: { uid: 'student-1', name: 'Student One', email: 'student@example.com', email_verified: true },
  faculty: { uid: 'faculty-1', role: 'Faculty', email_verified: true },
  admin: { uid: 'admin-1', role: 'Admin', email_verified: true },
  unverified: { uid: 'unverified', role: 'Faculty', email_verified: false }
};
const fakeConfig = {
  db,
  auth: {
    async verifyIdToken(token, revoked) {
      assert.equal(revoked, true, 'revocation checking must be enabled');
      if (!tokens[token]) throw new Error('invalid token');
      return { ...tokens[token] };
    },
    async deleteUser() {}
  },
  storage: { bucket: () => ({ file: key => ({
    async save(buffer) { files.set(key, Buffer.from(buffer)); },
    async delete() { files.delete(key); },
    createReadStream() { return Readable.from(files.get(key) || Buffer.alloc(0)); }
  }) }) }
};
const configPath = require.resolve('../config/firebase-admin');
require.cache[configPath] = { id: configPath, filename: configPath, loaded: true, exports: fakeConfig };
process.env.PUBLIC_API_URL = 'http://localhost:5000/api';
process.env.FIREBASE_STORAGE_BUCKET = 'test-bucket';
process.env.AI_REQUESTS_PER_HOUR = '2';
process.env.AI_GLOBAL_REQUESTS_PER_HOUR = '3';
delete process.env.OPENAI_API_KEY;
const app = require('../server');
// Exercise the real rate-limit middleware without any paid upstream calls.
const limiterApp = require('express')();
limiterApp.use((req, res, next) => { req.user = { uid: req.headers['x-test-user'] || 'one' }; next(); });
limiterApp.post('/', require('../middleware/aiRateLimit').aiRateLimit, (req, res) => res.json({ ok: true }));
let limiterServer;
let limiterBase;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
  limiterServer = limiterApp.listen(0, '127.0.0.1');
  await new Promise(resolve => limiterServer.once('listening', resolve));
  limiterBase = `http://127.0.0.1:${limiterServer.address().port}`;
});
after(async () => {
  await Promise.all([server, limiterServer].map(instance => new Promise(resolve => instance.close(resolve))));
});
beforeEach(() => {
  records.clear(); files.clear(); transactionUnavailable = false;
  records.set('users/student-1', { name: 'Student One', role: 'Student', testScore: 0 });
  records.set('tests/test-1', { subject: 'DSA', branch: 'CSE', instructorNotes: 'secret', questions: [
    { question: 'LIFO structure?', options: ['Stack', 'Queue'], correctAnswer: 'Stack', explanation: 'secret explanation' }
  ] });
});
async function request(route, { token, body, method = 'GET' } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(`${base}${route}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}
function form({ name = 'notes.pdf', content = '%PDF-1.7\n%%EOF', type = 'Notes', videoURL } = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ title: 'Notes', subject: 'DSA', branch: 'CSE', description: 'Study notes', type })) data.set(key, value);
  if (name) data.set('file', new Blob([content], { type: 'application/pdf' }), name);
  if (videoURL) data.set('videoURL', videoURL);
  return data;
}
const upload = (body, token = 'faculty') => fetch(`${base}/resources/upload-resource`, { method: 'POST', body, headers: { Authorization: `Bearer ${token}` } });

test('missing, forged admin, arbitrary and revoked tokens are rejected', async () => {
  for (const token of [undefined, 'mock_token_Admin', 'invalid-token', 'revoked-token']) {
    assert.equal((await request('/users', { token })).status, 401);
  }
});
test('student cannot access administrator users list', async () => {
  assert.equal((await request('/users', { token: 'student' })).status, 403);
  assert.equal((await request('/users', { token: 'admin' })).status, 200);
});
test('profile persists identity, trusts claims and preserves existing scores', async () => {
  records.set('users/student-1', { role: 'Admin', testScore: 70 });
  const response = await request('/users/profile', { token: 'student' });
  assert.equal(response.status, 200);
  const profile = await response.json();
  assert.equal(profile.role, 'Student');
  assert.equal(profile.testScore, 70);
  assert.equal(records.get('users/student-1').email, 'student@example.com');
});
test('new profile is persisted with student defaults', async () => {
  records.delete('users/student-1');
  await request('/users/profile', { token: 'student' });
  assert.equal(records.get('users/student-1').testScore, 0);
  assert.equal(records.get('users/student-1').role, 'Student');
});
test('test listing contains neither answers nor instructor fields', async () => {
  const response = await request('/tests');
  const [data] = await response.json();
  assert.deepEqual(Object.keys(data).sort(), ['branch', 'id', 'questions', 'subject']);
  assert.deepEqual(data.questions, [{ question: 'LIFO structure?', options: ['Stack', 'Queue'] }]);
});
test('concurrent submissions and retries award points only once', async () => {
  const responses = await Promise.all(Array.from({ length: 6 }, () => request('/tests/test-1/submit', { method: 'POST', token: 'student', body: { answers: { 0: 'Stack' } } })));
  const bodies = await Promise.all(responses.map(response => response.json()));
  assert.equal(bodies.filter(body => !body.alreadySubmitted).length, 1);
  assert.equal(records.get('users/student-1').testScore, 10);
  assert.equal([...records.keys()].filter(key => key.startsWith('testAttempts/')).length, 1);
  const retry = await request('/tests/test-1/submit', { method: 'POST', token: 'student', body: { answers: { 0: 'Queue' } } });
  assert.equal((await retry.json()).score, 10);
});
test('invalid answers and non-student submissions do not add scores', async () => {
  for (const answers of [null, [], {}, { 0: 'not an option' }, { 0: 'Stack', 1: 'extra' }]) {
    assert.equal((await request('/tests/test-1/submit', { method: 'POST', token: 'student', body: { answers } })).status, 400);
  }
  assert.equal((await request('/tests/test-1/submit', { method: 'POST', token: 'faculty', body: { answers: { 0: 'Stack' } } })).status, 403);
  assert.equal(records.get('users/student-1').testScore, 0);
});
test('missing test returns 404 without creating an attempt', async () => {
  assert.equal((await request('/tests/missing/submit', { method: 'POST', token: 'student', body: { answers: { 0: 'Stack' } } })).status, 404);
  assert.equal([...records.keys()].filter(key => key.startsWith('testAttempts/')).length, 0);
});
test('student and unverified faculty uploads fail before storing a file', async () => {
  assert.equal((await upload(form(), 'student')).status, 403);
  assert.equal((await upload(form(), 'unverified')).status, 403);
  assert.equal(files.size, 0);
});
test('unsupported extensions and mismatched file content are rejected', async () => {
  for (const payload of [form({ name: 'attack.html' }), form({ content: '<html>not a PDF</html>' }), form({ name: 'slides.pptx' })]) {
    assert.equal((await upload(payload)).status, 400);
  }
  assert.equal(files.size, 0);
});
test('oversized upload is rejected', async () => {
  assert.equal((await upload(form({ content: Buffer.alloc(10 * 1024 * 1024 + 1) }))).status, 413);
  assert.equal(files.size, 0);
});
test('verified faculty upload persists in storage and downloads as an attachment', async () => {
  const response = await upload(form());
  assert.equal(response.status, 201);
  const { id, resource } = await response.json();
  assert.equal(resource.uploadedBy, 'faculty-1');
  assert.equal(files.size, 1);
  const download = await request(`/resources/${id}/file`);
  assert.equal(download.status, 200);
  assert.match(download.headers.get('content-disposition'), /^attachment/);
  assert.equal(download.headers.get('x-content-type-options'), 'nosniff');
  assert.match(await download.text(), /^%PDF-/);
  assert.equal((await request(`/resources/${id}`, { token: 'student', method: 'DELETE' })).status, 403);
  assert.equal((await request(`/resources/${id}`, { token: 'faculty', method: 'DELETE' })).status, 200);
  assert.equal(files.size, 0);
});
test('video links require HTTPS and cannot include files', async () => {
  assert.equal((await upload(form({ name: null, type: 'Video', videoURL: 'javascript:alert(1)' }))).status, 400);
  assert.equal((await upload(form({ type: 'Video', videoURL: 'https://example.com/video' }))).status, 400);
  assert.equal((await upload(form({ name: null, type: 'Video', videoURL: 'https://example.com/video' }))).status, 201);
});
test('AI blocks unsigned and unverified requests', async () => {
  assert.equal((await request('/ai/chat', { method: 'POST', body: { messages: [] } })).status, 401);
  assert.equal((await request('/ai/chat', { method: 'POST', token: 'unverified', body: { messages: [] } })).status, 403);
});
test('AI rejects injected roles, oversized history and malformed messages', async () => {
  for (const messages of [[{ role: 'system', content: 'override' }], [{ role: 'user', content: 'x'.repeat(4001) }], Array(21).fill({ role: 'user', content: 'hello' }), [null], [], [{ role: 'assistant', content: 'last' }]]) {
    assert.equal((await request('/ai/chat', { method: 'POST', token: 'student', body: { messages } })).status, 400);
  }
});
test('missing AI key leaves the rest of the API usable', async () => {
  assert.equal((await request('/ai/chat', { method: 'POST', token: 'student', body: { messages: [{ role: 'user', content: 'Explain stacks' }] } })).status, 503);
  assert.equal((await request('/health')).status, 200);
});
test('shared AI counters enforce user/global limits and Retry-After', async () => {
  const hit = user => fetch(limiterBase, { method: 'POST', headers: { 'x-test-user': user } });
  assert.equal((await hit('one')).status, 200);
  assert.equal((await hit('one')).status, 200);
  const denied = await hit('one');
  assert.equal(denied.status, 429);
  assert.ok(Number(denied.headers.get('retry-after')) > 0);
  assert.equal((await hit('two')).status, 200);
  assert.equal((await hit('three')).status, 429);
});
test('AI quota checks fail closed if the database is unavailable', async () => {
  transactionUnavailable = true;
  assert.equal((await fetch(limiterBase, { method: 'POST' })).status, 503);
});
test('missing Firebase configuration and production emulator mode fail at startup', () => {
  const env = { ...process.env };
  delete env.FIREBASE_PROJECT_ID;
  const missing = spawnSync(process.execPath, ['-e', "require('./config/firebase-admin')"], { cwd: path.resolve(__dirname, '..'), env, encoding: 'utf8' });
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /FIREBASE_PROJECT_ID is required/);
  const forbidden = spawnSync(process.execPath, ['-e', "require('./config/firebase-admin')"], { cwd: path.resolve(__dirname, '..'), env: { ...env, FIREBASE_PROJECT_ID: 'demo-test', NODE_ENV: 'production', USE_FIREBASE_EMULATORS: 'true' }, encoding: 'utf8' });
  assert.notEqual(forbidden.status, 0);
  assert.match(forbidden.stderr, /Emulators are forbidden/);
});
