import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Wand2, MapPin, Mail, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import UploadZone from '../components/documents/UploadZone';
import DocumentList from '../components/documents/DocumentList';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import { fetchCandidateDetails } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DocumentsPage() {
  const { user, selectedCandidateId, setSelectedCandidateId, activeCandidate, candidates } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const formatRole = (role) => {
    if (!role) return '';
    const clean = role.split(' at ')[0].split('(')[0].split('|')[0].trim();
    return clean.length > 28 ? clean.slice(0, 26) + '...' : clean;
  };

  const displayName = selectedCandidateId === 'all' 
    ? 'All Candidate Personas (Combined View)' 
    : (activeCandidate?.name || user?.name || 'Engineer');

  const displayRole = selectedCandidateId === 'all'
    ? `${candidates.length} Registered Candidate Personas`
    : (formatRole(activeCandidate?.role) || user?.role || 'Software Engineer');

  return (
    <PageShell
      title="Candidate Documents & Master Stencils"
      subtitle="OCR document ingestion, vector provenance & master resume management"
      icon={FileText}
    >
      <div className="space-y-6 animate-fade-in">
        {/* User Identity Highlight Card */}
        <GlassCard className="p-5 bg-slate-900/80 border border-indigo-500/30 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0 max-w-full">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-inner shrink-0"
              style={{ backgroundColor: activeCandidate?.cluster_color || '#6366f1' }}
            >
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-extrabold text-white truncate max-w-[280px] sm:max-w-md">{displayName}</h3>
                <Badge variant="primary" size="sm">{displayRole}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {activeCandidate?.location || 'Remote'}</span>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {activeCandidate?.email || user?.email}</span>
              </div>
              {activeCandidate?.top_skills && activeCandidate.top_skills.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Skills Extracted:</span>
                  {activeCandidate.top_skills.map((sk) => (
                    <span key={sk} className="text-[10px] font-bold bg-slate-950 text-indigo-300 px-2 py-0.5 rounded-md border border-slate-800">
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
            <div className="relative w-full sm:w-64 max-w-full">
              <select
                value={selectedCandidateId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCandidateId(val);
                }}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-extrabold focus:outline-none focus:border-indigo-500 appearance-none pr-8 cursor-pointer shadow-inner truncate"
              >
                <option value="all">🌐 All Candidates (Combined View)</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.role ? `(${formatRole(c.role)})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => navigate('/studio')}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              Tailor in Resume Studio
            </button>
          </div>
        </GlassCard>

        {/* Upload Zone */}
        <UploadZone
          onUploadSuccess={handleUploadSuccess}
          onPipelineComplete={handleUploadSuccess}
        />

        {/* Ingested Documents List with Delete Action */}
        <DocumentList 
          refreshTrigger={refreshTrigger} 
          selectedCandidateId={selectedCandidateId} 
        />
      </div>
    </PageShell>
  );
}
