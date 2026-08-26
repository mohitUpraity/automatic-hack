import { MapPin, Building2, ArrowRight } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import ScoreGauge from '../ui/ScoreGauge';

export default function OpportunityCard({ opportunity, onClick }) {
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

  return (
    <GlassCard 
      hover 
      onClick={() => onClick && onClick(opportunity)}
      className="cursor-pointer group flex flex-col h-full"
      padding="md"
    >
      <div className="flex justify-between items-start mb-4">
        <Badge variant={getCategoryBadgeVariant(opportunity.category)} size="sm">
          {opportunity.category || 'Opportunity'}
        </Badge>
      </div>

      <h3 className="text-lg font-bold text-slate-100 mb-3 line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">
        {opportunity.title}
      </h3>

      <div className="space-y-2 mb-6 flex-grow">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Building2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{opportunity.company}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="truncate">{opportunity.location || 'Remote / Unknown'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 mt-auto">
        <div className="flex items-center gap-3">
          <ScoreGauge score={opportunity.relevance_score || 0} size={40} strokeWidth={4} />
          <span className="text-xs font-medium text-slate-400">Match</span>
        </div>
        
        <div className="flex items-center gap-1 text-sm font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
          View Details <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </GlassCard>
  );
}
