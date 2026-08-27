import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Building2, ArrowRight, ExternalLink, Wand2, Sparkles, Clock, CheckCircle2, Target } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import ScoreGauge from '../ui/ScoreGauge';
import { useAuth } from '../../context/AuthContext';

export default function OpportunityCard({ opportunity, onClick, candidateId = 'candidate_mohit' }) {
  const navigate = useNavigate();
  const { candidates, activeCandidate } = useAuth();
  if (!opportunity) return null;

  const matchedCand = candidates?.find(c => c.id === opportunity.matched_candidate_id || c.user_id === opportunity.matched_candidate_id) || activeCandidate;
  const rawName = opportunity.matched_candidate_name || matchedCand?.name || 'Candidate';
  const firstName = rawName.split(' ')[0];
  const clusterColor = matchedCand?.cluster_color || '#818cf8';

  const getCategoryBadgeVariant = (category) => {
    switch (category?.toLowerCase()) {
      case 'job': return 'primary';
      case 'internship': return 'success';
      case 'hackathon': return 'warning';
      case 'competition': return 'danger';
      case 'conclave': return 'info';
      default: return 'secondary';
    }
  };

  const handleOpenInStudio = (e) => {
    e.stopPropagation();
    const cand = opportunity.matched_candidate_id || candidateId || 'candidate_mohit';
    navigate(`/studio?candidateId=${cand}&oppId=${opportunity.id}`);
  };

  return (
    <GlassCard 
      hover 
      onClick={() => onClick && onClick(opportunity)}
      className="cursor-pointer group flex flex-col h-full bg-slate-900/80 border border-slate-800/90 hover:border-indigo-500/40 transition-all shadow-lg"
      padding="md"
    >
      <div className="flex justify-between items-start mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant={getCategoryBadgeVariant(opportunity.category)} size="sm">
            {opportunity.category?.toUpperCase() || 'OPPORTUNITY'}
          </Badge>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {opportunity.application_status || 'Actively Hiring'}
          </span>
        </div>

        {firstName && (
          <span 
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
            style={{
              color: clusterColor,
              borderColor: `${clusterColor}50`,
              backgroundColor: `${clusterColor}18`
            }}
          >
            {firstName} Match
          </span>
        )}
      </div>

      <h3 className="text-base font-bold text-slate-100 mb-2.5 line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors">
        {opportunity.title}
      </h3>

      <div className="space-y-1.5 mb-3 flex-grow">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-500" />
          <span className="truncate">{opportunity.company || 'Tech Organization'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
          <span className="truncate">{opportunity.location || 'Noida, India / Remote'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span className="font-semibold text-amber-300/90 text-[11px]">
            Deadline: {opportunity.deadline || 'Open / Rolling'}
          </span>
        </div>
      </div>

      {/* Candidate Interest Alignment Pill */}
      {opportunity.interest_alignment && (
        <div className="mb-3.5 p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-start gap-1.5">
          <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span className="text-[10px] text-slate-300 leading-tight">
            <span className="font-bold text-cyan-400">Aligned Interest: </span>
            {opportunity.interest_alignment}
          </span>
        </div>
      )}

      {/* Action Strip */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-auto gap-2">
        <div className="flex items-center gap-2">
          <ScoreGauge score={opportunity.relevance_score || 85} size={36} strokeWidth={3.5} />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-300">Vector Fit</span>
            {opportunity.semantic_cosine_similarity && (
              <span className="text-[9px] font-mono text-cyan-400 font-bold">
                cos: {opportunity.semantic_cosine_similarity}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {opportunity.url && (
            <a
              href={opportunity.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-colors"
              title="Direct Apply Link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={handleOpenInStudio}
            className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-[11px] rounded-lg shadow flex items-center gap-1 transition-all cursor-pointer"
            title="Open & Tailor Resume for this Role"
          >
            <Wand2 className="w-3 h-3" />
            Tailor
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
