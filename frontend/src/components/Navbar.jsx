import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="glass sticky top-0 z-50 rounded-none border-t-0 border-l-0 border-r-0 border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(100,255,218,0.3)] transition-all group-hover:shadow-[0_0_20px_rgba(100,255,218,0.6)] bg-gray-900 border-accent/30 floating">
            <img src="/logo.png" alt="Smart Study Hub Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white neon-glow uppercase">
            Smart Study Hub
          </span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link to="/branches" className="hover:text-blue-400 transition-colors">Branches</Link>
          <Link to="/library" className="hover:text-blue-400 transition-colors">Library</Link>
          <Link to="/discussion" className="hover:text-purple-400 transition-colors">Forum</Link>
          {currentUser && <Link to="/leaderboard" className="hover:text-yellow-400 text-yellow-500/80 transition-colors font-medium">Leaderboard</Link>}
          {currentUser ? (
            <>
              {currentUser.role === 'Student' && (
                <>
                  <Link to="/mock-tests" className="hover:text-blue-400 transition-colors border border-white/5 py-1 px-3 rounded-lg hover:bg-white/5">Mock Tests</Link>
                  <Link to="/dashboard" className="hover:text-blue-400 transition-colors border border-white/5 py-1 px-3 rounded-lg hover:bg-white/5">Student Dashboard</Link>
                </>
              )}
              {currentUser.role === 'Faculty' && (
                <>
                  <Link to="/faculty-dashboard" className="hover:text-blue-400 transition-colors border border-white/5 py-1 px-3 rounded-lg hover:bg-white/5">Faculty Dashboard</Link>
                  <Link to="/upload" className="hover:text-blue-400 transition-colors border border-white/5 py-1 px-3 rounded-lg hover:bg-white/5">Upload Resource</Link>
                </>
              )}
              {currentUser.role === 'Admin' && (
                <Link to="/admin-dashboard" className="hover:text-blue-400 transition-colors border border-white/5 py-1 px-3 rounded-lg hover:bg-white/5">Admin Control Panel</Link>
              )}
              <button 
                onClick={handleLogout}
                className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 px-4 py-2 rounded-lg transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-400 transition-colors">Login</Link>
              <Link to="/signup" className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all font-medium">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
