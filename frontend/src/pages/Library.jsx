import { apiUrl } from '../services/api';
import React, { useState, useEffect } from 'react';
import ResourceCard from '../components/ResourceCard';
import SearchBar from '../components/SearchBar';
import { motion } from 'framer-motion';

const Library = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  const categories = ['All', 'Notes', 'PPT', 'Video', 'Previous Paper'];

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch(apiUrl('/resources'));
        if (!response.ok) throw new Error('Failed to fetch resources');
        const data = await response.json();
        setResources(data);
        setFilteredResources(data);
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const handleSearch = (searchTerm) => {
    const term = searchTerm.toLowerCase();
    const filtered = resources.filter(res => 
      res.title.toLowerCase().includes(term) || 
      res.subject.toLowerCase().includes(term) ||
      res.description.toLowerCase().includes(term)
    );
    applyCategoryFilter(activeFilter, filtered);
  };

  const handleFilterClick = (category) => {
    setActiveFilter(category);
    applyCategoryFilter(category, resources);
  };

  const applyCategoryFilter = (category, dataToFilter) => {
    if (category === 'All') {
      setFilteredResources(dataToFilter);
    } else {
      setFilteredResources(dataToFilter.filter(res => res.type === category));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
          Resource Library
        </h1>
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => handleFilterClick(category)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === category 
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="glass text-center py-20 rounded-2xl mx-auto max-w-2xl">
          <p className="text-gray-400 text-lg">No resources found matching your criteria.</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredResources.map((resource, i) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <ResourceCard resource={resource} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Library;
