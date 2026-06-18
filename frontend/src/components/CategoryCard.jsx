import React from 'react';
import { motion } from 'framer-motion';

const CategoryCard = ({ category, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(category)}
      className={`glass p-8 rounded-2xl cursor-pointer relative overflow-hidden group hover:shadow-[0_0_20px_rgba(${category.colorRGB || '59,130,246'},0.3)] transition-all duration-300 flex flex-col items-center justify-center text-center`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
      
      <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
        {category.icon}
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
      <p className="text-gray-400 text-sm">{category.description}</p>
    </motion.div>
  );
};

export default CategoryCard;
