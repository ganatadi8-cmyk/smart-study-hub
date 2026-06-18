import React from 'react';
import { motion } from 'framer-motion';

const BranchCard = ({ branch, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(branch)}
      className="glass p-6 rounded-2xl cursor-pointer relative overflow-hidden group hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="text-4xl">{branch.icon}</div>
        <div>
          <h3 className="text-xl font-bold text-white">{branch.shortName}</h3>
          <p className="text-sm text-gray-400">{branch.name}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-blue-400 group-hover:text-blue-300 transition-colors">Explore Resources</span>
        <svg className="w-5 h-5 text-blue-400 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </motion.div>
  );
};

export default BranchCard;
