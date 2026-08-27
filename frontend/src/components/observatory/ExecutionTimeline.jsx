import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  ShieldOff,
  Zap,
  Play,
  RotateCcw,
  SkipForward,
  Info,
  Key,
  Database,
  Search,
  FileText,
  Bot,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';

const defaultStages = [
  {
    stage: 1,
    agent: 'document_processor',
    name: 'Document Processing & Embedding',
    tool: 'mcp_docproc.process_and_embed_document',
    mcpServer: 'MCP DocProc (Port 8011)',
    scope: 'documents:write, embeddings:write',
    status: 'completed',
    duration: '240ms',
    token_id: 'tok_docproc_17001',
    signature: 'a7f9... (HMAC-SHA256)',
    result: {
      doc_id: 'doc_resume_master_pdf',
      format: 'PDF',
      chunks_embedded: 8,
      vector_dims: 768,
      model: 'text-embedding-004'
    }
  },
  {
    stage: 2,
    agent: 'resume_extractor',
    name: 'Structured Entity Extraction',
    tool: 'mcp_extractor.extract_and_store_resume',
    mcpServer: 'MCP Extractor (Port 8012)',
    scope: 'resumes:write',
    status: 'completed',
    duration: '310ms',
    token_id: 'tok_extractor_17002',
    signature: 'b8e2... (HMAC-SHA256)',
    result: {
      candidate_name: 'Mohit Upraity',
      role: 'Full Stack & AI Engineer',
      skills_count: 18,
      projects_count: 5,
      education: 'B.Tech Computer Science'
    }
  },
  {
    stage: 3,
    agent: 'resume_analyzer',
    name: 'Skills Gap & Domain Scoring',
    tool: 'mcp_analyzer.analyze_and_store_resume',
    mcpServer: 'MCP Analyzer (Port 8013)',
    scope: 'resumes:read, analysis:write',
    status: 'completed',
    duration: '280ms',
    token_id: 'tok_analyzer_17003',
    signature: 'c4d1... (HMAC-SHA256)',
    result: {
      primary_domain: 'Distributed Systems & AI Agents',
      strength_score: 94,
      experience_level: 'Senior',
      highlight_keywords: ['Python', 'FastAPI', 'React', 'pgvector', 'ArmorIQ']
    }
  },
  {
    stage: 4,
    agent: 'profile_maker',
    name: 'Unified Persona Synthesis',
    tool: 'mcp_profiler.build_and_store_profile',
    mcpServer: 'MCP Profiler (Port 8014)',
    scope: 'analysis:read, profiles:write',
    status: 'completed',
    duration: '190ms',
    token_id: 'tok_profiler_17004',
    signature: 'e9a3... (HMAC-SHA256)',
    result: {
      profile_id: 1,
      persona: 'Autonomous Agent & Backend Architect',
      search_keywords: ['AI Agent Engineer', 'Staff Backend Engineer', 'Distributed Systems Lead']
    }
  },
  {
    stage: 5,
    agent: 'opportunity_scout',
    name: 'Multi-Source Opportunity Scouting',
    tool: 'mcp_scout.scout_and_store_opportunities',
    mcpServer: 'MCP Scout (Port 8015)',
    scope: 'profiles:read, opportunities:write, web:search',
    status: 'completed',
    duration: '420ms',
    token_id: 'tok_scout_17005',
    signature: 'f2c7... (HMAC-SHA256)',
    result: {
      opportunities_discovered: 12,
      sources: ['Firecrawl Search', 'Stripe Jobs', 'Y Combinator', 'Devpost Hackathons'],
      categories: ['job', 'hackathon', 'internship']
    }
  },
  {
    stage: 6,
    agent: 'opportunity_ranker',
    name: 'Semantic Relevance Matching',
    tool: 'mcp_ranker.rank_and_store_opportunities',
    mcpServer: 'MCP Ranker (Port 8016)',
    scope: 'opportunities:read, ranked:write',
    status: 'completed',
    duration: '210ms',
    token_id: 'tok_ranker_17006',
    signature: 'd1b8... (HMAC-SHA256)',
    result: {
      top_matches: [
        { title: 'Senior AI Agent Engineer @ Stripe', match_score: 97 },
        { title: 'Distributed Systems Lead @ Antigravity', match_score: 95 },
        { title: 'Fullstack AI Specialist @ Google DeepMind', match_score: 92 }
      ]
    }
  },
  {
    stage: 7,
    agent: 'knowledge_builder',
    name: 'RAG Context Vector Search',
    tool: 'mcp_knowledge.build_knowledge_base',
    mcpServer: 'MCP Knowledge (Port 8017)',
    scope: 'embeddings:read, knowledge:write',
    status: 'completed',
    duration: '260ms',
    token_id: 'tok_knowledge_17007',
    signature: '9a4f... (HMAC-SHA256)',
    result: {
      vector_similarity_threshold: 0.85,
      relevant_chunks_retrieved: 4,
      context_length: '2,480 characters'
    }
  },
  {
    stage: 8,
    agent: 'resume_tailor',
    name: 'ATS Customization & PDF Export',
    tool: 'mcp_tailor.tailor_resume',
    mcpServer: 'MCP Tailor (Port 8018)',
    scope: 'knowledge:read, profiles:read, resumes:write',
    status: 'completed',
    duration: '380ms',
    token_id: 'tok_tailor_17008',
    signature: '7e2c... (HMAC-SHA256)',
    result: {
      tailored_target: 'Senior AI Agent Engineer @ Stripe',
      ats_score: '96/100',
      pdf_generated: 'Tailored_Resume_Stripe_Mohit.pdf',
      status: 'READY_TO_EXPORT'
    }
  }
];

