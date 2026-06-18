import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Upload = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    branch: 'CSE',
    subject: '',
    type: 'Notes',
    description: '',
    videoURL: ''
  });
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !(formData.type === 'Video' && formData.videoURL !== '')) {
      return setError("Please provide a file or a video link.");
    }
    
    setLoading(true);
    setError('');

    try {
      const token = await currentUser.getIdToken();
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('branch', formData.branch);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('description', formData.description);
      
      if (formData.videoURL) {
        formDataToSend.append('videoURL', formData.videoURL);
      }
      if (file) {
        formDataToSend.append('file', file);
      }

      // We'll fake progress if actual network events aren't captured via fetch easily
      setProgress(50);

      const response = await fetch('http://localhost:5000/api/resources/upload-resource', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Network error occurred during upload.');
      }
      
      setProgress(100);
      setLoading(false);
      navigate(`/resources/${formData.branch.toLowerCase()}/${formData.type}`);
    } catch (err) {
      console.error(err);
      setError("An error occurred: " + err.message);
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 md:p-12 rounded-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Upload Resource</h1>
        <p className="text-gray-400 mb-8">Share your study materials with the community.</p>

        {error && <div className="bg-red-500/20 text-red-300 p-4 rounded-xl mb-6 border border-red-500/50">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Resource Title</label>
              <input 
                type="text" 
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="e.g. Data Structures Full Notes"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Branch</label>
              <select 
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none [&>option]:bg-gray-900"
              >
                <option value="CSE">Computer Science Engineering (CSE)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="ECE">Electronics and Communication (ECE)</option>
                <option value="EEE">Electrical Engineering (EEE)</option>
                <option value="MECH">Mechanical Engineering (MECH)</option>
                <option value="CIVIL">Civil Engineering (CIVIL)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Subject / Tag</label>
              <input 
                type="text" 
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="e.g. Computer Science"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Resource Type</label>
            <select 
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none [&>option]:bg-gray-900"
            >
              <option value="Notes">Notes</option>
              <option value="PPT">PPT Presentation</option>
              <option value="Video">Video Link/File</option>
              <option value="Previous Paper">Previous Exam Paper</option>
            </select>
          </div>

          {formData.type === 'Video' && (
             <div>
               <label className="block text-gray-300 text-sm font-medium mb-2">Video Link (YouTube Optional)</label>
               <input 
                 type="url" 
                 name="videoURL"
                 value={formData.videoURL}
                 onChange={handleChange}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                 placeholder="https://youtube.com/watch?v=..."
               />
             </div>
          )}

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
            <textarea 
              name="description"
              required
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
              placeholder="Provide a brief description of the contents..."
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Upload File (PDF, PPT, DOCX)</label>
            <div className="border-2 border-dashed border-white/20 hover:border-blue-500/50 rounded-xl p-8 text-center transition-all bg-white/5 relative">
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="absolute inset-x-0 inset-y-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4"
                  required={!(formData.type === 'Video' && formData.videoURL)}
                />
              <div className="text-gray-400">
                {file ? (
                  <span className="text-blue-400 font-medium">{file.name}</span>
                ) : (
                  <span>Drag and drop your file here or click to browse</span>
                )}
              </div>
            </div>
          </div>

          {progress > 0 && progress < 100 && (
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50"
          >
            {loading ? `Uploading... ${Math.round(progress)}%` : 'Submit Resource'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Upload;
