import { apiUrl } from '../services/api';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ResourceCard from '../components/ResourceCard';
import { motion } from 'framer-motion';

const FacultyDashboard = () => {
  const { currentUser } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyResources = async () => {
      if (!currentUser) return;
      
      try {
        const response = await fetch(apiUrl('/resources'));
        if (!response.ok) throw new Error('Failed to fetch resources');
        const allData = await response.json();
        const data = allData.filter(res => res.uploadedBy === currentUser.uid);
        
        setResources(data);
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyResources();
  }, [currentUser]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(apiUrl(`/resources/${id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to delete resource');
        
        setResources(resources.filter(res => res.id !== id));
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-[calc(100vh-80px)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Faculty Dashboard</h1>
        <p className="text-gray-400">Manage your uploaded course materials and monitor student ratings.</p>
      </motion.div>

      <div className="glass p-8 rounded-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-t-2xl"></div>
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">My Uploads</h2>
          <span className="bg-blue-500/20 text-blue-400 px-4 py-1 rounded-full text-sm font-medium border border-blue-500/50">
            {resources.length} Resources Active
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(resource => (
              <div key={resource.id} className="relative group">
                <ResourceCard resource={resource} />
                <button
                  onClick={() => handleDelete(resource.id)}
                  className="absolute top-4 right-4 bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg transform translate-y-2 group-hover:translate-y-0"
                  title="Delete Resource"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xl text-gray-400 mb-4">You haven't uploaded any study materials yet.</p>
            <a href="/upload" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              Upload Your First Document
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;
