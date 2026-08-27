import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, UserPlus, Check, ChevronDown, Trash2, Upload, Sparkles, X, FileText } from 'lucide-react';
import { uploadDocument } from '../../api/client';

export default function CandidateSelector({ compact = false }) {
  const { 
    user, 
    candidates, 
    selectedCandidateId, 
    setSelectedCandidateId, 
    activeCandidate, 
    addCandidatePersona, 
    removeCandidatePersona,
    refreshCandidates
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newPersona, setNewPersona] = useState({
    name: '',
    role: 'Software Engineer',
    email: '',
    phone: '',
    location: 'Remote',
    bio: '',
    skills: 'Python, JavaScript, Full Stack Development'
  });
  const fileInputRef = useRef(null);

  const handleCreatePersona = async (e) => {
    e.preventDefault();
    if (!newPersona.name.trim()) return;

    const skillsArray = newPersona.skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    await addCandidatePersona({
      name: newPersona.name.trim(),
      role: newPersona.role.trim() || 'Software Engineer',
      email: newPersona.email.trim() || `${newPersona.name.toLowerCase().replace(/\s+/g, '.')}@careeros.ai`,
      phone: newPersona.phone.trim() || '',
      location: newPersona.location.trim() || 'Remote',
      bio: newPersona.bio.trim(),
      skills: skillsArray
    });

    setShowModal(false);
    setNewPersona({
      name: '',
      role: 'Software Engineer',
      email: '',
      phone: '',
      location: 'Remote',
      bio: '',
      skills: 'Python, JavaScript, Full Stack Development'
    });
  };

  const handleDirectResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadDocument(file, 'resume', user?.id, null, true);
      await refreshCandidates(user?.id);
      setShowModal(false);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const getPersonaLabel = () => {
    if (selectedCandidateId === 'all') {
      return {
        name: 'All Candidates (Multi-View)',
        role: `${candidates.length} Candidate Personas`,
        color: '#6366f1',
        isAll: true
      };
    }
    const formatRole = (r) => {
      if (!r) return 'Software Engineer';
      const clean = r.split(' at ')[0].split('(')[0].split('|')[0].trim();
      return clean.length > 25 ? clean.slice(0, 23) + '...' : clean;
    };

    if (activeCandidate) {
      return {
        name: activeCandidate.name,
        role: formatRole(activeCandidate.role),
        color: activeCandidate.cluster_color || '#38bdf8',
        isAll: false
      };
    }
    return {
      name: user?.name || 'Primary Profile',
      role: formatRole(user?.role),
      color: '#38bdf8',
      isAll: false
    };
  };

  const current = getPersonaLabel();

  return (
    <div className="relative">
      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? 'bg-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
            : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 text-left">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-inner"
            style={{ backgroundColor: current.color }}
          >
            {current.isAll ? <Users className="w-4 h-4" /> : current.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100 truncate">{current.name}</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">{current.role}</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-950/95 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 border-b border-slate-800/60 pb-1.5 mb-1">
              <span>Candidate Personas</span>
              <span className="font-mono text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-indigo-300">
                {candidates.length} Available
              </span>
            </div>

            {/* Option: Multi-Candidate / All */}
            <button
              type="button"
              onClick={() => {
                setSelectedCandidateId('all');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                selectedCandidateId === 'all'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-100 truncate">All Candidates</p>
                  <p className="text-[10px] text-slate-400 truncate">Combined multi-persona database</p>
                </div>
              </div>
              {selectedCandidateId === 'all' && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
            </button>

            {/* Candidates List */}
            <div className="max-h-56 overflow-y-auto space-y-1 py-0.5 pr-1">
              {candidates.map((cand) => {
                const isSelected = selectedCandidateId === cand.id;
                return (
                  <div
                    key={cand.id}
                    className={`group flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCandidateId(cand.id);
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer text-left"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: cand.cluster_color || '#38bdf8' }}
                      >
                        {cand.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-100 truncate">{cand.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{cand.role}</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0 ml-1.5">
                      {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                      {!cand.is_primary && candidates.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete candidate persona "${cand.name}"?`)) {
                              removeCandidatePersona(cand.id);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete Persona"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Persona Action */}
            <div className="pt-1.5 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowModal(true);
                }}
                className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 hover:from-indigo-600/40 hover:to-cyan-600/40 border border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Candidate Persona</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal: Add New Candidate Persona */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Candidate Persona</h3>
                  <p className="text-xs text-slate-400">Add a new user persona with isolated resume & knowledge</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Option A: Quick Upload Resume */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/30 text-center space-y-2.5">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Instant AI Resume Ingestion
                </div>
                <p className="text-xs text-slate-400">
                  Upload a PDF/DOCX resume to automatically extract skills, projects, and create this persona in 1-click.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleDirectResumeUpload}
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Extracting via Docling OCR...' : 'Upload & Auto-Create Persona'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-slate-500 text-xs">
                <div className="flex-1 h-px bg-slate-800" />
                <span>OR FILL IN MANUALLY</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Option B: Manual Form */}
              <form onSubmit={handleCreatePersona} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Candidate Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={newPersona.name}
                      onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Backend Engineer"
                      value={newPersona.role}
                      onChange={(e) => setNewPersona({ ...newPersona, role: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="alex.morgan@careeros.ai"
                      value={newPersona.email}
                      onChange={(e) => setNewPersona({ ...newPersona, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Location Preference</label>
                    <input
                      type="text"
                      placeholder="Remote / Bangalore"
                      value={newPersona.location}
                      onChange={(e) => setNewPersona({ ...newPersona, location: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Core Skills (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Python, FastAPI, Docker, PostgreSQL, Microservices"
                    value={newPersona.skills}
                    onChange={(e) => setNewPersona({ ...newPersona, skills: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Professional Bio / Summary</label>
                  <textarea
                    rows={2}
                    placeholder="Brief career highlight or focus area..."
                    value={newPersona.bio}
                    onChange={(e) => setNewPersona({ ...newPersona, bio: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    Save Persona to Supabase
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
