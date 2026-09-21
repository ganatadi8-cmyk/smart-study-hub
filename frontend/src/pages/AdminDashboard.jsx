import { apiUrl } from '../services/api';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await currentUser.getIdToken();
        const headers = { 'Authorization': `Bearer ${token}` };

        const usersRes = await fetch(apiUrl('/users'), { headers });
        const resRes = await fetch(apiUrl('/resources')); // Public read but deleted privately

        if (usersRes.ok) {
          setUsers(await usersRes.json());
        }
        if (resRes.ok) {
          setResources(await resRes.json());
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.role === 'Admin') fetchData();
  }, [currentUser]);

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(apiUrl(`/users/${id}`), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setUsers(users.filter(u => u.id !== id));
        } else {
          alert("Failed to delete user.");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleDeleteResource = async (id) => {
    if (window.confirm("Are you sure you want to delete this resource globally?")) {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(apiUrl(`/resources/${id}`), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setResources(resources.filter(r => r.id !== id));
        } else {
          alert("Failed to delete resource.");
        }
      } catch (error) {
        console.error("Error deleting resource:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-pink-600 mb-2">Admin Control Panel</h1>
        <p className="text-gray-400">Total System Overview & Management</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* User Management */}
        <div className="glass p-6 rounded-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl"></div>
          <h2 className="text-2xl font-bold text-white mb-6">User Management ({users.length})</h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {users.map(user => (
              <div key={user.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-blue-400">{user.name}</h3>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded mt-2 inline-block ${
                    user.role === 'Admin' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 
                    user.role === 'Faculty' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 
                    'bg-green-500/20 text-green-400 border border-green-500/50'
                  }`}>
                    {user.role}
                  </span>
                </div>
                {user.role !== 'Admin' && (
                  <button onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors border border-red-500/30">
                    Remove
                  </button>
                )}
              </div>
            ))}
            {users.length === 0 && <p className="text-gray-400 text-center">No users found.</p>}
          </div>
        </div>

        {/* Global Resource Management */}
        <div className="glass p-6 rounded-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl"></div>
          <h2 className="text-2xl font-bold text-white mb-6">Global Resources ({resources.length})</h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {resources.map(resource => (
              <div key={resource.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-purple-400 truncate max-w-[250px]">{resource.title}</h3>
                  <p className="text-sm text-gray-400">{resource.branch} • {resource.subject} • {resource.type}</p>
                </div>
                <button onClick={() => handleDeleteResource(resource.id)} className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors border border-red-500/30">
                  Delete
                </button>
              </div>
            ))}
            {resources.length === 0 && <p className="text-gray-400 text-center">No resources found.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
