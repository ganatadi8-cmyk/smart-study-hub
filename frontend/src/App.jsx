import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AiChatWidget from './components/AiChatWidget';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Library from './pages/Library';
import ResourceDetail from './pages/ResourceDetail';
import BranchList from './pages/BranchList';
import CategoryList from './pages/CategoryList';
import ResourceList from './pages/ResourceList';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import MockTests from './pages/MockTests';
import Leaderboard from './pages/Leaderboard';
import Discussion from './pages/Discussion';
import EmailVerification from './pages/EmailVerification';

function AccountNotice() {
  const { currentUser, authError } = useAuth();
  if (authError) return <p role="alert" className="p-4 text-center text-red-300">{authError} <button className="underline" onClick={() => window.location.reload()}>Retry</button></p>;
  if (currentUser && !currentUser.emailVerified) return <p className="p-4 text-center bg-blue-950">Verify your email to upload, rate materials and use AI. <a href="/verify-email" className="underline">Verify email</a></p>;
  return null;
}
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-primary text-gray-100 font-sans selection:bg-purple-500/30">
          <Navbar />
          <AccountNotice />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/library" element={<Library />} />
              <Route path="/branches" element={<BranchList />} />
              <Route path="/categories/:branchId" element={<CategoryList />} />
              <Route path="/resources/:branchId/:typeId" element={<ResourceList />} />
              <Route path="/resource/:id" element={<ResourceDetail />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/upload" element={
                <ProtectedRoute allowedRoles={['Faculty', 'Admin']}>
                  <Upload />
                </ProtectedRoute>
              } />
              <Route path="/mock-tests" element={
                <ProtectedRoute>
                  <MockTests />
                </ProtectedRoute>
              } />
              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } />
              <Route path="/discussion" element={
                <ProtectedRoute>
                  <Discussion />
                </ProtectedRoute>
              } />
              <Route path="/admin-dashboard" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/faculty-dashboard" element={
                <ProtectedRoute allowedRoles={['Faculty', 'Admin']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              } />
              <Route path="*" element={<section className="max-w-2xl mx-auto px-6 py-24 text-center">
                <p className="text-blue-400 font-semibold">404</p>
                <h1 className="text-3xl font-bold my-4">Page not found</h1>
                <p className="text-gray-400 mb-8">This page may have moved. Continue exploring the study library.</p>
                <Link to="/library" className="bg-blue-600 px-6 py-3 rounded-xl">Browse library</Link>
              </section>} />
            </Routes>
          </main>
          <AiChatWidget />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
