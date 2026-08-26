import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, ChevronDown, Wand2, MapPin, Mail, Sparkles, ShieldCheck, CheckCircle2, Award, Briefcase, Trash2 } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import UploadZone from '../components/documents/UploadZone';
import DocumentList from '../components/documents/DocumentList';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import { fetchCandidates, fetchCandidateDetails } from '../api/client';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [candidatesList, setCandidatesList] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('candidate_mohit');
  const [activeCandidate, setActiveCandidate] = useState(null);

  useEffect(() => {
    async function loadCandidates() {
      try {
        const cRes = await fetchCandidates();
        if (cRes.candidates && cRes.candidates.length > 0) {
          const valid = cRes.candidates.filter(c => c.id !== 'candidate_all');
          setCandidatesList(valid);
        }
      } catch (err) {
        console.error('Failed to load candidate list:', err);
      }
    }
    loadCandidates();
  }, []);

  useEffect(() => {
    async function loadCandidate() {
      if (selectedCandidateId) {
        try {
          const res = await fetchCandidateDetails(selectedCandidateId);
          if (res.candidate) setActiveCandidate(res.candidate);
        } catch (err) {
          console.error('Failed to load candidate details:', err);
        }
      }
    }
    loadCandidate();
  }, [selectedCandidateId]);

  const handleUploadSuccess = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <PageShell
      title="Candidate Documents & Master Stencils"
      subtitle="Multi-candidate OCR document ingestion, vector provenance & master resume management"
      icon={FileText}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Candidate Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
          {candidatesList.map((c) => {
            const isSelected = selectedCandidateId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCandidateId(c.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{c.name}</span>
                <span className="text-[10px] opacity-80 font-normal">({c.role?.split('|')[0].trim()})</span>
              </button>
            );
          })}
        </div>

        {/* Candidate Stencil Highlight Card */}
        {activeCandidate && (
          <GlassCard className="p-5 bg-slate-900/80 border border-indigo-500/30 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center font-black text-base text-indigo-400 shadow-inner">
                {activeCandidate.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-extrabold text-white">{activeCandidate.name}</h3>
                  <Badge variant="primary" size="sm">{activeCandidate.role}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {activeCandidate.location}</span>
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {activeCandidate.email}</span>
                </div>
                <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Top Skills:</span>
                  {(activeCandidate.top_skills || []).map((sk) => (
                    <span key={sk} className="text-[10px] font-bold bg-slate-950 text-indigo-300 px-2 py-0.5 rounded-md border border-slate-800">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
              <button
                onClick={() => navigate(`/studio?candidateId=${selectedCandidateId}`)}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Wand2 className="w-4 h-4" />
                Tailor in Resume Studio
              </button>
            </div>
          </GlassCard>
        )}

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
