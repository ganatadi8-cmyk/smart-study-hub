/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('mock_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      user.getIdToken = async () => `mock_token_${user.role}`;
      return user;
    }
    return null;
  });

  const signup = async (email, password, name, role) => {
    // Mock user signup
    const mockUser = {
      uid: 'mock_uid_' + Date.now(),
      email,
      name,
      role: role || 'Student',
      getIdToken: async () => `mock_token_${role || 'Student'}`
    };
    
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    setCurrentUser(mockUser);
    return { user: mockUser };
  };

  // eslint-disable-next-line no-unused-vars
  const login = async (email, password) => {
    // Mock user login
    const savedUser = localStorage.getItem('mock_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      // Re-attach the async token function which gets lost in JSON stringify
      user.getIdToken = async () => `mock_token_${user.role}`;
      setCurrentUser(user);
      return { user };
    }
    
    // Fallback if logging in without signing up first in mock mode
    const mockUser = {
      uid: 'mock_uid_123',
      email,
      name: 'Test Student',
      role: 'Student',
      getIdToken: async () => 'mock_token_Student'
    };
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    setCurrentUser(mockUser);
    return { user: mockUser };
  };

  const logout = async () => {
    localStorage.removeItem('mock_user');
    setCurrentUser(null);
  };



  const value = {
    currentUser,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
