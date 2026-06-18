import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const MockTests = () => {
  const { currentUser } = useAuth();
  const [tests, setTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch available tests
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/tests');
        if (response.ok) {
          const data = await response.json();
          setTests(data);
        }
      } catch (error) {
        console.error("Error fetching tests", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const handleStartTest = (test) => {
    setActiveTest(test);
    setAnswers({});
    setResult(null);
  };

  const handleSelectOption = (qIndex, option) => {
    setAnswers(prev => ({
      ...prev,
      [qIndex]: option
    }));
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      alert("Please log in to submit tests and save your score.");
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:5000/api/tests/${activeTest.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error("Error submitting test", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 min-h-[calc(100vh-80px)]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <span className="text-blue-400">📝</span> Mock Tests
        </h1>
        <p className="text-gray-400">Evaluate your knowledge and climb the global leaderboards!</p>
      </motion.div>

      {!activeTest ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map(test => (
            <motion.div 
              key={test.id}
              whileHover={{ scale: 1.02 }}
              className="glass p-6 rounded-2xl border border-white/10 relative overflow-hidden group cursor-pointer"
              onClick={() => handleStartTest(test)}
            >
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <h2 className="text-2xl font-bold text-white mb-2">{test.subject}</h2>
              <div className="flex gap-3 text-sm font-medium text-gray-400 mb-6">
                <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">{test.branch}</span>
                <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20">{test.questions?.length} Questions</span>
              </div>
              <button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl border border-white/10 transition-colors">
                Start Test
              </button>
            </motion.div>
          ))}
          {tests.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center text-gray-500 py-10 glass rounded-2xl">
              No tests currently available.
            </div>
          )}
        </div>
      ) : result ? (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-8 rounded-2xl border border-white/10 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-white mb-2">Test Completed!</h2>
          <p className="text-xl text-gray-400 mb-8">You scored <span className="text-green-400 font-bold">{result.score}</span> out of {result.totalPossible}</p>
          
          <div className="space-y-4 mb-8 text-left">
            {result.results.map((r, i) => (
              <div key={i} className={`p-4 rounded-xl border ${r.isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <p className="text-white font-medium mb-2">{i + 1}. {r.question}</p>
                <div className="text-sm">
                  <p className="text-gray-400">Your Answer: <span className={r.isCorrect ? 'text-green-400' : 'text-red-400'}>{r.selected || 'Unanswered'}</span></p>
                  {!r.isCorrect && <p className="text-green-400 mt-1">Correct Answer: {r.correct}</p>}
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => { setActiveTest(null); setResult(null); }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg">
            Return to Tests
          </button>
        </motion.div>
      ) : (
        <div className="glass p-8 rounded-2xl border border-white/10">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
            <h2 className="text-2xl font-bold text-white">{activeTest.subject} Test</h2>
            <button onClick={() => setActiveTest(null)} className="text-gray-400 hover:text-white">Cancel</button>
          </div>

          <div className="space-y-8">
            {activeTest.questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white/5 p-6 rounded-xl border border-white/5">
                <p className="text-lg font-medium text-white mb-4"><span className="text-blue-400 mr-2">{qIndex + 1}.</span>{q.question}</p>
                <div className="space-y-3">
                  {q.options.map((option, oIndex) => (
                    <label key={oIndex} className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors border ${answers[qIndex] === option ? 'bg-blue-500/20 border-blue-500/50 text-white' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}>
                      <input 
                        type="radio" 
                        name={`question-${qIndex}`} 
                        value={option}
                        checked={answers[qIndex] === option}
                        onChange={() => handleSelectOption(qIndex, option)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-right">
            <button 
              onClick={handleSubmit} 
              disabled={Object.keys(answers).length !== activeTest.questions.length}
              className={`font-bold py-3 px-8 rounded-xl transition-all shadow-lg ${Object.keys(answers).length === activeTest.questions.length ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
            >
              Submit Responses
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockTests;
