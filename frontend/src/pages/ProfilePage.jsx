import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Code2,
  Globe,
  Upload,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Sparkles,
  ExternalLink,
  Layers,
  Sliders,
  DollarSign,
  Clock,
  Shield,
  LogIn,
  LogOut,
  RefreshCw,
  Eye
} from 'lucide-react';

const LinkedinIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
  </svg>
);

const GithubIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);
import PageShell from '../components/layout/PageShell';
import {
  fetchUserProfile,
  updateUserProfile,
  uploadUserTemplate,
  extractSocialLinks,
} from '../api/client';
import { supabase } from '../lib/supabase';

const CANDIDATE_PROFILES = [
  {
    id: 'candidate_mohit',
    name: 'Mohit Prasad Upraity',
    role: 'Autonomous AI Engineer & System Architect',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Mohit',
    badge: 'AI Systems Specialist'
  },
  {
    id: 'candidate_krati',
    name: 'Krati Verma',
    role: 'Lead Frontend & Design System Architect',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Krati',
    badge: 'UI/UX Architect'
  },
  {
    id: 'candidate_vishnu',
    name: 'Vishnu Kumar',
    role: 'Senior Backend & API Engineer',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Vishnu',
    badge: 'Distributed Systems'
  }
];

export default function ProfilePage() {
  const [activeCandidateId, setActiveCandidateId] = useState('candidate_mohit');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    location: '',
    bio: '',
    linkedin_url: '',
    github_url: '',
    leetcode_url: '',
    portfolio_url: '',
    work_mode: 'Remote',
    target_roles: ['AI Engineer', 'Full Stack AI Developer'],
    location_preferences: ['Remote', 'Noida', 'Bangalore'],
    preferred_categories: ['job', 'internship', 'competition', 'hackathon'],
    min_compensation: '$120,000 / ₹25 LPA',
    notice_period: 'Immediate (0 Days)',
    active_template_id: 'candidate_mohit',
    resume_markdown: '',
    available_templates: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [newLocInput, setNewLocInput] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [authUser, setAuthUser] = useState(null);

  // 1. Supabase Auth Session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch active candidate profile
  const loadProfile = async (candidateId) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchUserProfile(candidateId);
      if (res?.profile) {
        setProfile(res.profile);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Could not load profile from Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile(activeCandidateId);
  }, [activeCandidateId]);

  // 3. Google OAuth Login
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/profile',
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google login error:', err);
      alert('Google Auth error: ' + (err.message || 'Please configure Google OAuth in Supabase dashboard.'));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
  };

  // 4. Save Profile Changes
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updateUserProfile({
        ...profile,
        candidate_id: activeCandidateId,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to save changes. Please check backend connection.');
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Upload Base Golden Template Resume
  const handleTemplateUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const res = await uploadUserTemplate(file, activeCandidateId);
      if (res.status === 'success') {
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 4000);

        // Update state with newly extracted fields
        setProfile((prev) => ({
          ...prev,
          resume_markdown: res.resume_markdown,
          linkedin_url: res.extracted?.linkedin_url || prev.linkedin_url,
          github_url: res.extracted?.github_url || prev.github_url,
          leetcode_url: res.extracted?.leetcode_url || prev.leetcode_url,
          portfolio_url: res.extracted?.portfolio_url || prev.portfolio_url,
          email: res.extracted?.email || prev.email,
          phone: res.extracted?.phone || prev.phone,
        }));
      }
    } catch (err) {
      console.error('Upload template failed:', err);
      setError('Failed to upload and parse template with Docling OCR: ' + (err.message || ''));
    } finally {
      setIsUploading(false);
    }
  };

  // 6. Handle Role & Location Chips
  const handleAddRole = (e) => {
    e.preventDefault();
    if (!newRoleInput.trim()) return;
    if (!profile.target_roles.includes(newRoleInput.trim())) {
      setProfile((prev) => ({
        ...prev,
        target_roles: [...prev.target_roles, newRoleInput.trim()]
      }));
    }
    setNewRoleInput('');
  };

  const handleRemoveRole = (roleToRemove) => {
    setProfile((prev) => ({
      ...prev,
      target_roles: prev.target_roles.filter((r) => r !== roleToRemove)
    }));
  };

  const handleAddLocation = (e) => {
    e.preventDefault();
    if (!newLocInput.trim()) return;
    if (!profile.location_preferences.includes(newLocInput.trim())) {
      setProfile((prev) => ({
        ...prev,
        location_preferences: [...prev.location_preferences, newLocInput.trim()]
      }));
    }
    setNewLocInput('');
  };

  const handleRemoveLocation = (locToRemove) => {
    setProfile((prev) => ({
      ...prev,
      location_preferences: prev.location_preferences.filter((l) => l !== locToRemove)
    }));
  };

  const toggleCategory = (catKey) => {
    setProfile((prev) => {
      const exists = prev.preferred_categories?.includes(catKey);
      return {
        ...prev,
        preferred_categories: exists
          ? prev.preferred_categories.filter((c) => c !== catKey)
          : [...(prev.preferred_categories || []), catKey]
      };
    });
  };

  return (
    <PageShell
      title="User Profile & Template Preferences"
      subtitle="Google OAuth, Docling OCR golden resume preservation, social links hub & granular search tweaks"
      icon={User}
    >
      <div className="space-y-8 max-w-7xl mx-auto pb-12">

        {/* ── Top Header & Candidate Switcher ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-xl">
          <div className="lg:col-span-2 flex flex-col md:flex-row items-center gap-5">
            <div className="relative">
              <img
                src={authUser?.user_metadata?.avatar_url || profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=User'}
                alt="Avatar"
                className="w-20 h-20 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500/30 p-1 shadow-lg object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div className="space-y-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h2 className="text-2xl font-bold text-slate-100">{profile.name || 'Candidate Name'}</h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Supabase Verified
                </span>
              </div>
              <p className="text-sm text-slate-400">{profile.role || 'Autonomous Systems Engineer'}</p>
              <div className="flex items-center justify-center md:justify-start gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" />{profile.location || 'Noida, India'}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" />{profile.email || 'user@careeros.ai'}</span>
              </div>
            </div>
          </div>

          {/* Google Auth / Candidate Switcher Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center lg:items-end">
            {authUser ? (
              <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-200">{authUser.email}</div>
                  <div className="text-[10px] text-emerald-400">Signed in via Google</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-md transition-all active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sign in with Google
              </button>
            )}

            {/* Quick-Switch Candidate Profile Selector */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-500 pl-2">Profile:</span>
              {CANDIDATE_PROFILES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCandidateId(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeCandidateId === c.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Status Banners ─────────────────────────────────────────────── */}
        {saveSuccess && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Profile and search preferences saved to Supabase! All future Auto-Pilot runs will use these preferences.</span>
          </div>
        )}
        {uploadSuccess && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm animate-fade-in">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <span>Resume parsed via Docling OCR! Original template structure preserved and social links auto-extracted.</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left 2 Columns: Editable Personal & Social & Tweaks ─────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* 1. Basic Info & Role */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 space-y-5">
              <div className="flex items-center gap-2.5 text-slate-100 font-semibold text-base border-b border-slate-800 pb-3">
                <User className="w-5 h-5 text-indigo-400" />
                <span>Personal & Contact Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={profile.name || ''}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    placeholder="e.g. Mohit Prasad Upraity"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Primary Role / Title</label>
                  <input
                    type="text"
                    value={profile.role || ''}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    placeholder="e.g. Autonomous AI Engineer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    placeholder="e.g. mohit@careeros.ai"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    placeholder="e.g. +91-9876543210"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Primary Location</label>
                  <input
                    type="text"
                    value={profile.location || ''}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    placeholder="e.g. Noida, Uttar Pradesh, India"
                  />
                </div>
              </div>
            </div>

            {/* 2. Extracted Social & Portfolio Hub */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5 text-slate-100 font-semibold text-base">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <span>Social Profiles & Coding Portfolios</span>
                </div>
                <span className="text-xs text-slate-400">Auto-extracted via Docling</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
                    <LinkedinIcon className="w-3.5 h-3.5 text-blue-400" /> LinkedIn Profile
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={profile.linkedin_url || ''}
                      onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                      placeholder="https://linkedin.com/in/username"
                    />
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="absolute right-3 top-3 text-slate-500 hover:text-cyan-400">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
                    <GithubIcon className="w-3.5 h-3.5 text-purple-400" /> GitHub Profile
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={profile.github_url || ''}
                      onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                      placeholder="https://github.com/username"
                    />
                    {profile.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noreferrer" className="absolute right-3 top-3 text-slate-500 hover:text-purple-400">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
                    <Code2 className="w-3.5 h-3.5 text-amber-400" /> LeetCode / Coding Platform
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={profile.leetcode_url || ''}
                      onChange={(e) => setProfile({ ...profile, leetcode_url: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                      placeholder="https://leetcode.com/u/username"
                    />
                    {profile.leetcode_url && (
                      <a href={profile.leetcode_url} target="_blank" rel="noreferrer" className="absolute right-3 top-3 text-slate-500 hover:text-amber-400">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" /> Personal Portfolio / Website
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={profile.portfolio_url || ''}
                      onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                      placeholder="https://yourportfolio.dev"
                    />
                    {profile.portfolio_url && (
                      <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="absolute right-3 top-3 text-slate-500 hover:text-emerald-400">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Granular Career Tweaks & Opportunity Preferences */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 space-y-5">
              <div className="flex items-center gap-2.5 text-slate-100 font-semibold text-base border-b border-slate-800 pb-3">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>Career Search Tweaks & RAG Preferences</span>
              </div>

              {/* Work Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Work Mode Preference</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {['Remote', 'Hybrid', 'Onsite', 'Open to Any'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setProfile({ ...profile, work_mode: mode })}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        profile.work_mode === mode
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Opportunity Types */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Preferred Opportunity Types</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'job', label: 'Full-Time Jobs' },
                    { id: 'internship', label: 'Internships' },
                    { id: 'competition', label: 'Hackathons & Competitions' },
                    { id: 'conclave', label: 'Tech Conclaves & Grants' },
                  ].map((cat) => {
                    const isSelected = profile.preferred_categories?.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Roles Tag Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Target Roles & Job Titles</label>
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {(profile.target_roles || []).map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700"
                    >
                      <span>{role}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(role)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAddRole} className="flex gap-2">
                  <input
                    type="text"
                    value={newRoleInput}
                    onChange={(e) => setNewRoleInput(e.target.value)}
                    placeholder="Add target role (e.g. AI Systems Architect) and press Enter"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* Compensation & Notice Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Desired Compensation / Stipend
                  </label>
                  <input
                    type="text"
                    value={profile.min_compensation || ''}
                    onChange={(e) => setProfile({ ...profile, min_compensation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. $120,000 / ₹25 LPA"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Notice Period / Availability
                  </label>
                  <input
                    type="text"
                    value={profile.notice_period || ''}
                    onChange={(e) => setProfile({ ...profile, notice_period: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Immediate (0 Days)"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Profile Changes</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* ── Right Column: Golden Template Upload & Preservation ────────── */}
          <div className="space-y-6">

            {/* 1. Upload Golden Resume Template */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2 text-slate-100 font-semibold text-base border-b border-slate-800 pb-3">
                <Upload className="w-5 h-5 text-indigo-400" />
                <span>Upload Golden Base Resume</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload your authentic PDF, DOCX, or scanned resume. <strong>Docling OCR</strong> will extract the layout, contact details, and sections to use as your preserved golden template for in-place tailoring.
              </p>

              <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl bg-slate-950/60 cursor-pointer transition group">
                <FileText className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition mb-2" />
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                  {isUploading ? 'Parsing via Docling OCR...' : 'Click or Drag PDF Resume here'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">PDF, DOCX, PNG (Max 15MB)</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.png,.jpg"
                  onChange={handleTemplateUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                    <span className="text-xs font-semibold text-indigo-300">Docling Multi-Modal OCR Active...</span>
                  </div>
                )}
              </label>
            </div>

            {/* 2. Preserved Template Switcher */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-100 font-semibold text-base">
                  <Layers className="w-5 h-5 text-purple-400" />
                  <span>Preserved Resume Templates</span>
                </div>
                <span className="text-xs font-semibold text-indigo-400">
                  {profile.available_templates?.length || 3} Available
                </span>
              </div>

              <div className="space-y-3">
                {(profile.available_templates || []).map((tpl) => {
                  const isActive = profile.active_template_id === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setProfile({ ...profile, active_template_id: tpl.id })}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isActive
                          ? 'bg-indigo-600/15 border-indigo-500 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-bold text-slate-200">{tpl.name}</div>
                        {isActive && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500 text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mb-2">{tpl.role}</div>
                      <div className="text-[10px] text-slate-500 font-mono bg-slate-900 p-2 rounded-lg truncate">
                        {tpl.preview}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Live Markdown Preview Modal / Expand */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Active Template Markdown</span>
                <span className="text-[10px] text-slate-500">{profile.resume_markdown?.length || 0} chars</span>
              </div>
              <div className="max-h-60 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                {profile.resume_markdown || 'No template loaded.'}
              </div>
            </div>

          </div>

        </div>

      </div>
    </PageShell>
  );
}