export default function ExecutionTimeline() {
  const [stages, setStages] = useState(defaultStages);
  const [selectedStage, setSelectedStage] = useState(defaultStages[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [speed, setSpeed] = useState(1);

  const runFullPipeline = async () => {
    setIsRunning(true);
    const updated = stages.map((s) => ({ ...s, status: 'pending', duration: null }));
    setStages([...updated]);

    for (let i = 0; i < updated.length; i++) {
      setCurrentStepIndex(i);
      updated[i].status = 'running';
      setStages([...updated]);
      setSelectedStage(updated[i]);

      const delay = Math.max(300, (600 / speed));
      await new Promise((r) => setTimeout(r, delay));

      updated[i].status = 'completed';
      updated[i].duration = `${Math.floor(Math.random() * 150 + 200)}ms`;
      setStages([...updated]);
    }

    setIsRunning(false);
    setCurrentStepIndex(-1);
  };

  const stepNext = async () => {
    const nextIdx = stages.findIndex((s) => s.status === 'pending');
    if (nextIdx === -1) return;

    const updated = [...stages];
    updated[nextIdx].status = 'running';
    setStages([...updated]);
    setSelectedStage(updated[nextIdx]);

    await new Promise((r) => setTimeout(r, 400));
    updated[nextIdx].status = 'completed';
    updated[nextIdx].duration = `${Math.floor(Math.random() * 150 + 200)}ms`;
    setStages([...updated]);
  };

  const resetPipeline = () => {
    const reset = defaultStages.map((s) => ({ ...s, status: 'pending', duration: null }));
    setStages(reset);
    setSelectedStage(reset[0]);
    setCurrentStepIndex(-1);
    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
      case 'blocked':
        return <ShieldOff className="w-4 h-4 text-rose-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Main Pipeline Execution Card ───────────────────────────────── */}
      <GlassCard className="flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-lg shadow-indigo-500/10">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Autonomous 8-Agent Execution Pipeline (Problem 2 Trace)
              </h2>
              <p className="text-xs text-slate-400">
                End-to-end multi-agent flow governed by ArmorIQ cryptographic delegation tokens
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              <span className="text-slate-500 px-2">Speed:</span>
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded-lg ${speed === s ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button
              onClick={runFullPipeline}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'Running Pipeline...' : 'Run Autonomous Trace'}</span>
            </button>

            <button
              onClick={stepNext}
              disabled={isRunning || !stages.some((s) => s.status === 'pending')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 disabled:opacity-40 transition-all"
              title="Step Next Stage"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={resetPipeline}
              disabled={isRunning}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 disabled:opacity-40 transition-all"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Pipeline Steps */}
        <div className="p-6 overflow-x-auto custom-scrollbar bg-slate-950/40">
          <div className="flex items-start min-w-[960px] relative justify-between gap-2">
            {stages.map((stage, idx) => {
              const isSelected = selectedStage?.stage === stage.stage;
              const isLast = idx === stages.length - 1;

              return (
                <div key={idx} className="flex-1 relative flex flex-col items-center">
                  {!isLast && (
                    <div
                      className={`absolute top-5 left-1/2 w-full h-0.5 z-0 ${
                        stage.status === 'completed'
                          ? 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                          : stage.status === 'running'
                          ? 'bg-amber-500/60 border-t border-dashed border-amber-400'
                          : 'bg-slate-800'
                      }`}
                    />
                  )}

                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    onClick={() => setSelectedStage(stage)}
                    className={`relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center transition-all border shadow-lg ${
                      stage.status === 'completed'
                        ? 'bg-emerald-950/80 border-emerald-500/60 shadow-emerald-500/10'
                        : stage.status === 'running'
                        ? 'bg-amber-950/80 border-amber-500/80 shadow-amber-500/20 animate-pulse'
                        : 'bg-slate-900 border-slate-800'
                    } ${isSelected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-105' : ''}`}
                  >
                    {getStatusIcon(stage.status)}
                  </motion.button>

                  <div className="mt-3 flex flex-col items-center text-center px-1 max-w-[110px]">
                    <span className={`text-[11px] font-bold truncate w-full ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                      {stage.agent}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono truncate w-full mt-0.5">
                      Stage {stage.stage}
                    </span>
                    {stage.duration && (
                      <span className="mt-1.5 px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-900 border border-slate-800 text-emerald-400">
                        {stage.duration}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Stage Inspector Drawer */}
        {selectedStage && (
          <div className="border-t border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      Stage {selectedStage.stage}: {selectedStage.name}
                    </h3>
                    <Badge variant={selectedStage.status === 'completed' ? 'success' : selectedStage.status === 'running' ? 'warning' : 'outline'}>
                      {selectedStage.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Sub-Agent ID: <span className="text-cyan-300">{selectedStage.agent}</span> | MCP Server: <span className="text-indigo-300">{selectedStage.mcpServer}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>Token: {selectedStage.token_id}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delegated Scope Bounds</span>
                <div className="text-indigo-300 break-words">{selectedStage.scope}</div>
                <div className="text-[11px] text-slate-400">TTL: 300s (Auto-expires)</div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoked MCP Tool</span>
                <div className="text-cyan-300 font-bold break-words">{selectedStage.tool}()</div>
                <div className="text-[11px] text-slate-400">Signature: {selectedStage.signature}</div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Execution Timing</span>
                <div className="text-emerald-400 font-bold">{selectedStage.duration || 'Pending Execution'}</div>
                <div className="text-[11px] text-slate-400">Governance Gate: &lt;2ms</div>
              </div>
            </div>

            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Verified Output Payload</span>
                <span className="text-indigo-400 font-mono text-[10px]">Cryptographically Signed</span>
              </div>
              <pre className="text-xs font-mono text-indigo-200 overflow-x-auto custom-scrollbar">
                {JSON.stringify(selectedStage.result || { status: 'Awaiting execution' }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
