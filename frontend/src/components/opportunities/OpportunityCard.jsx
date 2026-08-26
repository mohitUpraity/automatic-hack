import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Building2, ArrowRight, ExternalLink, Wand2, Sparkles } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import ScoreGauge from '../ui/ScoreGauge';

export default function OpportunityCard({ opportunity, onClick, candidateId = 'candidate_mohit' }) {
  const navigate = useNavigate();
  if (!opportunity) return null;

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
      <div className="flex justify-between items-start mb-3">
        <Badge variant={getCategoryBadgeVariant(opportunity.category)} size="sm">
          {opportunity.category?.toUpperCase() || 'OPPORTUNITY'}
        </Badge>
        {opportunity.matched_candidate_id && (
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            opportunity.matched_candidate_id === 'candidate_krati'
              ? 'text-pink-400 bg-pink-950/70 border-pink-500/40'
              : opportunity.matched_candidate_id === 'candidate_vishnu'
              ? 'text-emerald-400 bg-emerald-950/70 border-emerald-500/40'
              : 'text-indigo-400 bg-indigo-950/70 border-indigo-500/40'
          }`}>
            {opportunity.matched_candidate_id === 'candidate_krati' ? 'Krati' : opportunity.matched_candidate_id === 'candidate_vishnu' ? 'Vishnu' : 'Mohit'} Match
          </span>
        )}
      </div>

      <h3 className="text-base font-bold text-slate-100 mb-2.5 line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors">
        {opportunity.title}
      </h3>

      <div className="space-y-1.5 mb-4 flex-grow">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-500" />
          <span className="truncate">{opportunity.company || 'Tech Organization'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
          <span className="truncate">{opportunity.location || 'Noida, India / Remote'}</span>
        </div>
      </div>

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
