import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, loginWithGoogle } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('careeros_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('careeros_token') || null;
  });

  const [loading, setLoading] = useState(false);

  const login = async (emailOrCandidateId, password) => {
    setLoading(true);
    try {
      let payload = {};
      if (emailOrCandidateId.startsWith('candidate_')) {
        payload = { candidate_id: emailOrCandidateId };
      } else {
        payload = { email: emailOrCandidateId, password: password || 'password123' };
      }
      
      const res = await loginUser(payload);
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('careeros_user', JSON.stringify(res.user));
        localStorage.setItem('careeros_token', res.token);
        return res.user;
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (googleData) => {
    setLoading(true);
    try {
      const res = await loginWithGoogle(googleData);
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('careeros_user', JSON.stringify(res.user));
        localStorage.setItem('careeros_token', res.token);
        return res.user;
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name, role) => {
    setLoading(true);
    try {
      const res = await registerUser({ email, password, name, role });
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('careeros_user', JSON.stringify(res.user));
        localStorage.setItem('careeros_token', res.token);
        return res.user;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('careeros_user');
    localStorage.removeItem('careeros_token');
  };

  const switchCandidate = async (candidateId) => {
    return await login(candidateId);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!user, login, signInWithGoogle, register, logout, switchCandidate }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
