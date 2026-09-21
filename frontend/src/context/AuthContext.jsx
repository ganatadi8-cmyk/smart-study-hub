/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onIdTokenChanged, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth } from '../services/firebase';
import { loadProfile } from '../services/api';
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(auth));
  const [authError, setAuthError] = useState('');
  const version = useRef(0);
  const synchronize = async user => {
    const request = ++version.current;
    setLoading(true);
    try {
      const profile = user ? await loadProfile(user) : null;
      if (request === version.current) {
        setCurrentUser(user ? { ...profile, emailVerified: user.emailVerified, getIdToken: force => user.getIdToken(force) } : null);
        setAuthError('');
      }
    } catch (error) {
      if (request === version.current) { setCurrentUser(null); setAuthError(error.message); }
      throw error;
    } finally {
      if (request === version.current) setLoading(false);
    }
  };
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onIdTokenChanged(auth, user => { synchronize(user).catch(() => {}); });
    const invalidate = () => { version.current += 1; };
    return () => { invalidate(); unsubscribe(); };
  }, []);
  const checkConfiguration = () => {
    if (!auth) throw new Error('Sign-in is not configured. Please contact the site administrator.');
  };
  const signup = async (email, password, name) => {
    checkConfiguration();
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name.trim() });
    await result.user.getIdToken(true);
    await synchronize(result.user);
    return result;
  };
  const login = async (email, password) => {
    checkConfiguration();
    const result = await signInWithEmailAndPassword(auth, email, password);
    await synchronize(result.user);
    return result;
  };
  const logout = async () => { checkConfiguration(); await signOut(auth); };
  const sendVerification = async () => {
    checkConfiguration();
    if (!auth.currentUser) throw new Error('Please sign in first.');
    await sendEmailVerification(auth.currentUser);
  };
  const refreshVerification = async () => {
    checkConfiguration();
    if (!auth.currentUser) throw new Error('Please sign in first.');
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    await synchronize(auth.currentUser);
    return auth.currentUser.emailVerified;
  };
  return <AuthContext.Provider value={{ currentUser, loading, authError, signup, login, logout, sendVerification, refreshVerification }}>{children}</AuthContext.Provider>;
};
