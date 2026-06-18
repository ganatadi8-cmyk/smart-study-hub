const { db } = require('../config/firebase-admin');

// Get all mock tests (optionally filter by branch/subject)
const getTests = async (req, res) => {
  try {
    const { branch, subject } = req.query;
    let query = db.collection('tests');

    if (branch) query = query.where('branch', '==', branch);
    
    // Simple filter - in a real DB, subject would be an exact match or query filter
    const snapshot = await query.get();
    let tests = [];
    
    snapshot.forEach(doc => {
      tests.push({ id: doc.id, ...doc.data() });
    });

    if (subject) {
      tests = tests.filter(t => t.subject === subject);
    }

    res.status(200).json(tests);
  } catch (error) {
    console.error("Error fetching tests:", error);
    res.status(500).json({ error: "Failed to load tests" });
  }
};

// Submit a mock test and calculate score
const submitTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { answers } = req.body; // { questionIndex: "selected answer string" }
    
    const docRef = db.collection('tests').doc(testId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Test not found" });
    }

    const test = docSnap.data();
    let score = 0;
    const total = test.questions.length;
    const results = [];

    test.questions.forEach((q, index) => {
      const studentAnswer = answers[index];
      const isCorrect = studentAnswer === q.correctAnswer;
      if (isCorrect) score += 10; // 10 points per correct answer
      
      results.push({
        question: q.question,
        selected: studentAnswer,
        correct: q.correctAnswer,
        isCorrect
      });
    });

    // Award points to the student in the database
    if (req.user && req.user.uid) {
      const userRef = db.collection('users').doc(req.user.uid);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        const newScore = (userData.testScore || 0) + score;
        await userRef.update({ testScore: newScore });
      }
    }

    res.status(200).json({
      score,
      totalPossible: total * 10,
      results
    });
  } catch (error) {
    console.error("Error calculating test score:", error);
    res.status(500).json({ error: "Failed to evaluate test submission" });
  }
};

module.exports = {
  getTests,
  submitTest
};
