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
  LogOut,
  RefreshCw,
  Eye,
  Trash2
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
  deleteCandidate,
  setActiveCandidateTemplate,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, selectedCandidateId, setSelectedCandidateId, activeCandidate, candidates, refreshCandidates, logout } = useAuth();
  const navigate = useNavigate();

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
    target_roles: [],
    location_preferences: ['Remote'],
    preferred_categories: ['job', 'internship', 'hackathon'],
    min_compensation: 'Flexible',
    notice_period: 'Immediate',
    active_template_id: '',
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

  // Fetch active candidate persona profile
  const loadProfile = async () => {
    const targetId = selectedCandidateId === 'all' ? (user?.id || 'default-user') : selectedCandidateId;
    if (!targetId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchUserProfile(targetId);
      if (res?.profile) {
        setProfile({
          ...res.profile,
          name: res.profile.name || activeCandidate?.name || user?.name || '',
          email: res.profile.email || activeCandidate?.email || user?.email || '',
          role: res.profile.role || activeCandidate?.role || user?.role || 'Software Engineer'
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Could not load profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id, selectedCandidateId]);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  // Save Profile Changes
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);
    const targetId = selectedCandidateId === 'all' ? (user?.id || 'default-user') : selectedCandidateId;
    try {
      await updateUserProfile({
        ...profile,
        user_id: user?.id || 'default-user',
        candidate_id: targetId,
      });
      await refreshCandidates(user?.id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to save changes. Please check database connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePersona = async () => {
    const targetId = selectedCandidateId === 'all' ? (user?.id || 'default-user') : selectedCandidateId;
    const personaName = profile.name || activeCandidate?.name || 'this persona';
    if (!window.confirm(`Are you sure you want to permanently delete candidate persona "${personaName}"? This will remove their profile and linked knowledge records.`)) {
      return;
    }
    setIsSaving(true);
    try {
      await deleteCandidate(targetId);
      if (refreshCandidates) await refreshCandidates(user?.id);
      setSelectedCandidateId('all');
    } catch (err) {
      console.error('Delete persona failed:', err);
      setError('Failed to delete persona: ' + (err.message || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Upload Base Golden Template Resume
  const handleTemplateUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    const targetId = selectedCandidateId === 'all' ? (user?.id || 'default-user') : selectedCandidateId;
    try {
      const res = await uploadUserTemplate(file, targetId);
      if (res?.status === 'success') {
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 4000);
        await refreshCandidates(user?.id);
        await loadProfile();
      }
    } catch (err) {
      console.error('Upload template failed:', err);
      setError('Failed to upload and parse template with Docling OCR: ' + (err.message || ''));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectTemplate = async (tpl) => {
    const targetId = selectedCandidateId === 'all' ? (user?.id || 'default-user') : selectedCandidateId;
    setProfile((prev) => ({
      ...prev,
      active_template_id: tpl.id,
      resume_markdown: tpl.raw_markdown || prev.resume_markdown,
    }));
    try {
      await setActiveCandidateTemplate(targetId, tpl.id);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      if (refreshCandidates) await refreshCandidates(user?.id);
    } catch (err) {
      console.error('Failed to set active template:', err);
      setError('Failed to activate template: ' + (err.message || 'Server error'));
    }
  };

  const handleAddRole = (e) => {
    e.preventDefault();
    if (!newRoleInput.trim()) return;
    const current = profile.target_roles || [];
    if (!current.includes(newRoleInput.trim())) {
      setProfile({ ...profile, target_roles: [...current, newRoleInput.trim()] });
    }
    setNewRoleInput('');
  };

  const handleRemoveRole = (roleToRemove) => {
    const current = profile.target_roles || [];
    setProfile({ ...profile, target_roles: current.filter((r) => r !== roleToRemove) });
  };

  const toggleCategory = (catId) => {
    const current = profile.preferred_categories || [];
    if (current.includes(catId)) {
      setProfile({ ...profile, preferred_categories: current.filter((c) => c !== catId) });
    } else {
      setProfile({ ...profile, preferred_categories: [...current, catId] });
    }
  };

  const toggleLocation = (loc) => {
    const current = profile.location_preferences || [];
    if (current.includes(loc)) {
      setProfile({ ...profile, location_preferences: current.filter((l) => l !== loc) });
    } else {
      setProfile({ ...profile, location_preferences: [...current, loc] });
    }
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return 'U';
    return nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <PageShell
      title="Candidate Persona & Profile"
      description="Manage multi-candidate preferences, target roles, contact coordinates, and Golden Resume templates."
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6 max-w-5xl pb-12">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
              {getInitials(profile.name || user?.name)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">{profile.name || user?.name || 'Candidate Persona'}</h2>
              <p className="text-sm text-indigo-400 font-medium">{profile.role || 'Software Engineer'}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <span>{profile.email || user?.email || 'authenticated'}</span>
                <span>•</span>
                <span>{profile.location || 'Remote'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[200px]">
              <select
                value={selectedCandidateId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCandidateId(val);
                }}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-extrabold focus:outline-none focus:border-indigo-500 appearance-none pr-8 cursor-pointer shadow-inner"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.role ? `(${c.role.split('|')[0].trim()})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleDeletePersona}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold border border-red-800/80 transition cursor-pointer disabled:opacity-50"
              title="Delete this Candidate Persona"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Delete Persona</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {saveSuccess && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Profile and search preferences saved! All future searches will use these preferences.</span>
          </div>
        )}
        {uploadSuccess && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm animate-fade-in">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <span>Resume parsed via Docling OCR! Template structure preserved and links auto-extracted.</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Columns: Editable Info */}
          <div className="lg:col-span-2 space-y-8">

            {/* 1. Basic Info */}
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
                    placeholder="Your Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Primary Role / Title</label>
                  <input
                    type="text"
                    value={profile.role || ''}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    placeholder="e.g. Full Stack Engineer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    placeholder="name@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    placeholder="+1 555-0199"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Primary Location</label>
                  <input
                    type="text"
                    value={profile.location || ''}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                    placeholder="e.g. San Francisco, CA / Remote"
                  />
                </div>
              </div>
            </div>

            {/* 2. Social Portfolios */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 space-y-5">
              <div className="flex items-center gap-2.5 text-slate-100 font-semibold text-base border-b border-slate-800 pb-3">
                <Code2 className="w-5 h-5 text-cyan-400" />
                <span>Social Profiles & Coding Portfolios</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
                    <LinkedinIcon className="w-3.5 h-3.5 text-blue-400" /> LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    value={profile.linkedin_url || ''}
                    onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
                    <GithubIcon className="w-3.5 h-3.5 text-slate-300" /> GitHub Profile
                  </label>
                  <input
                    type="url"
                    value={profile.github_url || ''}
                    onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                    placeholder="https://github.com/username"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" /> Portfolio / Website
                  </label>
                  <input
                    type="url"
                    value={profile.portfolio_url || ''}
                    onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                    placeholder="https://yourportfolio.dev"
                  />
                </div>
              </div>
            </div>

            {/* 3. Search Preferences */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 space-y-5">
              <div className="flex items-center gap-2.5 text-slate-100 font-semibold text-base border-b border-slate-800 pb-3">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>Career Search Tweaks & RAG Preferences</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Work Mode Preference</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {['Remote', 'Hybrid', 'Onsite', 'Open to Any'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setProfile({ ...profile, work_mode: mode })}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
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
                        className="text-slate-400 hover:text-rose-400 cursor-pointer"
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
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
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

          {/* Right Column: Template Upload */}
          <div className="space-y-6">

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

            {/* Preserved Template Switcher */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-100 font-semibold text-base">
                  <Layers className="w-5 h-5 text-purple-400" />
                  <span>Preserved Resume Templates</span>
                </div>
                <span className="text-xs font-semibold text-indigo-400">
                  {profile.available_templates?.length || 0} Available
                </span>
              </div>

              <div className="space-y-3">
                {(profile.available_templates || []).length > 0 ? (
                  profile.available_templates.map((tpl) => {
                    const isActive = tpl.id === profile.active_template_id || tpl.is_active;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/15'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                            <span className="truncate max-w-[180px]">{tpl.name}</span>
                          </div>
                          {isActive ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Active Master
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-700">
                              Click to Set Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mb-2">{tpl.role}</div>
                        <div className="text-[10px] text-slate-500 font-mono bg-slate-900/80 p-2 rounded-lg truncate border border-slate-800/50">
                          {tpl.preview}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No custom resume uploaded yet. Upload your PDF resume above to establish your master template.
                  </div>
                )}
              </div>
            </div>

            {/* Live Markdown Preview */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Active Template Markdown</span>
                <span className="text-[10px] text-slate-500">{profile.resume_markdown?.length || 0} chars</span>
              </div>
              <div className="max-h-60 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                {profile.resume_markdown || 'No template loaded yet. Upload your resume above.'}
              </div>
            </div>

          </div>

        </div>

      </div>
    </PageShell>
  );
}
