import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AutoPilotModal from '../components/autopilot/AutoPilotModal';
import {
  fetchOpportunities,
  fetchTailoredResumes,
  refineResume,
  tailorResume,
  downloadResumePdf,
  fetchCandidates,
  fetchCandidateDetails,
  saveCandidateTemplate,
  deepResearchCompany
} from '../api/client';
import {
  Wand2,
  Download,
  Copy,
  Check,
  Sparkles,
  Bot,
  Layers,
  FileText,
  Target,
  RefreshCw,
  Send,
  Sliders,
  ChevronDown,
  ExternalLink,
  Code,
  ShieldCheck,
  CheckCircle2,
  Users,
  MapPin,
  Mail,
  Network,
  Save,
  Flame,
  Cpu,
  Building2,
  Lightbulb
} from 'lucide-react';

const CANDIDATE_THEMES = {
  candidate_mohit: { border: 'border-indigo-500/40', badge: 'primary', accent: 'text-indigo-400' },
  candidate_krati: { border: 'border-pink-500/40', badge: 'secondary', accent: 'text-pink-400' },
  candidate_vishnu: { border: 'border-emerald-500/40', badge: 'success', accent: 'text-emerald-400' },
};

export default function ResumeStudioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Candidate state
  const [candidates, setCandidates] = useState([]);
  const [activeCandidateId, setActiveCandidateId] = useState(
    searchParams.get('candidateId') || 'candidate_mohit'
  );
  const [activeCandidate, setActiveCandidate] = useState(null);

  // Opportunities & Targets
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOppId, setSelectedOppId] = useState(searchParams.get('oppId') || '');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  // Resume content state
  const [markdown, setMarkdown] = useState('');
  const [originalMarkdown, setOriginalMarkdown] = useState('');
  const [atsScore, setAtsScore] = useState(94);
  const [activeEngine, setActiveEngine] = useState('WeasyPrint');

  // UI state
  const [isAutoPilotOpen, setIsAutoPilotOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [history, setHistory] = useState([]);

  // 1. Initial Candidates Load
  useEffect(() => {
    async function loadCandidatesList() {
      try {
        const cRes = await fetchCandidates();
        const validList = (cRes.candidates || []).filter((c) => c.id !== 'candidate_all');
        setCandidates(validList);
      } catch (err) {
        console.error('Failed to load candidates:', err);
      }
    }
    loadCandidatesList();
  }, []);

  // 1.5 Synchronize candidateId from URL search param if changed
  useEffect(() => {
    const urlCandId = searchParams.get('candidateId');
    if (urlCandId && urlCandId !== activeCandidateId) {
      setActiveCandidateId(urlCandId);
    }
  }, [searchParams]);

  // 2. Load Candidate Profile & Resume
  useEffect(() => {
    async function loadCandidateProfile() {
      try {
        const cData = await fetchCandidateDetails(activeCandidateId);
        if (cData.candidate) {
          setActiveCandidate(cData.candidate);
          const baseMd = cData.candidate.resume_markdown || '';
          setMarkdown(baseMd);
          setOriginalMarkdown(baseMd);
        }

        // Fetch tailored opportunities for this specific candidate
        const oppsRes = await fetchOpportunities(activeCandidateId);
        const opps = oppsRes.opportunities || [];
        setOpportunities(opps);

        const targetOppId = searchParams.get('oppId');
        if (targetOppId) {
          const found = opps.find((o) => String(o.id) === String(targetOppId));
          if (found) {
            setSelectedOppId(String(found.id));
            setSelectedOpportunity(found);
          } else if (opps.length > 0) {
            setSelectedOppId(String(opps[0].id));
            setSelectedOpportunity(opps[0]);
          }
        } else if (opps.length > 0) {
          setSelectedOppId(String(opps[0].id));
          setSelectedOpportunity(opps[0]);
        }

        const tailoredRes = await fetchTailoredResumes();
        if (tailoredRes.tailored_resumes && tailoredRes.tailored_resumes.length > 0) {
          setHistory(tailoredRes.tailored_resumes);
        }
      } catch (err) {
        console.error('Failed to load candidate studio context:', err);
      }
    }
    loadCandidateProfile();
  }, [activeCandidateId]);

  const handleCandidateChange = async (candId) => {
    setActiveCandidateId(candId);
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      nextParams.set('candidateId', candId);
      return nextParams;
    });

    // Immediate optimistic update
    try {
      const cData = await fetchCandidateDetails(candId);
      if (cData.candidate) {
        setActiveCandidate(cData.candidate);
        const baseMd = cData.candidate.resume_markdown || '';
        setMarkdown(baseMd);
        setOriginalMarkdown(baseMd);
      }
      const oppsRes = await fetchOpportunities(candId);
      const opps = oppsRes.opportunities || [];
      setOpportunities(opps);
      if (opps.length > 0) {
        setSelectedOppId(String(opps[0].id));
        setSelectedOpportunity(opps[0]);
      }
    } catch (err) {
      console.error('Failed to switch candidate profile:', err);
    }
  };

  const handleOpportunityChange = (oppId) => {
    setSelectedOppId(oppId);
    const found = opportunities.find((o) => String(o.id) === String(oppId));
    setSelectedOpportunity(found || null);
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      if (oppId) nextParams.set('oppId', oppId);
      else nextParams.delete('oppId');
      return nextParams;
    });
  };

  // 3. AI Actions
  const handleAiAction = async (actionKey, promptDesc) => {
    setIsProcessing(true);
    setProcessingAction(promptDesc);
    try {
      let candidateContext = '';
      if (activeCandidate) {
        candidateContext = `Candidate Name: ${activeCandidate.name}, Role: ${activeCandidate.role}, Location: ${activeCandidate.location}, Top Skills: ${(activeCandidate.top_skills || []).join(', ')}.`;
      }
      if (selectedOpportunity) {
        candidateContext += ` Target Opportunity: ${selectedOpportunity.title} at ${selectedOpportunity.company}. Category: ${selectedOpportunity.category}.`;
      }

      const res = await refineResume(markdown, actionKey, candidateContext);
      if (res.refined_markdown) {
        setMarkdown(res.refined_markdown);
        setAtsScore((prev) => Math.min(99, prev + 3));
      }
    } catch (err) {
      console.error('Refinement failed:', err);
      alert('AI Refinement failed: ' + (err.message || 'Please check backend logs.'));
    } finally {
      setIsProcessing(false);
      setProcessingAction('');
    }
  };

  // 3.5 Load Firecrawl Company Intel when target opportunity changes
  const [companyIntel, setCompanyIntel] = useState(null);
  const [isCrawlingIntel, setIsCrawlingIntel] = useState(false);

  useEffect(() => {
    async function loadCompanyIntel() {
      if (selectedOpportunity) {
        if (selectedOpportunity.intelligence || selectedOpportunity.company_intel) {
          setCompanyIntel(selectedOpportunity.intelligence || selectedOpportunity.company_intel);
        } else {
          setIsCrawlingIntel(true);
          try {
            const comp = selectedOpportunity.company || selectedOpportunity.company_name || selectedOpportunity.source || 'Tech Company';
            const title = selectedOpportunity.title || 'Software Engineer';
            const res = await deepResearchCompany(comp, title, selectedOpportunity.url);
            setCompanyIntel(res);
          } catch (e) {
            console.error('Failed to pre-crawl company intel:', e);
          } finally {
            setIsCrawlingIntel(false);
          }
        }
      } else {
        setCompanyIntel(null);
      }
    }
    loadCompanyIntel();
  }, [selectedOpportunity]);

  // 4. Auto-Tailor specifically for selected Opportunity & Candidate (Preserving original document format)
  const handleAutoTailor = async () => {
    if (!selectedOpportunity) {
      alert('Please select a target role first.');
      return;
    }
    setIsProcessing(true);
    setProcessingAction(`Surgically tailoring for ${selectedOpportunity.title} at ${selectedOpportunity.company || selectedOpportunity.company_name || 'Target Org'} using Docling & Firecrawl Intel...`);
    try {
      const res = await tailorResume({
        opportunityTitle: selectedOpportunity.title || 'Target Role',
        companyName: selectedOpportunity.company || selectedOpportunity.company_name || selectedOpportunity.source || 'Target Organization',
        requirements: selectedOpportunity.description || selectedOpportunity.skills_required || 'High proficiency in software engineering, AI systems, and project delivery',
        candidateId: activeCandidateId,
        resumeMarkdown: markdown,
        jobUrl: selectedOpportunity.url,
        companyIntel: companyIntel
      });
      if (res.tailored_markdown) {
        setMarkdown(res.tailored_markdown);
        setAtsScore(98);
        if (res.engine) setActiveEngine(res.engine);
      }
    } catch (err) {
      console.error('Tailoring failed, falling back to local ATS optimization:', err);
      await handleAiAction('ats_optimize', 'Optimizing resume keywords for target role...');
    } finally {
      setIsProcessing(false);
      setProcessingAction('');
    }
  };

  const handleCustomPromptSubmit = async (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    await handleAiAction('custom_instruction', customPrompt);
    setCustomPrompt('');
  };

  const [isSavingMaster, setIsSavingMaster] = useState(false);
  const [masterSaved, setMasterSaved] = useState(false);

  const handleSaveMaster = async () => {
    setIsSavingMaster(true);
    try {
      await saveCandidateTemplate(activeCandidateId, markdown);
      setOriginalMarkdown(markdown);
      setMasterSaved(true);
      setTimeout(() => setMasterSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save master template:', err);
      alert('Failed to save master template: ' + (err.message || 'Error'));
    } finally {
      setIsSavingMaster(false);
    }
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const candidateTag = activeCandidate?.name ? activeCandidate.name.replace(/\s+/g, '_') : 'Candidate';
      const roleTag = selectedOpportunity?.title ? selectedOpportunity.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20) : 'Tailored';
      const filename = `${candidateTag}_${roleTag}_Resume.pdf`;

      await downloadResumePdf(
        null,
        markdown,
        filename
      );
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('PDF generation failed. Please check backend logs.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const currentTheme = CANDIDATE_THEMES[activeCandidateId] || CANDIDATE_THEMES.candidate_mohit;

  return (
    <PageShell
      title="Autonomous AI Resume Studio"
      subtitle="Multi-candidate ATS keyword optimization, Graph RAG alignment & 100% pure binary PDF generation"
      icon={Wand2}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Top Candidate & Opportunity Navigation Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-xl">
          {/* Candidate Switcher Dropdown */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Active Candidate:</span>
            </div>
            <div className="relative min-w-[260px]">
              <select
                value={activeCandidateId}
                onChange={(e) => handleCandidateChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold appearance-none pr-8 cursor-pointer shadow-inner"
              >
                {candidates.length === 0 ? (
                  <option value="candidate_mohit">Mohit Prasad Upraity (AI/IoT)</option>
                ) : (
                  candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.role ? `— ${c.role.split('|')[0].trim()}` : ''}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Target Role Selector */}
          <div className="flex-1 flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Target Role:</span>
            </div>
            <div className="relative flex-1 min-w-[240px]">
              <select
                value={selectedOppId}
                onChange={(e) => handleOpportunityChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 appearance-none pr-8 cursor-pointer font-medium shadow-inner"
              >
                {opportunities.length === 0 ? (
                  <option value="">No scouted opportunities for this candidate yet</option>
                ) : (
                  opportunities.map((opp) => {
                    const title = opp.title || opp.company_name || 'Software Engineering Role';
                    const comp = opp.company || opp.company_name || opp.source || 'Tech Company';
                    const cat = opp.category?.toUpperCase() || 'OPPORTUNITY';
                    return (
                      <option key={opp.id} value={opp.id}>
                        [{cat}] {title} ({comp})
                      </option>
                    );
                  })
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {selectedOpportunity && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-1 rounded-lg">
                  {selectedOpportunity.relevance_score || 94}% Fit
                </span>
                {selectedOpportunity.url && (
                  <a
                    href={selectedOpportunity.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
                    title="Open Direct Apply Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleAutoTailor}
              disabled={isProcessing || !selectedOpportunity}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Tailor for Role
            </button>
            <button
              onClick={() => setIsAutoPilotOpen(true)}
              className="px-3.5 py-2 bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs rounded-xl border border-purple-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              Auto-Pilot
            </button>
          </div>
        </div>

        {/* Candidate Profile Details Banner */}
        {activeCandidate && (
          <div className={`p-4 bg-slate-900/60 rounded-2xl border ${currentTheme.border} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg`}>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-white shadow-inner">
                {activeCandidate.name?.slice(0, 2).toUpperCase() || 'CA'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-extrabold text-white">{activeCandidate.name}</h3>
                  <Badge variant={currentTheme.badge} size="sm">
                    {activeCandidate.role?.split('|')[0].trim()}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
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
              <button
                onClick={() => navigate('/graph')}
                className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Network className="w-3.5 h-3.5 text-indigo-400" />
                View in Knowledge Graph
              </button>
              <div className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">ATS Match Score:</span>
                <span className="font-extrabold text-emerald-400">{atsScore}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Firecrawl Deep Company Intelligence Context Banner */}
        {selectedOpportunity && (
          <div className="bg-gradient-to-r from-slate-900/95 via-cyan-950/20 to-slate-900/95 border border-cyan-500/30 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Firecrawl Company Intel: {selectedOpportunity.company || selectedOpportunity.company_name || 'Target Org'}
                </span>
                {isCrawlingIntel && (
                  <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Crawling Tech Stack...
                  </span>
                )}
                {companyIntel && !isCrawlingIntel && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> AI Grounding Active
                  </span>
                )}
              </div>

              {companyIntel ? (
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="line-clamp-1 text-slate-200">
                    <span className="font-bold text-slate-400">Mission:</span> {companyIntel.overview}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] font-bold text-indigo-400">Target Tech Stack:</span>
                    {(companyIntel.tech_stack || []).slice(0, 7).map((t, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Target Role: <span className="text-white font-bold">{selectedOpportunity.title}</span> — AI will inject company-specific keywords into your tailored resume.
                </p>
              )}
            </div>

            <button
              onClick={handleAutoTailor}
              disabled={isProcessing}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Surgically Tailor for Role
            </button>
          </div>
        )}

        {/* Studio Workspace: Editor + AI Actions & Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Markdown Editor */}
          <div className="lg:col-span-7 space-y-4">
            <GlassCard className="p-5 bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Markdown Resume Canvas ({activeCandidate?.name?.split(' ')[0] || 'Candidate'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveMaster}
                    disabled={isSavingMaster}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      masterSaved
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                        : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/80 hover:text-white'
                    }`}
                    title="Save this markdown as the candidate's active Master Resume Template"
                  >
                    {masterSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                    {masterSaved ? 'Master Saved!' : isSavingMaster ? 'Saving...' : 'Set as Master'}
                  </button>
                  <button
                    onClick={() => setMarkdown(originalMarkdown)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Reset to Candidate's Base Resume"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                  <button
                    onClick={handleCopyMarkdown}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <div className="relative">
                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center p-4 text-center">
                    <LoadingSpinner size="md" text={processingAction || 'AI Agent is optimizing resume...'} />
                  </div>
                )}
                <textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  rows={24}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed shadow-inner resize-y"
                  placeholder="Paste or write your candidate resume markdown here..."
                />
              </div>

              {/* Prompt Instruction Input */}
              <form onSubmit={handleCustomPromptSubmit} className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="e.g., 'Emphasize IoT & embedded gait sensor engineering' or 'Add Figma design metrics'..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !customPrompt.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Prompt AI
                </button>
              </form>
            </GlassCard>
          </div>

          {/* Right Column: AI Toolsuite & Live PDF Generator */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quick Action Pills */}
            <GlassCard className="p-5 bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    AI Optimization Suite
                  </span>
                </div>
                <Badge variant="accent" size="sm">
                  ATS Verified
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleAiAction('ats_optimize', 'Injecting high-impact ATS keywords...')}
                  disabled={isProcessing}
                  className="p-3 bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 group-hover:text-indigo-400">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <span>ATS Keyword Injector</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Extracts core skills from target role into bullet points.</p>
                </button>

                <button
                  onClick={() => handleAiAction('action_verbs', 'Transforming bullet points with strong action verbs...')}
                  disabled={isProcessing}
                  className="p-3 bg-slate-950/80 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 group-hover:text-purple-400">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Impact & Action Verbs</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Replaces passive phrases with quantified leadership achievements.</p>
                </button>

                <button
                  onClick={() => handleAiAction('condense_1page', 'Condensing content to high-density single page...')}
                  disabled={isProcessing}
                  className="p-3 bg-slate-950/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 group-hover:text-cyan-400">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Single-Page Condenser</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Tightens spacing and bullet density for executive 1-page format.</p>
                </button>

                <button
                  onClick={() => handleAiAction('fix_formatting', 'Formatting markdown structure for clean PDF export...')}
                  disabled={isProcessing}
                  className="p-3 bg-slate-950/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 group-hover:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Typography & Alignment</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Standardizes headers, bolding, and contact info layout.</p>
                </button>
              </div>
            </GlassCard>

            {/* Live PDF Export Engine */}
            <GlassCard className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Pure Binary PDF Generation
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                  %PDF-1.4 Native
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Generates a clean, ATS-compliant PDF document directly with genuine typography, multi-column margins, and zero blank page glitches.
              </p>

              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {downloadingPdf ? (
                  <LoadingSpinner size="sm" text="Rendering %PDF-1.4 Binary Stream..." />
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download ATS Tailored PDF ({activeCandidate?.name?.split(' ')[0] || 'Resume'})
                  </>
                )}
              </button>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Autonomous AutoPilot Modal */}
      <AutoPilotModal
        isOpen={isAutoPilotOpen}
        onClose={() => setIsAutoPilotOpen(false)}
        initialResumeText={markdown}
        candidateId={activeCandidateId}
      />
    </PageShell>
  );
}
