import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import { FiFileText, FiVideo, FiFile } from 'react-icons/fi';

const ResourceCard = ({ resource }) => {
  
  const getIcon = (type) => {
    switch(type) {
      case 'Notes':
      case 'Previous Paper':
        return <FiFileText className="text-blue-400 text-xl" />;
      case 'Video':
        return <FiVideo className="text-purple-400 text-xl" />;
      case 'PPT':
        return <FiFile className="text-orange-400 text-xl" />;
      default:
        return <FiFileText className="text-gray-400 text-xl" />;
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)" }}
      className="glass p-5 rounded-xl flex flex-col items-start gap-3 transition-all cursor-pointer h-full"
    >
      <div className="flex justify-between w-full items-start">
        <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold tracking-wide text-blue-300 border border-white/10">
          {resource.subject}
        </span>
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
          {getIcon(resource.type)}
        </div>
      </div>
      
      <h3 className="text-xl font-bold mt-2 text-gray-100 line-clamp-2">
        {resource.title}
      </h3>
      
      <p className="text-sm text-gray-400 line-clamp-3 mb-2 flex-grow">
        {resource.description}
      </p>

      <div className="w-full flex justify-between items-center mt-auto pt-4 border-t border-white/10">
        <RatingStars rating={resource.rating} readonly size="sm" />
        <Link to={`/resource/${resource.id}`} className="text-sm font-medium text-blue-400 hover:text-blue-300">
          View Details →
        </Link>
      </div>
    </motion.div>
  );
};

export default ResourceCard;
