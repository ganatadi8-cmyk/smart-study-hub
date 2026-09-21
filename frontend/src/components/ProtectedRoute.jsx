import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading, authError } = useAuth();

  if (loading) return <p className="p-8 text-center">Loading your account…</p>;
  if (authError) return <div role="alert" className="p-8 text-center">{authError}<button className="ml-4 underline" onClick={() => window.location.reload()}>Retry</button></div>;
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
