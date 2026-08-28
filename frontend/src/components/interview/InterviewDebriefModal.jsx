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

  const score = debrief.overall_score || 88;
  const verdict = debrief.hiring_verdict || 'Hire';
  const isHire = verdict.toLowerCase().includes('hire') && !verdict.toLowerCase().includes('no');

  const handleDownloadReport = () => {
    const reportText = `# AI Interview Performance Debrief & Hiring Panel Scorecard
Company: ${debrief.company_name} | Role: ${debrief.job_title}
Overall Score: ${score}/100 | Verdict: ${verdict}
Date: ${new Date(debrief.created_at * 1000).toLocaleString()}

## 4-Pillar Dimensional Breakdown
- Technical Competency: ${debrief.technical_score}/30
- Communication & Structure: ${debrief.communication_score}/25
- Problem Solving & Architecture: ${debrief.problem_solving_score}/25
- Culture & Value Fit: ${debrief.culture_fit_score}/20

## Executive Summary
${debrief.summary_verdict}

## Top Strengths
${(debrief.top_strengths || []).map((s) => `- ${s}`).join('\n')}

## Critical Gaps & Areas for Improvement
${(debrief.top_weaknesses || []).map((w) => `- ${w}`).join('\n')}

## Body Language & Pacing
${debrief.body_language_and_pacing_notes}

## Question-by-Question Review
${(debrief.question_breakdown || [])
  .map(
    (q, idx) => `
### Question ${idx + 1}: ${q.question_text}
- Candidate Response: ${q.candidate_answer_summary}
- Technical Accuracy: ${q.technical_accuracy_score}/10 | Clarity: ${q.communication_clarity_score}/10
- Critique: ${(q.critical_gaps_or_flaws || []).join(', ')}
- Model 10/10 Answer: ${q.ideal_model_answer}
`
  )
  .join('\n')}

## Actionable Study Roadmap
${(debrief.actionable_study_roadmap || []).map((r) => `- ${r}`).join('\n')}
`;

    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Debrief_${debrief.company_name.replace(/\s+/g, '_')}_${debrief.job_title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Strip */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">AI Hiring Panel Performance Debrief</h2>
                <Badge variant={isHire ? 'green' : 'amber'}>{verdict.toUpperCase()}</Badge>
              </div>
              <p className="text-xs text-slate-400">
                {debrief.job_title} at {debrief.company_name} • Comprehensive Multi-Agent Scorecard
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
            { id: 'questions', label: 'Question Breakdown', icon: BookOpen, count: debrief.question_breakdown?.length },
            { id: 'panel', label: 'Multi-Panel Reviews', icon: Users, count: debrief.panel_feedback?.length },
            { id: 'observations', label: 'Body Language & Observational Log', icon: Eye, count: debrief.observations_timeline?.length },
            { id: 'roadmap', label: 'Actionable Roadmap', icon: Target },
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
              
              {/* Score Hero Banner */}
              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-6 items-center shadow-inner">
                <div className="flex flex-col items-center justify-center md:border-r border-slate-800 pr-4">
                  <ScoreGauge score={score} size="lg" label="Overall Score" />
                  <div className="mt-2 text-center">
                    <span className="text-xs font-black text-white">{verdict}</span>
                    <p className="text-[10px] text-slate-400">Consensus Recommendation</p>
                  </div>
                </div>

                <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Technical Depth</span>
                    <div className="text-xl font-black text-cyan-400">{debrief.technical_score}/30</div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: `${(debrief.technical_score / 30) * 100}%` }} />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Communication</span>
                    <div className="text-xl font-black text-indigo-400">{debrief.communication_score}/25</div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400" style={{ width: `${(debrief.communication_score / 25) * 100}%` }} />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Problem Solving</span>
                    <div className="text-xl font-black text-emerald-400">{debrief.problem_solving_score}/25</div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${(debrief.problem_solving_score / 25) * 100}%` }} />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Culture Fit</span>
                    <div className="text-xl font-black text-purple-400">{debrief.culture_fit_score}/20</div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400" style={{ width: `${(debrief.culture_fit_score / 20) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Summary Paragraph */}
              <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Bar-Raiser Executive Verdict
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {debrief.summary_verdict}
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
                    {(debrief.top_strengths || []).map((str, idx) => (
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
                    {(debrief.top_weaknesses || []).map((w, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-amber-400 font-bold shrink-0">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Body Language Note */}
              {debrief.body_language_and_pacing_notes && (
                <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-1.5">
                  <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-400" />
                    Visual Presence, Posture & Speaking Pacing
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {debrief.body_language_and_pacing_notes}
                  </p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: QUESTION BREAKDOWN */}
          {activeTab === 'questions' && (
            <div className="space-y-4 animate-fadeIn">
              {(debrief.question_breakdown || []).map((q, idx) => {
                const isExpanded = expandedQIndex === idx;
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
                          <h4 className="text-xs font-bold text-white leading-snug">{q.question_text}</h4>
                          <span className="text-[10px] text-slate-400">Interviewer: {q.interviewer_persona}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={q.technical_accuracy_score >= 8 ? 'green' : 'amber'}>
                          Tech: {q.technical_accuracy_score}/10
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-slate-800/80 space-y-4 text-xs">
                        {/* Candidate Answer Summary */}
                        <div className="p-3 bg-slate-900/60 rounded-xl space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Your Response Summary</span>
                          <p className="text-slate-300 leading-relaxed">{q.candidate_answer_summary}</p>
                        </div>

                        {/* Strengths & Critiques */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.strengths_in_answer?.length > 0 && (
                            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1">
                              <span className="text-[10px] font-bold text-emerald-400">Strengths in your answer</span>
                              <ul className="space-y-0.5 text-slate-300">
                                {q.strengths_in_answer.map((s, i) => (
                                  <li key={i}>• {s}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {q.critical_gaps_or_flaws?.length > 0 && (
                            <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl space-y-1">
                              <span className="text-[10px] font-bold text-rose-400">What was missed or inaccurate</span>
                              <ul className="space-y-0.5 text-slate-300">
                                {q.critical_gaps_or_flaws.map((g, i) => (
                                  <li key={i}>• {g}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Model 10/10 Benchmark Answer */}
                        <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-1.5">
                          <span className="text-[10px] uppercase font-extrabold text-indigo-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            Model 10/10 Benchmark Answer
                          </span>
                          <p className="text-slate-200 leading-relaxed font-sans">{q.ideal_model_answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
