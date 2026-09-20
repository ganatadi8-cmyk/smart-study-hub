import { apiUrl } from '../services/api';
import React, { useState, useEffect } from 'react'; // Forced Cache Invalidation
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ResourceCard from '../components/ResourceCard';
import SearchBar from '../components/SearchBar';

const Resources = () => {
  const { branchId, typeId } = useParams();
  const navigate = useNavigate();
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const url = new URL(apiUrl('/resources'));
        url.searchParams.append('branch', branchId.toUpperCase());
        url.searchParams.append('type', typeId);
        
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Network response was not ok');
        
        const fetchedResources = await response.json();
        setResources(fetchedResources);
        
        // Extract unique subjects for the filter
        const uniqueSubjects = ['All', ...new Set(fetchedResources.map(r => r.subject).filter(Boolean))];
        setSubjects(uniqueSubjects);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError('Failed to load resources. Please try again later.');
        setLoading(false);
      }
    };

    fetchResources();
  }, [branchId, typeId]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredResources = resources.filter(res => {
    const matchesSubject = selectedSubject === 'All' || res.subject === selectedSubject;
    const matchesSearch = res.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header and Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-800 gap-4">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-400 hover:text-white transition-colors text-sm mb-4 inline-flex"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Categories
          </button>
          
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">{branchId.toUpperCase()}</span>
            <span>&bull;</span>
            <span className="text-white font-medium">{typeId === 'PPT' ? 'Presentations' : typeId}</span>
          </div>
          <h1 className="text-3xl font-bold mt-2 text-white">Resource Archive</h1>
        </div>
        
        <div className="w-full md:w-auto">
          <SearchBar onSearch={handleSearch} placeholder="Search title or subject..." />
        </div>
      </div>

      {loading ? (
        <div className="flex mt-12 mb-12 items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400 my-8">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="glass rounded-xl p-6 sticky top-24">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter by Subject
              </h3>
              
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {subjects.map((subject, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSubject(subject)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all focus:outline-none ${
                      selectedSubject === subject 
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white font-medium'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resource Grid */}
          <div className="lg:col-span-3">
            {filteredResources.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center flex flex-col items-center justify-center">
                <div className="text-6xl mb-4 opacity-50">📂</div>
                <h3 className="text-xl font-medium text-white mb-2">No resources found</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  {searchQuery || selectedSubject !== 'All' 
                    ? "We couldn't find any resources matching your current filters."
                    : "There are currently no resources available in this category for this branch."}
                </p>
                {(searchQuery || selectedSubject !== 'All') && (
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedSubject('All'); }}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
