require('dotenv').config();
const { db } = require('../config/firebase-admin');
// Create-only: never overwrite questions for an existing scored test.
db.collection('tests').doc('data-structures-v1').create({
  subject: 'Data Structures', branch: 'CSE',
  questions: [
    { question: 'Which data structure uses LIFO?', options: ['Queue', 'Stack', 'Graph'], correctAnswer: 'Stack' },
    { question: 'What is the search complexity of a balanced binary search tree?', options: ['O(n)', 'O(log n)', 'O(1)'], correctAnswer: 'O(log n)' }
  ]
}).then(() => console.log('Created data-structures-v1.')).catch(error => {
  console.error(error.code === 6 ? 'Test already exists. No changes made.' : error.message);
  if (error.code !== 6) process.exitCode = 1;
});
