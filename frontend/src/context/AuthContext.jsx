import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { loginUser, registerUser, loginWithGoogle, fetchCandidates, createCandidate, deleteCandidate } from '../api/client';

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

  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateIdState] = useState(() => {
    return localStorage.getItem('careeros_active_candidate_id') || 'all';
  });

  const [loading, setLoading] = useState(false);

  const setSelectedCandidateId = (id) => {
    setSelectedCandidateIdState(id);
    localStorage.setItem('careeros_active_candidate_id', id);
  };

  const refreshCandidates = useCallback(async (userId = null) => {
    try {
      const targetUser = userId || user?.id;
      const res = await fetchCandidates(targetUser);
      if (res?.candidates) {
        setCandidates(res.candidates);
        // If current selection is invalid, set to 'all' or first candidate
        if (selectedCandidateId !== 'all' && !res.candidates.find(c => c.id === selectedCandidateId)) {
          if (res.candidates.length > 0) {
            setSelectedCandidateId(res.candidates[0].id);
          } else {
            setSelectedCandidateId('all');
          }
        }
      }
    } catch (err) {
      console.warn('[Candidates Load Error]', err);
    }
  }, [user?.id, selectedCandidateId]);

  useEffect(() => {
    if (user?.id) {
      refreshCandidates(user.id);
    }
  }, [user?.id]);

  const addCandidatePersona = async (candidateData) => {
    setLoading(true);
    try {
      const res = await createCandidate(candidateData);
      await refreshCandidates(user?.id);
      if (res?.candidate?.id) {
        setSelectedCandidateId(res.candidate.id);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const removeCandidatePersona = async (candidateId) => {
    setLoading(true);
    try {
      const res = await deleteCandidate(candidateId);
      await refreshCandidates(user?.id);
      setSelectedCandidateId('all');
      return res;
    } finally {
      setLoading(false);
    }
  };

  const syncSupabaseUser = async (sbUser, sbToken) => {
    try {
      const email = sbUser.email;
      const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split('@')[0];
      const avatar_url = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture;
      
      const res = await loginWithGoogle({
        email,
        name,
        avatar_url,
        google_id: sbUser.id
      });

      if (res.user) {
        const prevUserStr = localStorage.getItem('careeros_user');
        let prevUserId = null;
        try {
          prevUserId = prevUserStr ? JSON.parse(prevUserStr)?.id : null;
        } catch {}

        if (prevUserId && prevUserId !== res.user.id) {
          localStorage.removeItem('careeros_active_candidate_id');
          setSelectedCandidateIdState('all');
          setCandidates([]);
        }

        setUser(res.user);
        const activeToken = res.token || sbToken;
        setToken(activeToken);
        localStorage.setItem('careeros_user', JSON.stringify(res.user));
        localStorage.setItem('careeros_token', activeToken);
        await refreshCandidates(res.user.id);
        return res.user;
      }
    } catch (err) {
      console.error('[Supabase Auth Sync Error]', err);
    }
  };

  // Listen to live Supabase Auth State (OAuth callback / session persistence)
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await syncSupabaseUser(session.user, session.access_token);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await syncSupabaseUser(session.user, session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setToken(null);
        setCandidates([]);
        localStorage.removeItem('careeros_user');
        localStorage.removeItem('careeros_token');
        localStorage.removeItem('careeros_active_candidate_id');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithGoogleOAuth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          }
        }
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[Google OAuth Notice]', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithDirectGoogle = async (googleData) => {
    setLoading(true);
    try {
      const res = await loginWithGoogle(googleData);
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('careeros_user', JSON.stringify(res.user));
        localStorage.setItem('careeros_token', res.token);
        await refreshCandidates(res.user.id);
        return res.user;
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.user) {
          return await syncSupabaseUser(data.user, data.session?.access_token);
        }
      } catch {}

      const res = await loginUser({ email, password });
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('careeros_user', JSON.stringify(res.user));
        localStorage.setItem('careeros_token', res.token);
        await refreshCandidates(res.user.id);
        return res.user;
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name, role) => {
    setLoading(true);
    try {
      try {
        await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, role: role || 'Software Engineer' } }
        });
      } catch {}

      const res = await registerUser({ email, password, name, role });
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('careeros_user', JSON.stringify(res.user));
        localStorage.setItem('careeros_token', res.token);
        await refreshCandidates(res.user.id);
        return res.user;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setToken(null);
    setCandidates([]);
    setSelectedCandidateIdState('all');
    localStorage.removeItem('careeros_user');
    localStorage.removeItem('careeros_token');
    localStorage.removeItem('careeros_active_candidate_id');
  };

  const activeCandidate = candidates.find(c => c.id === selectedCandidateId) || null;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user,
      candidates,
      selectedCandidateId,
      setSelectedCandidateId,
      activeCandidate,
      refreshCandidates,
      addCandidatePersona,
      removeCandidatePersona,
      login,
      register,
      signInWithGoogleOAuth,
      loginWithDirectGoogle,
      logout
    }}>
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
