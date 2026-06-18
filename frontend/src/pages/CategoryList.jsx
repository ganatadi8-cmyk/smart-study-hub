import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CategoryCard from '../components/CategoryCard';

const Categories = () => {
  const { branchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const branchName = location.state?.branchName || branchId.toUpperCase();
  const branchShortName = location.state?.branchShortName || branchId.toUpperCase();

  const categories = [
    {
      id: 'Notes',
      name: 'Notes',
      description: 'Comprehensive handwritten and digital notes',
      icon: '📝',
      gradient: 'from-blue-500 to-cyan-500',
      colorRGB: '59,130,246'
    },
    {
      id: 'PPT',
      name: 'PPTs',
      description: 'Presentation slides for quick revision',
      icon: '📊',
      gradient: 'from-purple-500 to-pink-500',
      colorRGB: '168,85,247'
    },
    {
      id: 'Previous Paper',
      name: 'Previous Papers',
      description: 'Past examination question papers',
      icon: '📄',
      gradient: 'from-orange-500 to-red-500',
      colorRGB: '249,115,22'
    },
    {
      id: 'Video',
      name: 'Video Lectures',
      description: 'Curated video tutorials and lectures',
      icon: '▶️',
      gradient: 'from-green-500 to-emerald-500',
      colorRGB: '34,197,94'
    }
  ];

  const handleCategorySelect = (category) => {
    navigate(`/resources/${branchId}/${category.id}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-4">
        <button 
          onClick={() => navigate('/branches')}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Branches
        </button>
      </div>

      <div className="text-center mb-16">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="inline-block px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6"
        >
          {branchShortName} Department
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-extrabold text-white mb-4"
        >
          Select Resource Type
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-400 max-w-2xl mx-auto"
        >
          Access study materials for <span className="text-blue-400 font-medium">{branchName}</span> classified by category.
        </motion.p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {categories.map((category) => (
          <motion.div key={category.id} variants={itemVariants} className="h-full">
            <CategoryCard 
              category={category} 
              onClick={handleCategorySelect} 
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Categories;
