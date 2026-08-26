import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, RefreshCw, Filter, Search, Zap, Sparkles, Trophy, Briefcase, Wand2, Users, ChevronDown, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchOpportunities, scoutProfileOpportunities, fetchProfiles, customSearchOpportunities } from '../../api/client';
import OpportunityCard from './OpportunityCard';
import OpportunityDetailModal from './OpportunityDetailModal';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import AutoPilotModal from '../autopilot/AutoPilotModal';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['All', 'Job', 'Internship', 'Hackathon', 'Competition', 'Conclave'];
const MIN_SCORES = [
  { label: 'All', value: 0 },
  { label: '90+', value: 90 },
  { label: '80+', value: 80 },
  { label: '60+', value: 60 },
];

export default function OpportunityFeed({ onSelectOpportunity }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScouting, setIsScouting] = useState(false);
  const [isAutoPilotOpen, setIsAutoPilotOpen] = useState(false);
  const [selectedOppForDetail, setSelectedOppForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Custom Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Filters
  const [category, setCategory] = useState('All');
  const [minScore, setMinScore] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchOpportunities(user?.id || 'default-user');
      setOpportunities(data?.opportunities || []);
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
      setOpportunities([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

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
      await scoutProfileOpportunities(user?.id || 'default-user');
      await loadData();
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
      setSelectedOppForDetail(opp);
      setIsDetailModalOpen(true);
    }
  };

  const filteredOpportunities = useMemo(() => {
    let result = opportunities.filter((opp) => {
      const matchCat = category === 'All' || opp.category?.toLowerCase() === category.toLowerCase();
      const matchScore = (opp.relevance_score || 0) >= minScore;
      const matchSearch =
        !searchQuery ||
        (opp.title && opp.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (opp.company && opp.company.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchScore && matchSearch;
    });

    return result;
  }, [opportunities, category, minScore, searchQuery]);

  return (
    <div className="w-full space-y-5">
      {/* Header & User Info Bar */}
      <GlassCard className="p-4 bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-600 flex items-center justify-center font-bold text-xs text-white shadow-inner">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
          </div>
          <div>
            <div className="text-xs font-extrabold text-white">{user?.name || 'My Scouted Opportunities'}</div>
            <div className="text-[10px] text-slate-400">Targeting {user?.role || 'Software Engineering'} roles</div>
          </div>
        </div>

        {/* Live Scout & AutoPilot Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAutoPilotOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Run Auto-Pilot
          </button>
          <button
            onClick={handleScout}
            disabled={isScouting}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScouting ? 'animate-spin' : ''}`} />
            {isScouting ? 'Scouting Web...' : 'Scout Opportunities'}
          </button>
        </div>
      </GlassCard>

      {/* Search Input Bar */}
      <form onSubmit={handleCustomSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by role, company, or skills (e.g. 'React Developer', 'DRDO AI', 'Hackathon 2026')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
        >
          <Search className="w-3.5 h-3.5" />
          Search
        </button>
      </form>

      {/* Categories & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-2 rounded-2xl border border-slate-800/60">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                category === cat
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Min Score Filter */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">Min Match:</span>
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {MIN_SCORES.map((s) => (
              <button
                key={s.label}
                onClick={() => setMinScore(s.value)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  minScore === s.value
                    ? 'bg-slate-800 text-emerald-400 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size="lg" text="Retrieving ranked opportunities from Career OS..." />
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center">
          <Compass className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-300 font-bold mb-1">No opportunities found</p>
          <p className="text-xs text-slate-500">Try changing your search keywords or click Scout Opportunities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onClick={handleSelect}
              candidateId={selectedCandidate === 'candidate_all' ? (opp.matched_candidate_id || 'candidate_mohit') : selectedCandidate}
            />
          ))}
        </div>
      )}

      {/* AutoPilot Modal */}
      <AutoPilotModal
        isOpen={isAutoPilotOpen}
        onClose={() => setIsAutoPilotOpen(false)}
        candidateId={selectedCandidate}
      />

      {/* Opportunity Detail Modal with Firecrawl Deep Company Intelligence */}
      <OpportunityDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        opportunity={selectedOppForDetail}
        candidateId={selectedCandidate === 'candidate_all' ? (selectedOppForDetail?.matched_candidate_id || 'candidate_mohit') : selectedCandidate}
      />
    </div>
  );
}
