import { apiUrl } from '../services/api';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Leaderboard = () => {
  const { currentUser } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(apiUrl('/users/leaderboard'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setLeaders(data);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchLeaderboard();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 min-h-[calc(100vh-80px)]">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4 inline-flex items-center gap-4">
          🏆 Global Leaderboard
        </h1>
        <p className="text-gray-400 text-lg">Ranking the top contributors and highest test scorers across the entire platform.</p>
      </motion.div>

      <div className="glass rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(234,179,8,0.1)] relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-6 text-yellow-500 font-bold uppercase tracking-wider">Rank</th>
                <th className="p-6 text-white font-bold uppercase tracking-wider">Student Name</th>
                <th className="p-6 text-gray-400 font-bold uppercase tracking-wider text-center">Contributions</th>
                <th className="p-6 text-gray-400 font-bold uppercase tracking-wider text-center">Test Score</th>
                <th className="p-6 text-blue-400 font-bold uppercase tracking-wider text-right">Reputation</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((student, index) => (
                <motion.tr 
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${currentUser?.uid === student.id ? 'bg-blue-500/10 border-blue-500/30' : ''}`}
                >
                  <td className="p-6 font-bold text-xl">
                    {index === 0 ? <span className="text-yellow-400 text-3xl">🥇</span> : 
                     index === 1 ? <span className="text-gray-300 text-3xl">🥈</span> : 
                     index === 2 ? <span className="text-amber-600 text-3xl">🥉</span> : 
                     <span className="text-gray-500 ml-2">#{index + 1}</span>}
                  </td>
                  <td className="p-6 font-semibold text-lg text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    {student.name}
                    {currentUser?.uid === student.id && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded ml-2 border border-blue-500/30">You</span>}
                  </td>
                  <td className="p-6 text-center text-gray-300 font-medium">
                    {student.resourcesUploaded} <span className="text-xs text-gray-500">docs</span>
                  </td>
                  <td className="p-6 text-center text-gray-300 font-medium">
                    {student.testScore} <span className="text-xs text-gray-500">pts</span>
                  </td>
                  <td className="p-6 text-right font-bold text-2xl text-blue-400">
                    {student.totalScore}
                  </td>
                </motion.tr>
              ))}
              
              {leaders.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-500 font-medium">
                    No active students found. Be the first to take a test or upload a resource!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
