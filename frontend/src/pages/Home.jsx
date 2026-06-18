import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiShare2, FiStar, FiAward } from 'react-icons/fi';

const Home = () => {
  const features = [
    { icon: <FiBookOpen />, title: "Huge Library", desc: "Access thousands of notes, past papers, and video lectures." },
    { icon: <FiShare2 />, title: "Easy Upload", desc: "Share your knowledge and help your peers succeed." },
    { icon: <FiStar />, title: "Rate Resources", desc: "Find the best materials curated and rated by students." },
    { icon: <FiAward />, title: "Leaderboards", desc: "Top contributors earn badges and appear on the leaderboard." },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)]">
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-40 h-40 rounded-full overflow-hidden mb-8 border-[3px] border-purple-500/30 shadow-[0_0_40px_rgba(139,92,246,0.4)] relative group"
            >
              <div className="absolute inset-0 bg-blue-500/20 group-hover:bg-transparent transition-colors z-10 mix-blend-overlay"></div>
              <img src="/logo.png" alt="Smart Study Hub Logo" className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" />
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
              The Ultimate Academic Resource Platform
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Find, share, and organize all your study materials in one place. Your centralized hub for notes, PPTs, videos, and previous exam papers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/library" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                Browse Library
              </Link>
              <Link to="/upload" className="px-8 py-4 glass text-white hover:bg-white/10 rounded-xl font-bold text-lg transition-transform hover:scale-105 border border-white/20">
                Upload Notes
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Smart Study Hub?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass p-8 rounded-2xl flex flex-col items-center text-center group hover:-translate-y-2 transition-transform"
              >
                <div className="text-4xl text-blue-400 mb-6 p-4 bg-blue-500/10 rounded-full group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
