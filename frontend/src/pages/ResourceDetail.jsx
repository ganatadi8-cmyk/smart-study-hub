import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RatingStars from '../components/RatingStars';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiDownload, FiArrowLeft, FiClock, FiUser, FiTag } from 'react-icons/fi';

const ResourceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [authorName, setAuthorName] = useState('Unknown User');

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/resources/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            console.error("No such document!");
          }
          throw new Error('Failed to fetch resource');
        }
        
        const resData = await response.json();
        setResource(resData);
        
        // Simply display the UID or a default for now since we mapped away from real user Firestore
        setAuthorName('Student / Contributor');
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [id]);

  const handleRate = async (newRating) => {
    if (!currentUser) {
      alert("Please login to rate resources");
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:5000/api/resources/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: newRating })
      });

      if (!response.ok) throw new Error('Failed to rate resource');
      
      const data = await response.json();
      setResource(prev => ({
        ...prev,
        rating: data.rating,
        ratingCount: data.count
      }));
      setUserRating(newRating);
    } catch (error) {
      console.error("Error updating rating", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this resource globally?")) {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`http://localhost:5000/api/resources/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          navigate(-1);
        } else {
          alert('Failed to delete resource');
        }
      } catch (error) {
        console.error("Error deleting resource:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="text-center py-20 text-white">
        <h2>Resource not found</h2>
        <button onClick={() => navigate('/library')} className="mt-4 text-blue-400">Back to Library</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 min-h-[calc(100vh-80px)]">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
      >
        <FiArrowLeft /> Back
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 md:p-12 rounded-3xl relative overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="flex-1 w-full space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold border border-blue-500/30">
                {resource.subject}
              </span>
              <span className="px-4 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold border border-purple-500/30">
                {resource.type}
              </span>
            </div>

            <h1 className="text-4xl font-bold text-white leading-tight">
              {resource.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <FiUser /> {authorName}
              </div>
              <div className="flex items-center gap-2">
                <FiClock /> {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : 'Recently'}
              </div>
              <div className="flex items-center gap-2 text-yellow-500">
                <RatingStars rating={resource.rating} readonly size="sm" /> 
                <span className="text-gray-400">({(resource.rating || 0).toFixed(1)}) • {resource.ratingCount || 0} reviews</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {resource.description}
              </p>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/10">
              <div className="space-y-2 text-center sm:text-left">
                <p className="text-sm font-medium text-gray-300">Rate this resource:</p>
                <RatingStars rating={userRating} onRate={handleRate} size="lg" />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                {(currentUser?.role === 'Admin' || currentUser?.uid === resource?.uploadedBy) && (
                  <button 
                    onClick={handleDelete}
                    className="flex justify-center items-center px-8 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold transition-colors"
                  >
                    Delete Resource
                  </button>
                )}
                
                <a 
                  href={resource.fileURL || resource.videoURL || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                >
                  <FiDownload />
                  {resource.type === 'Video' ? 'Watch Video' : 'Download Resource'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResourceDetail;
