import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ResourceCard from '../components/ResourceCard';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/resources/recommended');
        if (response.ok) {
          const data = await response.json();
          setRecommended(data);
        }
      } catch (error) {
        console.error("Error fetching recommended resources:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommended();
  }, [currentUser]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 min-h-[calc(100vh-80px)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-14 text-center"
      >
        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter neon-glow uppercase">Study Control Center</h1>
        <p className="text-accent/60 font-medium tracking-widest uppercase text-xs">Unit: <span className="text-white font-bold">{currentUser?.name}</span> | Status: <span className="text-green-400">Online</span></p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
        <Link to="/branches" className="glass p-10 rounded-3xl group border border-white/5 hover:border-accent/30 relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full filter blur-[80px] group-hover:bg-accent/10 transition-all"></div>
          <div className="text-5xl mb-6 p-5 bg-accent/5 rounded-2xl inline-block group-hover:scale-110 group-hover:bg-accent/10 transition-all neon-border floating">
            📚
          </div>
          <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Academic Modules</h2>
          <p className="text-accent/50 text-sm leading-relaxed">Access zero-gravity resource clusters, categorized by engineering branches. Notes, papers, and holographic lectures.</p>
        </Link>

        <Link to="/library" className="glass p-10 rounded-3xl group border border-white/5 hover:border-accent/30 relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full filter blur-[80px] group-hover:bg-accent/10 transition-all"></div>
          <div className="text-5xl mb-6 p-5 bg-accent/5 rounded-2xl inline-block group-hover:scale-110 group-hover:bg-accent/10 transition-all neon-border floating" style={{ animationDelay: '0.5s' }}>
            🔍
          </div>
          <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Deep Space Library</h2>
          <p className="text-accent/50 text-sm leading-relaxed">Search the universal study repository. Navigate through specialized research data and faculty-curated knowledge streams.</p>
        </Link>
      </div>

      <div className="mt-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <span className="w-8 h-[1px] bg-accent/50"></span>
            Syncing Recommendations
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-2 border-accent/20 border-t-accent rounded-full animate-spin"></div>
          </div>
        ) : recommended.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommended.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="glass p-12 text-center rounded-3xl text-accent/40 border-dashed border-white/10">
            Scanning for relevant study data...
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
