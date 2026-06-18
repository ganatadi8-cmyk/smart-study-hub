import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Discussion = () => {
  const { currentUser } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyText, setReplyText] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchDiscussions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/discussions');
      if (response.ok) {
        const data = await response.json();
        setDiscussions(data);
      }
    } catch (error) {
      console.error("Error fetching discussions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const handlePostQuestion = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please login to post questions.");
      return;
    }
    if (!newQuestion.trim()) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('http://localhost:5000/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: newQuestion })
      });

      if (response.ok) {
        setNewQuestion('');
        fetchDiscussions(); // Refresh threads
      }
    } catch (error) {
      console.error("Error posting question:", error);
    }
  };

  const handlePostReply = async (discussionId) => {
    if (!currentUser) {
      alert("Please login to reply.");
      return;
    }
    const message = replyText[discussionId];
    if (!message?.trim()) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:5000/api/discussions/${discussionId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        setReplyText(prev => ({ ...prev, [discussionId]: '' }));
        fetchDiscussions(); // Refresh nested replies
      }
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 min-h-[calc(100vh-80px)]">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
          Community Forum
        </h1>
        <p className="text-gray-400">Ask questions, share knowledge, and discuss topics with peers and faculty.</p>
      </motion.div>

      {/* Post new question */}
      <div className="glass p-6 rounded-2xl mb-10 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <form onSubmit={handlePostQuestion} className="relative z-10">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all custom-scrollbar min-h-[100px]"
            placeholder="What's your question?"
          ></textarea>
          <div className="flex justify-end mt-4">
            <button 
              type="submit" 
              disabled={!newQuestion.trim()}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Post Question
            </button>
          </div>
        </form>
      </div>

      {/* Discussion Threads */}
      <div className="space-y-6">
        {discussions.map(discussion => (
          <motion.div 
            key={discussion.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Main Question */}
            <div className="p-6 border-b border-white/5 bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {discussion.user.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{discussion.user}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        discussion.role === 'Admin' ? 'bg-red-500/20 text-red-400' :
                        discussion.role === 'Faculty' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {discussion.role}
                      </span>
                      <span className="text-gray-500">• {new Date(discussion.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-line ml-13 pl-13">
                {discussion.question}
              </p>
            </div>

            {/* Replies Section */}
            <div className="p-6 bg-black/20">
              <div className="space-y-4 mb-6 ml-6 pl-6 border-l-2 border-white/10">
                {discussion.replies?.map((reply, index) => (
                  <div key={reply.id || index} className="bg-white/5 p-4 rounded-xl border border-white/5 relative group">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-medium text-sm">{reply.user}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        reply.role === 'Admin' ? 'bg-red-500/20 text-red-400' :
                        reply.role === 'Faculty' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {reply.role}
                      </span>
                      <span className="text-gray-500 text-xs text-nowrap">• {new Date(reply.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-300 text-sm whitespace-pre-line">{reply.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="flex gap-3 ml-6">
                <input 
                  type="text"
                  value={replyText[discussion.id] || ''}
                  onChange={(e) => setReplyText({ ...replyText, [discussion.id]: e.target.value })}
                  placeholder={currentUser ? "Write a reply..." : "Please login to reply"}
                  disabled={!currentUser}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button 
                  onClick={() => handlePostReply(discussion.id)}
                  disabled={!replyText[discussion.id]?.trim() || !currentUser}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Reply
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {discussions.length === 0 && (
          <div className="text-center py-20 text-gray-500 glass rounded-2xl">
            No discussions yet. Be the first to start a conversation!
          </div>
        )}
      </div>
    </div>
  );
};

export default Discussion;
