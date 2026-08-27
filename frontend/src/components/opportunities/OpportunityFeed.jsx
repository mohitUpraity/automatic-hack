import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, RefreshCw, Filter, Search, Zap, Sparkles, Trophy, Briefcase, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchOpportunities, scoutProfileOpportunities, fetchProfiles, customSearchOpportunities } from '../../api/client';
import OpportunityCard from './OpportunityCard';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import AutoPilotModal from '../autopilot/AutoPilotModal';

const CATEGORIES = ['All', 'Job', 'Internship', 'Hackathon', 'Competition', 'Conclave'];
const MIN_SCORES = [
  { label: 'All', value: 0 },
  { label: '80+', value: 80 },
  { label: '60+', value: 60 },
  { label: '40+', value: 40 }
];

export default function OpportunityFeed({ onSelectOpportunity }) {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScouting, setIsScouting] = useState(false);
  const [isAutoPilotOpen, setIsAutoPilotOpen] = useState(false);

  // Custom Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Filters
  const [category, setCategory] = useState('All');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('score'); // 'score' or 'recent'

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchOpportunities();
      setOpportunities(data?.opportunities || []);
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
      setOpportunities([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCustomSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const targetCat = category === 'All' ? 'all' : category.toLowerCase();
      const res = await customSearchOpportunities(searchQuery, targetCat);
      if (res.opportunities && res.opportunities.length > 0) {
        setOpportunities(res.opportunities);
      }
    } catch (err) {
      console.error('Custom search failed:', err);
      alert('Search failed: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleScout = async () => {
    setIsScouting(true);
    try {
      const profilesData = await fetchProfiles();
      const profiles = profilesData?.profiles || [];
      if (profiles.length > 0) {
        await scoutProfileOpportunities(profiles[0].id);
        await loadData();
      } else {
        setIsAutoPilotOpen(true);
      }
    } catch (err) {
      console.error('Scouting failed:', err);
    } finally {
      setIsScouting(false);
    }
  };

  const handleSelect = (opp) => {
    if (onSelectOpportunity) {
      onSelectOpportunity(opp);
    } else {
      navigate(`/opportunity/${opp.id}`);
    }
  };

  const filteredOpportunities = useMemo(() => {
    let result = opportunities.filter(opp => {
      const matchCat = category === 'All' || opp.category?.toLowerCase() === category.toLowerCase();
      const matchScore = (opp.relevance_score || 0) >= minScore;
      return matchCat && matchScore;
    });

    if (sortBy === 'score') {
      result.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    } else {
      result.sort((a, b) => (b.id > a.id ? 1 : -1));
    }
    return result;
  }, [opportunities, category, minScore, sortBy]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <Compass className="w-7 h-7 text-indigo-400" />
          </div>
          Discovered Opportunities
          <Badge variant="primary" className="ml-2">{filteredOpportunities.length}</Badge>
        </h2>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/studio')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Open Resume Studio</span>
          </button>
          
          <button
            onClick={() => setIsAutoPilotOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
          >
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>⚡ Launch Auto-Pilot</span>
          </button>
        </div>
      </div>

      {/* Live Web Search Bar */}
      <GlassCard className="p-3" padding="sm">
        <form onSubmit={handleCustomSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live jobs, hackathons, AI competitions (e.g. 'LLM Engineer Remote', 'Kaggle Hackathons 2026')..."
              className="w-full bg-slate-950/80 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
          >
            {isSearching ? <LoadingSpinner size="sm" /> : <Search className="w-3.5 h-3.5" />}
            <span>Scout Live Web</span>
          </button>
        </form>
      </GlassCard>

      {/* Category & Score Filters */}
      <GlassCard className="p-1">
        <div className="p-3 border-b border-slate-800/50 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  category === cat 
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 font-bold' 
                    : 'bg-slate-900/50 text-slate-400 border border-transparent hover:bg-slate-800'
                }`}
              >
                {cat === 'All' && '🔥 All'}
                {cat === 'Job' && '💼 Jobs'}
                {cat === 'Internship' && '🧭 Internships'}
                {cat === 'Hackathon' && '⚡ Hackathons'}
                {cat === 'Competition' && '🏆 Competitions'}
                {cat === 'Conclave' && '🎤 Conclaves'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-3 flex flex-wrap gap-4 items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Min Fit Score:
            </span>
            <div className="flex bg-slate-900/50 p-0.5 rounded-lg border border-slate-700/50">
              {MIN_SCORES.map(score => (
                <button
                  key={score.label}
                  onClick={() => setMinScore(score.value)}
                  className={`px-2.5 py-1 rounded-md transition-colors text-xs ${
                    minScore === score.value ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {score.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="score">Fit Relevance Score</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <GlassCard key={i} className="h-48 animate-pulse flex flex-col p-6">
              <div className="w-20 h-6 bg-slate-800 rounded-full mb-4"></div>
              <div className="w-3/4 h-6 bg-slate-800 rounded mb-2"></div>
              <div className="w-1/2 h-4 bg-slate-800 rounded mb-auto"></div>
              <div className="w-full h-10 bg-slate-800/50 rounded mt-4"></div>
            </GlassCard>
          ))}
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="border-2 border-dashed border-slate-700/50 rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <Compass className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-300 font-bold text-base mb-1">No opportunities found in this filter.</p>
          <p className="text-slate-500 text-xs mb-4">Use the Auto-Pilot or Scout Live Web bar to discover new jobs and hackathons.</p>
          <button
            onClick={() => setIsAutoPilotOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Launch Auto-Pilot
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredOpportunities.map((opp, idx) => (
              <motion.div
                key={opp.id || `opp-${idx}-${opp.title || ''}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <OpportunityCard opportunity={opp} onClick={handleSelect} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Auto-Pilot Modal */}
      <AutoPilotModal
        isOpen={isAutoPilotOpen}
        onClose={() => setIsAutoPilotOpen(false)}
        onComplete={() => loadData()}
      />
    </div>
  );
}

