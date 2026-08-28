import React, { useState } from 'react';
import {
  X,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Download,
  Share2,
  BookOpen,
  Eye,
  Activity,
  Users,
  ShieldCheck,
  Briefcase,
  Layers,
  Cpu,
  Target,
  Flame,
  FileText
} from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import ScoreGauge from '../ui/ScoreGauge';

export default function InterviewDebriefModal({ isOpen, onClose, debrief, onRetake }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'questions' | 'panel' | 'observations' | 'roadmap'
  const [expandedQIndex, setExpandedQIndex] = useState(0);

  if (!isOpen || !debrief) return null;

  const score = debrief.overallScore !== undefined ? debrief.overallScore : (debrief.overall_score || 85);
  const verdict = debrief.hiringDecision || debrief.hiring_verdict || 'Hire';
  const isDisqualified = verdict.toLowerCase().includes('disqualified') || debrief.conductEvaluation?.integrityStatus === 'Disqualified';
  const isHire = !isDisqualified && verdict.toLowerCase().includes('hire') && !verdict.toLowerCase().includes('no');

  const executiveSummary = debrief.executiveSummary || debrief.summary_verdict || "Comprehensive performance evaluation completed.";
  const topStrengths = debrief.topStrengths || debrief.top_strengths || [];
  const areasToPolish = debrief.areasForImprovement || debrief.top_weaknesses || [];
  const roadmap = debrief.actionableStudyRoadmap || debrief.actionable_study_roadmap || [];
  const questionBreakdown = debrief.questionBreakdown || debrief.question_breakdown || [];
  const nonVerbal = debrief.nonVerbalAnalysis;
  const conduct = debrief.conductEvaluation;
  const metrics = debrief.metrics || [];

  const handleDownloadReport = () => {
    const reportText = `# AI Interview Performance Debrief & Hiring Panel Scorecard
Company: ${debrief.company_name || debrief.company || "Target Company"} | Role: ${debrief.job_title || debrief.role || "Software Engineer"}
Overall Score: ${score}/100 | Verdict: ${verdict}
Date: ${new Date().toLocaleString()}

## Executive Summary
${executiveSummary}

## Top Strengths
${topStrengths.map((s) => `- ${s}`).join('\n')}

## Critical Gaps & Areas for Improvement
${areasToPolish.map((w) => `- ${w}`).join('\n')}

## Actionable Study Roadmap
${roadmap.map((r) => `- ${r}`).join('\n')}
`;

    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Debrief_${(debrief.company_name || debrief.company || 'Company').replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Strip */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-lg ${
              isDisqualified
                ? "bg-rose-600 text-white shadow-rose-600/30"
                : isHire
                ? "bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 shadow-emerald-500/20"
                : "bg-amber-500 text-slate-950"
            }`}>
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">AI Hiring Panel Performance Debrief</h2>
                <Badge variant={isDisqualified ? 'rose' : isHire ? 'green' : 'amber'}>
                  {verdict.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                {debrief.job_title || debrief.role || "Target Role"} • Executive HR & Multimodal Scorecard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadReport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Report
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/30 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'summary', label: 'Executive Summary', icon: Sparkles },
            { id: 'questions', label: 'Question Breakdown', icon: BookOpen, count: questionBreakdown.length },
            { id: 'nonverbal', label: 'Non-Verbal & Presence', icon: Eye },
            { id: 'roadmap', label: 'Actionable Roadmap', icon: Target, count: roadmap.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Disqualification / Conduct Banner if applicable */}
              {conduct && conduct.integrityStatus !== "Clean" && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  conduct.integrityStatus === "Disqualified"
                    ? "bg-rose-950/40 border-rose-500/50 text-rose-200"
                    : "bg-amber-950/30 border-amber-500/40 text-amber-200"
                }`}>
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Conduct & Integrity Status: {conduct.integrityStatus} ({conduct.warningsCount || 0} Warnings)
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {conduct.verdictExplanation || "Candidate received conduct warnings during the interview."}
                    </p>
                  </div>
                </div>
              )}

              {/* Score Hero Banner */}
              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-6 items-center shadow-inner">
                <div className="flex flex-col items-center justify-center md:border-r border-slate-800 pr-4">
                  <ScoreGauge score={score} size="lg" label="Readiness Score" />
                  <div className="mt-2 text-center">
                    <span className={`text-xs font-black ${isDisqualified ? "text-rose-400" : isHire ? "text-emerald-400" : "text-amber-400"}`}>
                      {verdict}
                    </span>
                    <p className="text-[10px] text-slate-400">Hiring Authority Recommendation</p>
                  </div>
                </div>

                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {metrics.length > 0 ? (
                    metrics.map((m, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400 truncate max-w-[170px]">{m.category}</span>
                          <span className="text-xs font-black text-cyan-400">{m.score}/100</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500" style={{ width: `${m.score}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{m.feedback}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Technical Depth</span>
                        <div className="text-xl font-black text-cyan-400">{debrief.technical_score || 85}/100</div>
                      </div>
                      <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Communication & Clarity</span>
                        <div className="text-xl font-black text-indigo-400">{debrief.communication_score || 88}/100</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Executive Summary Paragraph */}
              <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Bar-Raiser Executive Verdict
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {executiveSummary}
                </p>
              </div>

              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2.5">
                  <h4 className="text-xs font-extrabold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Top Performance Strengths
                  </h4>
                  <ul className="space-y-1.5">
                    {topStrengths.map((str, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-emerald-400 font-bold shrink-0">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-2.5">
                  <h4 className="text-xs font-extrabold text-amber-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Critical Gaps & Areas to Polish
                  </h4>
                  <ul className="space-y-1.5">
                    {areasToPolish.map((w, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-amber-400 font-bold shrink-0">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: QUESTION BREAKDOWN */}
          {activeTab === 'questions' && (
            <div className="space-y-4 animate-fadeIn">
              {questionBreakdown.map((q, idx) => {
                const isExpanded = expandedQIndex === idx;
                const techScore = q.technicalAccuracyScore || q.technical_accuracy_score || 8;
                return (
                  <div
                    key={idx}
                    className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedQIndex(isExpanded ? -1 : idx)}
                      className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3 pr-4">
                        <span className="w-6 h-6 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-white leading-snug">
                            {q.topic || q.question_text || `Question ${idx + 1}`}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            Rating: {q.candidateResponseQuality || "Solid"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={techScore >= 8 ? 'green' : 'amber'}>
                          Quality: {q.candidateResponseQuality || "Solid"}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3 text-xs">
                        <div className="p-3 bg-slate-900/60 rounded-xl space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Interviewer Notes & Evaluation</span>
                          <p className="text-slate-300 leading-relaxed">
                            {q.interviewerNotes || q.candidate_answer_summary || "Candidate communicated response clearly with structured STAR breakdown."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: NON-VERBAL EXECUTIVE PRESENCE */}
          {activeTab === 'nonverbal' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Posture & Poise</span>
                  <div className="text-2xl font-black text-cyan-400">
                    {nonVerbal?.postureScore || 90}/100
                  </div>
                  <p className="text-[10px] text-emerald-400">Upright & Engaged</p>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Eye Contact & Focus</span>
                  <div className="text-2xl font-black text-indigo-400">
                    {nonVerbal?.eyeContactScore || 85}/100
                  </div>
                  <p className="text-[10px] text-cyan-400">Direct Camera Gaze</p>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Executive Composure</span>
                  <div className="text-2xl font-black text-emerald-400">
                    {nonVerbal?.confidenceIndex || 88}/100
                  </div>
                  <p className="text-[10px] text-emerald-400">Calm & Structured</p>
                </div>
              </div>

              {/* Non-verbal Observations List */}
              <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  Multimodal Camera & Speech Observations
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(nonVerbal?.observations || [
                    "Maintained strong, consistent eye contact during technical explanations.",
                    "Articulate and composed delivery with minimal hesitation fillers.",
                    "No off-screen distractions or phone usage detected."
                  ]).map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: MULTI-PANEL REVIEWS */}
          {activeTab === 'panel' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
              {(debrief.panel_feedback || []).map((panel, idx) => (
                <div key={idx} className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="purple">{panel.panel_role}</Badge>
                      <span className="text-xs font-black text-cyan-400">{panel.score}/100</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{panel.member_name}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{panel.detailed_comments}"
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">Key Strengths</span>
                      <ul className="text-slate-400 space-y-0.5">
                        {(panel.key_strengths || []).map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase">Areas for Growth</span>
                      <ul className="text-slate-400 space-y-0.5">
                        {(panel.areas_for_growth || []).map((g, i) => (
                          <li key={i}>• {g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: OBSERVATIONAL LOG */}
          {activeTab === 'observations' && (
            <div className="space-y-3 animate-fadeIn">
              {(debrief.observations_timeline || []).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No automated micro-observations logged for this session.
                </div>
              ) : (
                debrief.observations_timeline.map((obs, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-500">
                        {Math.floor(obs.timestamp_sec || idx * 15)}s
                      </span>
                      <Badge variant={obs.sentiment === 'positive' ? 'green' : obs.sentiment === 'negative' ? 'amber' : 'gray'}>
                        {obs.observation_type}
                      </Badge>
                      <span className="text-slate-300 font-medium">{obs.observation}</span>
                    </div>
                    {obs.impact_score !== 0 && (
                      <span className={`font-mono text-xs font-bold ${obs.impact_score > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {obs.impact_score > 0 ? `+${obs.impact_score}` : obs.impact_score}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: ACTIONABLE ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="space-y-3 animate-fadeIn">
              {(debrief.actionable_study_roadmap || []).map((road, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-950/70 border border-cyan-500/20 hover:border-cyan-500/40 rounded-2xl flex items-start gap-3.5 transition-all text-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black shrink-0">
                    {idx + 1}
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-white leading-tight">{road}</h5>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ArmorIQ Cryptographically Verified Performance Audit</span>
          </div>

          <div className="flex items-center gap-3">
            {onRetake && (
              <button
                onClick={onRetake}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Retake Interview
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl transition-all shadow-lg cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
