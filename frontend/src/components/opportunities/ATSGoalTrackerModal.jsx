import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Target,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  Cpu,
  Layers,
  ShieldCheck,
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Lightbulb,
  FileText,
  Clock,
  Wand2,
  Sliders,
  Send,
  HelpCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import ScoreGauge from '../ui/ScoreGauge';
import { runATS90GoalPipeline, fetchCompanyJdDeepIntel, downloadResumePdf } from '../../api/client';

export default function ATSGoalTrackerModal({
  isOpen,
  onClose,
  opportunity,
  candidateId = 'candidate_mohit',
  candidateName = 'Candidate'
}) {
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState('loop_tracker'); // 'loop_tracker' | 'hr_intel' | 'rubric' | 'resume_preview'
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [customDirectives, setCustomDirectives] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [pipelineResult, setPipelineResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedIterationIndex, setSelectedIterationIndex] = useState(null);

  const stepsList = [
    { title: 'HR Company & JD Intelligence', desc: 'Crawling engineering portal & synthesizing recruiter dossier...' },
    { title: 'ArmorIQ Multi-Agent Delegation', desc: 'Authorizing crypto-tokens for scout, tailor & evaluator...' },
    { title: 'Gold Resume AST Ingestion', desc: 'Parsing candidate stencil with zero-data-loss protection...' },
    { title: 'ATS 90+ Autonomous Iteration Loop', desc: 'Surgically optimizing keywords, metrics, and phrasing...' },
    { title: 'High-Fidelity PDF Compilation', desc: 'Compiling ReportLab publication-grade PDF & saving to DB...' }
  ];

  useEffect(() => {
    if (isOpen && opportunity) {
      setErrorMsg('');
      // Auto-trigger if first time opened for this opportunity and no result yet
      if (!pipelineResult) {
        handleExecuteATSGoal();
      }
    }
  }, [isOpen, opportunity]);

  if (!isOpen || !opportunity) return null;

  const compName = opportunity.company || opportunity.company_name || opportunity.source || 'Target Organization';
  const oppTitle = opportunity.title || 'Software Engineer';

  const handleExecuteATSGoal = async () => {
    setIsRunning(true);
    setErrorMsg('');
    setCurrentStepIndex(0);

    // Simulate animated step transitions for live perception
    const stepTimer1 = setTimeout(() => setCurrentStepIndex(1), 700);
    const stepTimer2 = setTimeout(() => setCurrentStepIndex(2), 1500);
    const stepTimer3 = setTimeout(() => setCurrentStepIndex(3), 2400);

    try {
      const payload = {
        candidate_id: candidateId,
        opportunity_id: opportunity.id ? String(opportunity.id) : null,
        company_name: compName,
        opportunity_title: oppTitle,
        job_description: opportunity.description || opportunity.raw_jd || `${oppTitle} at ${compName}`,
        job_url: opportunity.url || null,
        target_score: 90,
        max_iterations: 4,
        custom_instructions: customDirectives.trim() || null
      };

      const result = await runATS90GoalPipeline(payload);
      setCurrentStepIndex(4);
      setPipelineResult(result);
      if (result.iteration_trace && result.iteration_trace.length > 0) {
        setSelectedIterationIndex(result.iteration_trace.length - 1);
      }
    } catch (err) {
      console.error('ATS Goal Pipeline failed:', err);
      setErrorMsg(err.message || 'ATS Goal pipeline execution failed.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsRunning(false);
    }
  };

  const handleCopyMarkdown = () => {
    const textToCopy = pipelineResult?.final_tailored_markdown || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = async () => {
    if (!pipelineResult?.final_tailored_markdown) return;
    const cleanCand = candidateName.replace(/\s+/g, '_');
    const cleanComp = compName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${cleanCand}_${cleanComp}_ATS90_Resume.pdf`;

    await downloadResumePdf(
      pipelineResult.pdf_path || null,
      pipelineResult.final_tailored_markdown,
      filename
    );
  };

  const handleOpenInStudio = () => {
    onClose();
    navigate(`/studio?candidateId=${candidateId}&oppId=${opportunity.id || ''}`);
  };

  const intel = pipelineResult?.company_job_intel;
  const currentRubric = pipelineResult?.final_score_breakdown;
  const trace = pipelineResult?.iteration_trace || [];
  const finalScore = pipelineResult?.final_ats_score || 0;
  const initialScore = pipelineResult?.initial_ats_score || 0;
  const scoreDelta = finalScore - initialScore;

  const viewingIteration = selectedIterationIndex !== null && trace[selectedIterationIndex]
    ? trace[selectedIterationIndex]
    : trace[trace.length - 1] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Glowing Top Rainbow Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-emerald-400 via-cyan-400 to-indigo-500 animate-pulse" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-[11px] rounded-full flex items-center gap-1.5 shadow-sm">
                <Target className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                AUTONOMOUS ATS 90+ GOAL PIPELINE
              </span>
              <span className="px-2.5 py-0.5 bg-purple-950/70 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                ArmorIQ Cryptographically Governed
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight flex items-center gap-2 flex-wrap">
              <span>{oppTitle}</span>
              <span className="text-slate-500 font-normal">at</span>
              <span className="text-cyan-400">{compName}</span>
            </h2>

            <p className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                {compName}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-medium">Candidate: {candidateName}</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Target ATS: 90+ Score
              </span>
            </p>
          </div>

          {/* Quick Score Delta & Close */}
          <div className="flex items-center gap-4 shrink-0">
            {pipelineResult && (
              <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 px-4 rounded-2xl border border-slate-800">
                <ScoreGauge score={finalScore} size={48} strokeWidth={4.5} />
                <div className="text-left">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Final ATS Score</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white">{finalScore}/100</span>
                    {scoreDelta > 0 && (
                      <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">
                        +{scoreDelta}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 border-b border-slate-800 bg-slate-950/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('loop_tracker')}
            className={`py-3 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'loop_tracker'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Loop Execution Trace
            {trace.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-black bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30">
                {trace.length} Steps
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('hr_intel')}
            className={`py-3 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'hr_intel'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
            Deep HR Company & JD Dossier
            {intel && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
          </button>

          <button
            onClick={() => setActiveTab('rubric')}
            className={`py-3 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'rubric'
                ? 'border-purple-400 text-purple-400 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-purple-400" />
            ATS 6-Factor Scorecard
            {currentRubric && (
              <span className="px-1.5 py-0.2 text-[10px] font-black bg-purple-500/20 text-purple-300 rounded-md border border-purple-500/30">
                {currentRubric.overall_score}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('resume_preview')}
            className={`py-3 px-3.5 text-xs font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'resume_preview'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Tailored Resume & PDF
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* Running State Live Animation */}
          {isRunning && (
            <div className="p-6 bg-slate-950/80 border border-emerald-500/30 rounded-2xl shadow-xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Running Autonomous ATS 90+ Goal Loop...
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Step {currentStepIndex + 1} of {stepsList.length}
                </span>
              </div>

              {/* Multi-step progress visualizer */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {stepsList.map((st, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border transition-all ${
                      idx === currentStepIndex
                        ? 'bg-emerald-950/60 border-emerald-400 shadow-md text-emerald-200'
                        : idx < currentStepIndex
                        ? 'bg-slate-900/80 border-slate-700 text-slate-300'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {idx < currentStepIndex ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : idx === currentStepIndex ? (
                        <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-slate-700 text-[9px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                      )}
                      <span className="text-[10px] font-bold truncate">{st.title}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 line-clamp-2">{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-950/50 border border-red-500/40 rounded-2xl flex items-start gap-3 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Pipeline Error: </span>
                {errorMsg}
              </div>
            </div>
          )}

          {/* TAB 1: Autonomous Loop Execution Trace */}
          {activeTab === 'loop_tracker' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Action Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Iteration-by-Iteration Optimization Trace
                  </h4>
                  <p className="text-xs text-slate-400">
                    Each loop analyzes ATS gaps, injects missing keywords & metrics, and re-evaluates until score ≥ 90.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Directives
                  </button>
                  <button
                    onClick={handleExecuteATSGoal}
                    disabled={isRunning}
                    className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                    {isRunning ? 'Optimizing...' : 'Re-Run ATS Goal'}
                  </button>
                </div>
              </div>

              {/* Optional Custom Directives Input Drawer */}
              {showCustomInput && (
                <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-2.5 animate-slide-down">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    Custom Tailoring Directives (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customDirectives}
                      onChange={(e) => setCustomDirectives(e.target.value)}
                      placeholder="e.g. Strongly emphasize distributed backend throughput and PyTorch agent architecture..."
                      className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleExecuteATSGoal}
                      disabled={isRunning}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Apply & Run
                    </button>
                  </div>
                </div>
              )}

              {/* Loop Step Cards Timeline */}
              {trace.length > 0 ? (
                <div className="space-y-4">
                  {trace.map((step, idx) => {
                    const isSelected = selectedIterationIndex === idx;
                    const isBaseline = step.iteration === 0;
                    const isFinal = idx === trace.length - 1;
                    const isMet = step.ats_score >= 90;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedIterationIndex(idx)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-950/90 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                            : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                              isBaseline
                                ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                : isMet
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                                : 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/40'
                            }`}>
                              {isBaseline ? 'Iteration #0 (Baseline Gold Resume)' : `Iteration #${step.iteration}`}
                            </span>

                            {isMet && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] rounded-full border border-emerald-500/40 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                GOAL MET (≥90 ATS)
                              </span>
                            )}

                            {step.duration_ms > 0 && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {step.duration_ms}ms
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-400">Score: </span>
                              <span className={`text-sm font-black ${step.ats_score >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {step.ats_score}/100
                              </span>
                            </div>
                            <ScoreGauge score={step.ats_score} size={36} strokeWidth={3.5} />
                          </div>
                        </div>

                        {/* Step Changes Summary */}
                        <div className="space-y-1.5 text-xs text-slate-300">
                          {(step.changes_made || []).map((ch, cIdx) => (
                            <div key={cIdx} className="flex items-start gap-2">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span className="text-slate-300">{ch}</span>
                            </div>
                          ))}
                        </div>

                        {/* Critique Fed Forward if any */}
                        {step.critique_fed_forward && !isMet && (
                          <div className="mt-3 p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl space-y-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3" />
                              Critique Fed Forward into Next Iteration
                            </span>
                            <p className="text-xs text-amber-200/90 leading-relaxed">
                              {step.critique_fed_forward}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
                  <LoadingSpinner size="lg" text="Click 'Run ATS Goal' to start autonomous optimization..." />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Deep HR Company & JD Intelligence Dossier */}
          {activeTab === 'hr_intel' && (
            <div className="space-y-6 animate-fade-in">
              {intel ? (
                <div className="space-y-5">
                  {/* Executive Overview & Business Model */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Executive Overview & Market Positioning
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {intel.company_overview}
                    </p>
                    {intel.business_model_and_products && (
                      <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                        <span className="font-bold text-slate-300">Core Products & Model: </span>
                        {intel.business_model_and_products}
                      </div>
                    )}
                  </div>

                  {/* Scraped Engineering Tech Stack */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      Primary Engineering Tech Stack
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(intel.engineering_tech_stack || []).map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-indigo-950/80 border border-indigo-500/30 text-indigo-200 font-mono text-xs rounded-lg font-bold shadow-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Engineering Culture & Key Values */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Engineering Culture
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {intel.engineering_culture_and_values}
                      </p>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Core Values & Principles
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(intel.key_values || []).map((val, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs rounded-md font-medium"
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Role Scope & Responsibilities */}
                  {intel.role_scope_and_responsibilities && intel.role_scope_and_responsibilities.length > 0 && (
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        Role Scope & Key Deliverables ({intel.job_title})
                      </span>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {intel.role_scope_and_responsibilities.map((resp, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recruiter Evaluation Criteria & Top Interview Questions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {intel.recruiter_evaluation_criteria && (
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-2.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Recruiter Evaluation Criteria
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {intel.recruiter_evaluation_criteria.map((crit, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-rose-400 font-bold">•</span>
                              <span>{crit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {intel.common_interview_questions && (
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-2.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Top Technical & Behavioral Interview Questions
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {intel.common_interview_questions.map((q, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-teal-400 font-bold">•</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Priority ATS Keywords */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      Priority ATS Keywords (Injected into Tailoring Context)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(intel.ats_priority_keywords || []).map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-amber-950/50 border border-amber-500/30 text-amber-200 text-xs rounded-lg font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
                  <LoadingSpinner size="lg" text="Generating deep HR intelligence..." />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATS 6-Factor Scorecard */}
          {activeTab === 'rubric' && (
            <div className="space-y-6 animate-fade-in">
              {currentRubric ? (
                <div className="space-y-5">
                  {/* Overall Score Banner */}
                  <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <ScoreGauge score={currentRubric.overall_score} size={64} strokeWidth={5} />
                      <div>
                        <h4 className="text-base font-extrabold text-white">
                          Overall ATS Compatibility: {currentRubric.overall_score}/100
                        </h4>
                        <p className="text-xs text-slate-400">
                          {currentRubric.overall_score >= 90
                            ? '🎉 High-Confidence ATS Pass — Optimized for automated filters & hiring managers.'
                            : 'Optimized against target JD rubric.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl">
                        {currentRubric.matched_keywords?.length || 0} Matched Keywords
                      </span>
                      <span className="px-3 py-1 bg-amber-950/80 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl">
                        {currentRubric.missing_critical_keywords?.length || 0} Missing
                      </span>
                    </div>
                  </div>

                  {/* 6-Factor Granular Progress Bars */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400">
                      Granular 6-Factor ATS Evaluation Rubric
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Keyword Score (0-25) */}
                      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-300">1. Keyword & Technical Overlap</span>
                          <span className="text-cyan-400">{currentRubric.keyword_score}/25 pts</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full rounded-full transition-all"
                            style={{ width: `${(currentRubric.keyword_score / 25) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Role Relevance Score (0-20) */}
                      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-300">2. Role Scope & Relevance</span>
                          <span className="text-indigo-400">{currentRubric.role_relevance_score}/20 pts</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-400 h-full rounded-full transition-all"
                            style={{ width: `${(currentRubric.role_relevance_score / 20) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Impact Metrics Score (0-20) */}
                      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-300">3. Quantified Impact & Metrics</span>
                          <span className="text-emerald-400">{currentRubric.impact_metrics_score}/20 pts</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full transition-all"
                            style={{ width: `${(currentRubric.impact_metrics_score / 20) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Formatting Compatibility (0-15) */}
                      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-300">4. ATS Format & Section Parsing</span>
                          <span className="text-amber-400">{currentRubric.formatting_compatibility_score}/15 pts</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all"
                            style={{ width: `${(currentRubric.formatting_compatibility_score / 15) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Culture Fit (0-10) */}
                      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-300">5. Company Culture & Values Fit</span>
                          <span className="text-purple-400">{currentRubric.culture_fit_score}/10 pts</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-400 h-full rounded-full transition-all"
                            style={{ width: `${(currentRubric.culture_fit_score / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Verbs (0-10) */}
                      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-300">6. Action Verbs & Precision</span>
                          <span className="text-rose-400">{currentRubric.action_verbs_score}/10 pts</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-400 h-full rounded-full transition-all"
                            style={{ width: `${(currentRubric.action_verbs_score / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Matched vs Missing Keywords Clouds */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-2.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Matched Keywords ({currentRubric.matched_keywords?.length || 0})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(currentRubric.matched_keywords || []).map((kw, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs rounded-md font-medium"
                          >
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-2.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Missing Critical Keywords ({currentRubric.missing_critical_keywords?.length || 0})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(currentRubric.missing_critical_keywords || []).map((kw, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs rounded-md font-medium"
                          >
                            ! {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
                  <LoadingSpinner size="lg" text="Loading rubric scorecard..." />
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Tailored Resume & PDF Preview */}
          {activeTab === 'resume_preview' && (
            <div className="space-y-6 animate-fade-in">
              {pipelineResult?.final_tailored_markdown ? (
                <div className="space-y-4">
                  {/* Top Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        Publication-Grade Tailored Resume (ATS Score: {finalScore}/100)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyMarkdown}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy Markdown'}
                      </button>

                      <button
                        onClick={handleDownloadPDF}
                        className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </button>
                    </div>
                  </div>

                  {/* Rendered Markdown Previewer */}
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 max-h-[500px] overflow-y-auto">
                    <div className="prose-chat text-xs leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {pipelineResult.final_tailored_markdown}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
                  <LoadingSpinner size="lg" text="Tailoring resume content..." />
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Action Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
            {pipelineResult ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ATS 90+ Pipeline Complete ({trace.length} loops executed)
              </span>
            ) : (
              <span>Ready to run autonomous ATS 90+ optimization loop</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenInStudio}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              Open in Resume Studio
            </button>

            {pipelineResult?.final_tailored_markdown && (
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
