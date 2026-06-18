import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// In a real app, we would import fetchSignInMethodsForEmail from 'firebase/auth'
// For this demonstration, we'll implement a mock function that simulates the behavior

const EmailVerification = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, checking, success, error
  const [message, setMessage] = useState('');

  const verifyEmail = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('checking');
    setMessage('Accessing Firebase Neural Network...');

    // Simulate fetchSignInMethodsForEmail logic
    setTimeout(() => {
      // Logic: If email contains 'scholar' or 'google', we'll say it exists for the demo
      const exists = email.toLowerCase().includes('scholar') || email.toLowerCase().includes('google');
      
      if (exists) {
        setStatus('success');
        setMessage('Biometric match found. Welcome back, Scholar.');
        document.body.classList.add('verification-success');
        document.body.classList.remove('verification-error');
      } else {
        setStatus('error');
        setMessage('Access Denied. Identity not found in study hub registry.');
        document.body.classList.add('verification-error');
        document.body.classList.remove('verification-success');
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      document.body.classList.remove('verification-success', 'verification-error');
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-10 max-w-md w-full relative z-10 overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase neon-glow mb-2">Identify Scholar</h2>
          <p className="text-accent/60 text-xs tracking-widest uppercase">Gmail Verification Module v2.0</p>
        </div>

        <form onSubmit={verifyEmail} className="space-y-6">
          <div className="relative group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Registered Gmail"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all floating"
              disabled={status === 'checking' || status === 'success'}
            />
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-accent/30 group-focus-within:text-accent transition-colors">
              📧
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'checking' || status === 'success'}
            className={`w-full py-4 rounded-xl font-black tracking-widest uppercase transition-all duration-500 overflow-hidden relative group ${
              status === 'success' ? 'bg-success text-black' : 'bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30'
            }`}
          >
            <span className="relative z-10">
              {status === 'checking' ? 'Synchronizing...' : status === 'success' ? 'Verified' : 'Verify Identity'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </form>

        <AnimatePresence>
          {message && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-6 text-center text-sm font-medium ${
                status === 'error' ? 'text-red-400' : 'text-accent'
              }`}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Verified Badge Overlay */}
      <AnimatePresence>
        {status === 'success' && (
          <div className="verified-badge">
            <motion.div 
              initial={{ rotateY: 180, scale: 0 }}
              animate={{ rotateY: 0, scale: 1 }}
              className="bg-accent text-black px-8 py-4 rounded-2xl shadow-[0_0_50px_rgba(100,255,218,0.5)] flex items-center gap-4 border-4 border-white/20"
            >
              <div className="text-4xl">🛡️</div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Status</div>
                <div className="text-2xl font-black uppercase tracking-tighter">Verified</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background Pulse Effect for Success */}
      {status === 'success' && (
        <div className="fixed inset-0 pointer-events-none neon-pulse z-0"></div>
      )}
    </div>
  );
};

export default EmailVerification;
