const { db } = require('../config/database');
const { createHash } = require('node:crypto');
const getTests = async (req, res) => {
  try {
    let query = db.collection('tests');
    if (req.query.branch) query = query.where('branch', '==', req.query.branch);
    const snapshot = await query.get();
    const tests = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (req.query.subject && data.subject !== req.query.subject) return;
      // Explicit allowlist: never send answer keys or instructor-only fields.
      tests.push({ id: doc.id, subject: data.subject, branch: data.branch,
        questions: (data.questions || []).map(q => ({ question: q.question, options: q.options })) });
    });
    res.json(tests);
  } catch {
    res.status(503).json({ error: 'Failed to load tests.' });
  }
};
const submitTest = async (req, res) => {
  const { answers } = req.body || {};
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return res.status(400).json({ error: 'Answers must be an object indexed by question number.' });
  }
  const testId = req.params.testId;
  if (!testId || testId.length > 200 || testId.includes('/')) return res.status(400).json({ error: 'Invalid test ID.' });
  const attemptId = createHash('sha256').update(JSON.stringify([req.user.uid, testId])).digest('hex');
  try {
    const result = await db.runTransaction(async tx => {
      const attemptRef = db.collection('testAttempts').doc(attemptId);
      const previous = await tx.get(attemptRef);
      if (previous.exists) return { ...previous.data().result, alreadySubmitted: true };
      const testSnap = await tx.get(db.collection('tests').doc(testId));
      if (!testSnap.exists) throw Object.assign(new Error('Test not found.'), { status: 404 });
      const questions = testSnap.data().questions;
      if (!Array.isArray(questions) || !questions.length) throw Object.assign(new Error('Test is not ready.'), { status: 409 });
      if (Object.keys(answers).length !== questions.length || questions.some((q, i) => typeof answers[i] !== 'string' || !q.options.includes(answers[i]))) {
        throw Object.assign(new Error('Select one valid answer for every question.'), { status: 400 });
      }
      const userRef = db.collection('users').doc(req.user.uid);
      const userSnap = await tx.get(userRef);
      const results = questions.map((q, i) => ({ question: q.question, selected: answers[i], correct: q.correctAnswer, isCorrect: answers[i] === q.correctAnswer }));
      const score = results.filter(r => r.isCorrect).length * 10;
      const result = { score, totalPossible: questions.length * 10, results, alreadySubmitted: false };
      tx.set(attemptRef, { userId: req.user.uid, testId, submittedAt: new Date().toISOString(), result });
      tx.set(userRef, { testScore: (userSnap.exists ? userSnap.data().testScore || 0 : 0) + score }, { merge: true });
      return result;
    });
    res.json(result);
  } catch (error) {
    res.status(error.status || 503).json({ error: error.status ? error.message : 'Unable to save your submission. Please retry.' });
  }
};
module.exports = { getTests, submitTest };
