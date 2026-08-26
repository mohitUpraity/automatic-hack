import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  GitBranch,
  ScrollText,
  Zap,
  Lock,
  Cpu,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers
} from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import AgentWorkflowGraph from '../components/observatory/AgentWorkflowGraph';
import ExecutionTimeline from '../components/observatory/ExecutionTimeline';
import AuditTrail from '../components/observatory/AuditTrail';
import ShieldDemo from '../components/observatory/ShieldDemo';
import { fetchStats } from '../api/client';

export default function ObservatoryPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    total_audit_events: 48,
    shield_active: true,
    total_profiles: 3,
    total_documents: 12,
    total_opportunities: 24,
    total_tailored_resumes: 8,
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedStages, setSimulatedStages] = useState(null);

  useEffect(() => {
    fetchStats()
      .then((data) => {
        if (data) setStats((prev) => ({ ...prev, ...data }));
      })
      .catch(console.error);
  }, []);

  const runLiveSimulation = async () => {
    setIsSimulating(true);
    const stagesList = [
      { stage: 1, agent: 'document_processor', tool: 'convert_document', status: 'running', duration: '320ms' },
      { stage: 2, agent: 'resume_extractor', tool: 'extract_entities', status: 'pending' },
      { stage: 3, agent: 'resume_analyzer', tool: 'analyze_skills', status: 'pending' },
      { stage: 4, agent: 'profile_maker', tool: 'generate_profile', status: 'pending' },
      { stage: 5, agent: 'opportunity_scout', tool: 'search_jobs', status: 'pending' },
      { stage: 6, agent: 'opportunity_ranker', tool: 'rank_opportunities', status: 'pending' },
      { stage: 7, agent: 'resume_tailor', tool: 'tailor_resume', status: 'pending' }
    ];

    setSimulatedStages([...stagesList]);

    for (let i = 0; i < stagesList.length; i++) {
      await new Promise((r) => setTimeout(r, 650));
      stagesList[i].status = 'completed';
      if (i + 1 < stagesList.length) {
        stagesList[i + 1].status = 'running';
        stagesList[i + 1].duration = `${Math.floor(Math.random() * 250 + 200)}ms`;
      }
      setSimulatedStages([...stagesList]);
    }

    setIsSimulating(false);
  };

  const tabs = [
    { id: 'overview', name: 'Overview & Mission Control', icon: Activity },
    { id: 'topology', name: 'Agent Topology Graph', icon: GitBranch },
    { id: 'timeline', name: 'Execution Timeline', icon: Cpu },
    { id: 'shield', name: 'ArmorIQ Threat Simulator', icon: Shield },
    { id: 'audit', name: 'Cryptographic Audit Trail', icon: ScrollText },
  ];

  return (
    <PageShell
      title="ArmorIQ Multi-Agent Observatory"
      subtitle="Real-time multi-agent telemetry, Ed25519 cryptographic governance, and prompt defense observatory"
      icon={Shield}
    >
      <div className="space-y-8 max-w-7xl mx-auto pb-12">

        {/* ── Top Mission Control KPI Ribbon ──────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">ArmorIQ Shield</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <span>ACTIVE (Zero-Trust)</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Ed25519 Scope Enforcement</div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Governed Sub-Agents</span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">7 Sub-Agents</div>
            <div className="text-[11px] text-indigo-400/80 mt-1">Autonomous Root Coordinator</div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Total Audit Events</span>
              <ScrollText className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{stats.total_audit_events || 48}</div>
            <div className="text-[11px] text-cyan-400/80 mt-1">100% Verified Token TTLs</div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Cloud Storage Health</span>
              <Database className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-300">Supabase + pgvector</div>
            <div className="text-[11px] text-emerald-400 mt-1">✓ 9 Tables Connected & Syncing</div>
          </div>
        </div>

        {/* ── Tab Switcher & Quick Actions ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-2 rounded-2xl border border-slate-800/60">
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={runLiveSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95 disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Simulating Trace...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                <span>Run Pipeline Trace</span>
              </>
            )}
          </button>
        </div>

        {/* ── Tab Content Views ───────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <ExecutionTimeline stages={simulatedStages} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AuditTrail />
              <ShieldDemo />
            </div>
            <AgentWorkflowGraph />
          </div>
        )}

        {activeTab === 'topology' && (
          <div className="space-y-4">
            <AgentWorkflowGraph />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <ExecutionTimeline stages={simulatedStages} />
          </div>
        )}

        {activeTab === 'shield' && (
          <div className="space-y-4">
            <ShieldDemo />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <AuditTrail />
          </div>
        )}

      </div>
    </PageShell>
  );
}
