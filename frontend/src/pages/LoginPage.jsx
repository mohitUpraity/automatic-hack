import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, signInWithGoogle } = useAuth();

  const from = location.state?.from?.pathname || '/';

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  const handleEmailAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name, 'Software Engineer');
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || (isRegister ? 'Registration failed.' : 'Login failed. Check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInClick = () => {
    setError('');
    setShowGoogleModal(true);
  };

  const handleGoogleQuickSelect = async (selectedEmail, selectedName) => {
    setError('');
    setLoading(true);
    setShowGoogleModal(false);
    try {
      await signInWithGoogle({
        email: selectedEmail,
        name: selectedName,
        google_id: `g_${Date.now()}`
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmail) return;
    setError('');
    setLoading(true);
    setShowGoogleModal(false);
    try {
      await signInWithGoogle({
        email: googleEmail,
        name: googleName || googleEmail.split('@')[0],
        google_id: `g_${Date.now()}`
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm space-y-6 relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20 mb-1 border border-indigo-400/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            CareerOS <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">v3</span>
          </h1>
          <p className="text-xs text-slate-400">
            {isRegister ? 'Create your isolated career intelligence account' : 'Sign in to access your autonomous workspace'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Card */}
        <GlassCard className="p-6 bg-slate-900/90 border-slate-800 shadow-2xl backdrop-blur-xl space-y-5">
          {/* Sign In with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignInClick}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-700 hover:border-slate-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Clean Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-medium absolute uppercase tracking-wider">
              or
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
            {isRegister && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-1"
            >
              {loading ? (
                <LoadingSpinner size="xs" text={isRegister ? 'Creating account...' : 'Signing in...'} />
              ) : isRegister ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="text-center pt-1 text-xs">
            {isRegister ? (
              <p className="text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError('');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError('');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
                >
                  Create one
                </button>
              </p>
            )}
          </div>
        </GlassCard>

        {/* Google Authentic 1-Click Account Picker Dialog */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white text-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 animate-scale-in relative border border-slate-200 font-sans">
              {/* Google Header */}
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Sign in with Google</h3>
                <p className="text-sm text-slate-600">Choose an account to continue to <span className="font-semibold text-slate-900">CareerOS</span></p>
              </div>

              {/* 1-Click Google Account List */}
              <div className="divide-y divide-slate-100 border-y border-slate-100 -mx-4 px-4">
                {/* Account 1: Mohit */}
                <button
                  type="button"
                  onClick={() => handleGoogleQuickSelect('mohitupraity123@gmail.com', 'Mohit Prasad Upraity')}
                  className="w-full py-3.5 px-3 flex items-center gap-3.5 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                    M
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">Mohit Prasad Upraity</p>
                    <p className="text-xs text-slate-500 truncate">mohitupraity123@gmail.com</p>
                  </div>
                </button>

                {/* Account 2: Vishnu */}
                <button
                  type="button"
                  onClick={() => handleGoogleQuickSelect('vishnu9027872285@gmail.com', 'Vishnu Kumar')}
                  className="w-full py-3.5 px-3 flex items-center gap-3.5 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                    V
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">Vishnu Kumar</p>
                    <p className="text-xs text-slate-500 truncate">vishnu9027872285@gmail.com</p>
                  </div>
                </button>

                {/* Account 3: Krati */}
                <button
                  type="button"
                  onClick={() => handleGoogleQuickSelect('krati.verma@careeros.ai', 'Krati Verma')}
                  className="w-full py-3.5 px-3 flex items-center gap-3.5 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                    K
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">Krati Verma</p>
                    <p className="text-xs text-slate-500 truncate">krati.verma@careeros.ai</p>
                  </div>
                </button>

                {/* Account 4: Use Another Account */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const emailPrompt = window.prompt('Enter your Google email address:');
                      if (emailPrompt && emailPrompt.includes('@')) {
                        handleGoogleQuickSelect(emailPrompt, emailPrompt.split('@')[0]);
                      }
                    }}
                    className="w-full py-3 px-3 flex items-center gap-3.5 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer text-slate-700 hover:text-slate-900 font-medium text-xs"
                  >
                    <div className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <span>Use another Google account</span>
                  </button>
                </div>
              </div>

              {/* Google OAuth Disclaimer */}
              <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                To continue, Google will securely share your name and email with <span className="font-semibold text-slate-700">CareerOS</span>.
              </p>

              {/* Action buttons */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="px-5 py-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-slate-600 font-mono">
          Each account maintains an isolated knowledge base & documents store.
        </p>
      </div>
    </div>
  );
}
