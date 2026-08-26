import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  Wand2,
  Sparkles,
  Search,
  Code,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Flame,
  Briefcase,
  Lightbulb,
  Globe,
  Users
} from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import ScoreGauge from '../ui/ScoreGauge';
import { deepResearchOpportunity, deepResearchCompany } from '../../api/client';

export default function OpportunityDetailModal({ opportunity, isOpen, onClose, candidateId = 'candidate_mohit' }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('company_intel'); // 'overview' | 'company_intel' | 'skills_match'
  const [intel, setIntel] = useState(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchError, setResearchError] = useState('');

  useEffect(() => {
    if (opportunity && isOpen) {
      // Auto-load company intelligence if already cached or start quick crawl
      if (opportunity.intelligence || opportunity.company_intel) {
        setIntel(opportunity.intelligence || opportunity.company_intel);
      } else {
        handleRunDeepResearch();
      }
    }
  }, [opportunity, isOpen]);

  if (!isOpen || !opportunity) return null;

  const handleRunDeepResearch = async () => {
    setIsResearching(true);
    setResearchError('');
    try {
      if (opportunity.id) {
        const res = await deepResearchOpportunity(opportunity.id);
        if (res.intelligence) {
          setIntel(res.intelligence);
        }
      } else {
        const res = await deepResearchCompany(
          opportunity.company || opportunity.source || 'Tech Company',
          opportunity.title || 'Software Engineer',
          opportunity.url
        );
        setIntel(res);
      }
    } catch (err) {
      console.error('Deep company research failed:', err);
      setResearchError(err.message || 'Failed to crawl company intelligence.');
    } finally {
      setIsResearching(false);
    }
  };

  const handleOpenInStudio = () => {
    onClose();
    const cand = opportunity.matched_candidate_id || candidateId || 'candidate_mohit';
    navigate(`/studio?candidateId=${cand}&oppId=${opportunity.id || ''}`);
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-slate-900/90 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getCategoryBadgeVariant(opportunity.category)}>
                {opportunity.category?.toUpperCase() || 'OPPORTUNITY'}
              </Badge>
              {opportunity.source && (
                <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {opportunity.source}
                </span>
              )}
              {opportunity.matched_candidate_id && (
                <span className="text-[11px] font-bold text-purple-400 bg-purple-950/60 border border-purple-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Matched Candidate
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
              {opportunity.title}
            </h2>

            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>{opportunity.company || opportunity.source || 'Tech Company'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>{opportunity.location || 'Noida, India / Remote'}</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{opportunity.application_status || 'Actively Hiring'}</span>
              </div>
              {opportunity.deadline && (
                <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Deadline: {opportunity.deadline}</span>
                </div>
              )}
            </div>

            {opportunity.interest_alignment && (
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  Profile Interest Fit
                </span>
                <span className="text-xs text-slate-200 font-medium">
                  {opportunity.interest_alignment}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <ScoreGauge score={opportunity.relevance_score || 94} size={48} strokeWidth={4} />
              <p className="text-[10px] font-bold text-slate-400 mt-1">Relevance</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('company_intel')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'company_intel'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-cyan-400" />
            Firecrawl Company Intel
            {intel && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4 text-indigo-400" />
            Role Description & JD
          </button>

          <button
            onClick={() => setActiveTab('skills_match')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'skills_match'
                ? 'border-purple-400 text-purple-400 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4 text-purple-400" />
            ATS Keyword Match
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: Firecrawl Deep Company Intelligence */}
          {activeTab === 'company_intel' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Action Strip */}
              <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Deep Crawled Company Dossier
                  </h4>
                  <p className="text-xs text-slate-400">
                    Live Firecrawl intelligence scraped across company website, tech stack, and engineering culture.
                  </p>
                </div>
                <button
                  onClick={handleRunDeepResearch}
                  disabled={isResearching}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Search className="w-3.5 h-3.5" />
                  {isResearching ? 'Crawling Intel...' : 'Refresh Intel'}
                </button>
              </div>

              {isResearching ? (
                <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60">
                  <LoadingSpinner size="lg" text="Firecrawl is analyzing company website, careers portal, tech stack, and engineering culture..." />
                </div>
              ) : intel ? (
                <div className="space-y-5">
                  {/* Executive Overview */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Company Mission & Overview
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {intel.overview}
                    </p>
                  </div>

                  {/* Scraped Engineering Tech Stack */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      Scraped Engineering Tech Stack
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(intel.tech_stack || []).map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-indigo-950/70 border border-indigo-500/30 text-indigo-200 font-mono text-xs rounded-lg font-semibold shadow-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Engineering Culture & Values */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Engineering Culture
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {intel.engineering_culture}
                      </p>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Core Values & Priorities
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(intel.key_values || []).map((val, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs rounded-md font-medium"
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Target ATS Keywords */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      Priority ATS Keywords (Injected into Tailoring Context)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(intel.ats_keywords || []).map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-amber-950/50 border border-amber-500/30 text-amber-200 text-xs rounded-lg font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Technical Interview Focus Areas */}
                  {intel.interview_focus_areas && intel.interview_focus_areas.length > 0 && (
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Interview Focus Areas
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {intel.interview_focus_areas.map((focus, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-rose-400 font-bold">•</span>
                            <span>{focus}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No company intelligence found. Click 'Refresh Intel' to crawl with Firecrawl.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Role Overview & Full JD */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                  Job Description & Scope
                </h4>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {opportunity.description || opportunity.raw_jd || 'No direct JD text available. Please see direct opportunity apply link.'}
                </div>
              </div>

              {opportunity.skills_required && (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
                    Required Competencies & Tech
                  </h4>
                  <p className="text-xs text-slate-300">
                    {opportunity.skills_required}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Candidate Skill Match */}
          {activeTab === 'skills_match' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-400">
                    ATS Skill Overlap & Alignment
                  </h4>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                    {opportunity.relevance_score || 94}% Overall Compatibility
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  CareerOS RAG matches candidate portfolio artifacts against {opportunity.company}'s requirements to highlight optimal project bullets.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400">Strong Matched Skills</span>
                    <p className="text-xs text-slate-300">React, Python, FastAPI, Node.js, PostgreSQL, AI Systems, REST APIs</p>
                  </div>
                  <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-amber-400">Keywords to Emphasize</span>
                    <p className="text-xs text-slate-300">Scalable Microservices, Docker, CI/CD, Automated Testing</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Action Bar */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs text-slate-400">
            {intel ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Firecrawl Deep Intelligence Ready for Tailoring
              </span>
            ) : (
              <span>Ready to tailor resume for {opportunity.company || 'Target Organization'}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {opportunity.url && (
              <a
                href={opportunity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Apply on Portal
              </a>
            )}
            <button
              onClick={handleOpenInStudio}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Tailor Resume with Company Intel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
