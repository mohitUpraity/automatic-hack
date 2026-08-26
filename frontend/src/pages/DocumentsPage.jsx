import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, ChevronDown, Wand2, MapPin, Mail, Sparkles, ShieldCheck } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import UploadZone from '../components/documents/UploadZone';
import DocumentList from '../components/documents/DocumentList';
import OpportunityFeed from '../components/opportunities/OpportunityFeed';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import { fetchCandidates, fetchCandidateDetails } from '../api/client';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [candidatesList, setCandidatesList] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('candidate_all');
  const [activeCandidate, setActiveCandidate] = useState(null);

  useEffect(() => {
    async function loadCandidates() {
      try {
        const cRes = await fetchCandidates();
        if (cRes.candidates && cRes.candidates.length > 0) {
          setCandidatesList(cRes.candidates);
        }
      } catch (err) {
        console.error('Failed to load candidate list:', err);
      }
    }
    loadCandidates();
  }, []);

  useEffect(() => {
    async function loadCandidate() {
      if (selectedCandidateId !== 'candidate_all') {
        try {
          const res = await fetchCandidateDetails(selectedCandidateId);
          if (res.candidate) setActiveCandidate(res.candidate);
        } catch (err) {
          console.error('Failed to load candidate details:', err);
        }
      } else {
        setActiveCandidate(null);
      }
    }
    loadCandidate();
  }, [selectedCandidateId]);

  const handleUploadSuccess = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <PageShell
      title="Documents & Discovered Opportunities"
      subtitle="Multi-candidate document ingestion, OCR embedding provenance & career discovery"
      icon={FileText}
    >
      <div className="space-y-6">
        {/* Candidate Switcher Header Bar */}
        <GlassCard className="p-4 bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Active Candidate Context:</span>
            </div>
            <div className="relative min-w-[260px]">
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold appearance-none pr-8 cursor-pointer shadow-inner"
              >
                {candidatesList.length === 0 ? (
                  <option value="candidate_all">🌐 Multi-Candidate Global Network</option>
                ) : (
                  candidatesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.role ? `(${c.role.split('|')[0].trim()})` : ''}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/studio?candidateId=${selectedCandidateId === 'candidate_all' ? 'candidate_mohit' : selectedCandidateId}`)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              Open in AI Resume Studio
            </button>
          </div>
        </GlassCard>

        {/* Candidate Detail Strip if Single Candidate is Selected */}
        {activeCandidate && (
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-indigo-400">
                {activeCandidate.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{activeCandidate.name}</h3>
                  <Badge variant="primary" size="sm">{activeCandidate.role?.split('|')[0].trim()}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" /> {activeCandidate.location || 'Noida, India'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-500" /> {activeCandidate.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Verified Resume:</span>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                {activeCandidate.doc_name || 'Resume.pdf'}
              </span>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <UploadZone
          onUploadSuccess={handleUploadSuccess}
          onPipelineComplete={handleUploadSuccess}
        />

        {/* Split View: Documents + Filtered Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DocumentList refreshTrigger={refreshTrigger} />
          <OpportunityFeed initialCandidateId={selectedCandidateId} />
        </div>
      </div>
    </PageShell>
  );
}
