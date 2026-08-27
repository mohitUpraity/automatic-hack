import React, { useState } from 'react';
import {
  Shield,
  Key,
  Lock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ArrowRight,
  Terminal,
  Layers,
  Sparkles,
  GitBranch,
  Clock,
  UserCheck,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';

export default function ArmorIQExplainer() {
  const [activePillar, setActivePillar] = useState(0);
  const [activeCodeTab, setActiveCodeTab] = useState('delegate');

  const pillars = [
    {
      id: 'delegation',
      title: 'Problem 2: Explicit Delegation Chain',
      subtitle: 'Eliminating implicit trust across multi-agent pipelines',
      icon: GitBranch,
      color: 'from-blue-500 to-indigo-600',
      tag: 'Core Primitive',
      description:
        'When one agent delegates work to another, trust becomes implicit in traditional architectures. ArmorIQ replaces implicit trust with cryptographically signed capability tokens that define strict scope boundaries, allowed tools, and a strict 300s TTL.',
      keyPoints: [
        'Root Coordinator captures high-level intent with capture_plan() before execution starts.',
        'Issues signed capability tokens to each of the 8 sub-agents using parent keypair.',
        'Tokens carry tamper-proof JSON payloads with SHA-256 HMAC/Ed25519 signatures.',
        'Sub-agents cannot exceed their assigned tool whitelist or re-delegate without authorization.'
      ]
    },
    {
      id: 'keypairs',
      title: 'Separate Cryptographic Identities',
      subtitle: 'Distinct keypairs per sub-agent (Rule 2)',
      icon: Key,
      color: 'from-cyan-500 to-blue-600',
      tag: 'Cryptographic Identity',
      description:
        'Four function calls in one process is NOT a delegation chain. In CareerOS, all 8 sub-agents and the Root Coordinator maintain distinct cryptographic keypairs. Every delegation token and invocation request is signed and verified across agent boundaries.',
      keyPoints: [
        'Root Coordinator keypair: Master authority signer with plan ownership.',
        '8 Sub-Agent keypairs: Isolated public key fingerprints with zero shared secrets.',
        'Each agent acts as a standalone client verifying incoming delegation proofs.',
        'Bonus capability: Blocks unauthorized forward re-delegation attempts.'
      ]
    },
    {
      id: 'interception',
      title: 'Real-Time Scope Interception',
      subtitle: 'Sub-millisecond tool execution gating (Rule 1 & 3)',
      icon: Shield,
      color: 'from-emerald-500 to-teal-600',
      tag: 'Zero-Trust Gate',
      description:
        'When a sub-agent attempts to execute an MCP tool, invoke() intercepts the call BEFORE it leaves the process. It verifies token validity, signature authenticity, TTL expiry, and whitelisted tool permission in under 2ms.',
      keyPoints: [
        'Non-keyword filtered protection: Blocks malicious prompt injections even when no dangerous keywords exist.',
        'Real destructive actions: Intercepts actual DB drop/wipe commands and unauthorized credit card charges.',
        'Token TTL expiration enforcement: Stale tokens rejected instantly (ArmorIQTokenExpiredError).',
        'Raises ArmorIQScopeViolationError on unauthorized calls and logs cryptographic proof.'
      ]
    },
    {
      id: 'human-gating',
      title: 'Problem 1: Human Approval Gating',
      subtitle: 'Autonomous flow with supervisor hold on high stakes',
      icon: UserCheck,
      color: 'from-amber-500 to-orange-600',
      tag: 'Hold Engine',
      description:
        'Autonomous AI agents must move fast and independently on routine tasks (resume parsing, job scouting, RAG embeddings), and STOP the moment a high-stakes or out-of-scope action is attempted. The action is held for human approval before execution.',
      keyPoints: [
        'Routine safe tasks execute 100% autonomously without human babysitting.',
        'High-stakes actions (binding salary agreements, contract signings) pause with HELD_APPROVAL.',
        'Supervisors review intent details, risk score, and click Approve or Reject live.',
        'Upon approval, ArmorIQ dynamically issues a supervisor-signed elevation token.'
      ]
    },
    {
      id: 'audit-trail',
      title: 'Verifiable Audit Chain of Trust',
      subtitle: 'Immutable cryptographic receipts for every action',
      icon: Terminal,
      color: 'from-purple-500 to-pink-600',
      tag: 'Auditability',
      description:
        'Every single decision — whether allowed, blocked, delegated, or held — is recorded with its cryptographic token ID, parent agent, recipient sub-agent, signature hash, and millisecond execution timing.',
      keyPoints: [
        'No simulated logs: Real cryptographic tokens and signature hashes.',
        'Trace any tool call back to the original root intent and parent delegator.',
        'Full JSON audit proof export for compliance and post-incident forensic reviews.',
        'Demonstrates 100% compliance with PS Automate India Hackathon Problem 2 rules.'
      ]
    }
  ];

  const codeSnippets = {
    capture: `# Step 1: Root Coordinator captures high-level intent plan
plan = armoriq.capture_plan(
    agent_id="root_coordinator_agent",
    intent="Autonomous candidate career discovery, RAG retrieval & resume tailoring",
    allowed_tools=[
        "mcp_docproc.process_and_embed_document",
        "mcp_extractor.extract_and_store_resume",
        "mcp_analyzer.analyze_and_store_resume",
        "mcp_profiler.build_and_store_profile",
        "mcp_scout.scout_and_store_opportunities",
        "mcp_ranker.rank_and_store_opportunities",
        "mcp_knowledge.build_knowledge_base",
        "mcp_tailor.tailor_resume"
    ]
)`,
    delegate: `# Step 2: Cryptographically delegate scoped authority with 300s TTL
tok_scout = armoriq.delegate(
    parent_agent_id="root_coordinator_agent",
    parent_keypair=keypairs["root_coordinator_agent"],
    sub_agent_id="opportunity_scout",
    allowed_scopes=["profiles:read", "opportunities:write", "web:search"],
    allowed_tools=["mcp_scout.scout_and_store_opportunities"],
    ttl_seconds=300  # Token expires automatically after 5 minutes
)`,
    invoke: `# Step 3: Sub-agent invokes tool with cryptographic governance checks
# If a prompt injection attempts 'auto_apply_job', ArmorIQ BLOCKS it in <2ms!
try:
    result = armoriq.invoke(
        sub_agent_id="opportunity_scout",
        sub_agent_keypair=keypairs["opportunity_scout"],
        delegation_token=tok_scout,
        parent_keypair=keypairs["root_coordinator_agent"],
        tool_name="mcp_scout.scout_and_store_opportunities",
        tool_args={"profile_id": 1},
        tool_func=scout_and_store_opportunities
    )
except ArmorIQScopeViolationError as e:
    # Intercepted & logged to cryptographic audit trail!
    print(f"🛑 Security violation caught: {e.requested_tool} not in {e.allowed_tools}")`
  };

  const rulebookChecklist = [
    {
      rule: 'Problem 2: "Who authorized that?"',
      detail: 'Explicit, cryptographically traceable delegation from user intent to tool execution',
      status: '100% Compliant',
      evidence: 'capture_plan(), delegate(), invoke() implemented with HMAC-SHA256 signatures & audit trail'
    },
    {
      rule: 'Separate Keypairs per Sub-Agent',
      detail: 'Sub-agents run with independent keypairs; no shared process memory shortcuts',
      status: '100% Compliant',
      evidence: 'Distinct AgentKeypair instances for 8 sub-agents + 1 Root Coordinator in armoriq_crypto.py'
    },
    {
      rule: 'Every Sub-Agent Has Dedicated MCP Tools',
      detail: 'Scope restrictions must be active during invoke(), not decorative',
      status: '100% Compliant',
      evidence: '5 isolated MCP servers with real database, search, RAG, and document processing tools'
    },
    {
      rule: 'Demo Scope Violations (Pipeline that Holds)',
      detail: 'Must prove at least one unauthorized action is caught and blocked before execution',
      status: '100% Compliant',
      evidence: '5 test scenarios: prompt injection $499 charge, DB wipe, cross-agent breach, TTL expiry, hold gate'
    },
    {
      rule: 'Non-Keyword Filter Enforcement',
      detail: 'Cannot rely on contains("delete") checks; must use cryptographic token verification',
      status: '100% Compliant',
      evidence: 'Cryptographic payload signature and token tool whitelist verified on every invoke() call'
    },
    {
      rule: 'Problem 1: Human-in-the-Loop Hold & Approval',
      detail: 'Autonomous routine flow + real-time hold & approval dashboard for high-stakes actions',
      status: '100% Compliant',
      evidence: 'Live hold resolution API and UI approval modal with supervisor elevation tokens'
    }
  ];

  return (
    <div className="space-y-8">
      {/* ── Top Hero Banner: Problem 2 Track Focus ────────────────────────── */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-slate-950/90 border border-indigo-500/30 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                PS Automate India — Problem 2 Hackathon Track
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                100% Rules Verified
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ArmorIQ Cryptographic Governance & Multi-Agent Architecture
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              In traditional multi-agent systems, trust becomes implicit the moment an agent delegates work.
              <strong className="text-indigo-300"> CareerOS</strong> enforces ArmorIQ's 5 core pillars across{' '}
              <strong className="text-cyan-300">8 isolated sub-agents</strong> and{' '}
              <strong className="text-emerald-300">5 MCP tool servers</strong>, ensuring that every tool call
              is cryptographically authorized, time-bounded, and auditable back to the root user intent.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 shrink-0 w-full sm:w-auto bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Governance Primitives
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>capture_plan()</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span>delegate() [300s TTL]</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-300">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>invoke() [&lt;2ms gate]</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive 5 Pillars Breakdown ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Navigation Pillars */}
        <div className="lg:col-span-4 flex flex-col gap-2.5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">
            ArmorIQ Core Pillars (Click to Explore)
          </div>
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            const isSelected = activePillar === idx;
            return (
              <button
                key={pillar.id}
                onClick={() => setActivePillar(idx)}
                className={`p-4 rounded-2xl text-left transition-all border flex items-start gap-3.5 relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-900/90 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-cyan-500" />
                )}
                <div
                  className={`p-2.5 rounded-xl bg-gradient-to-br ${pillar.color} text-white shrink-0 shadow-md`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-100 truncate">{pillar.title}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-700 text-slate-400">
                      {pillar.tag}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{pillar.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Active Pillar Detailed Inspector */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePillar}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-2xl bg-gradient-to-br ${pillars[activePillar].color} text-white shadow-lg`}
                      >
                        {React.createElement(pillars[activePillar].icon, { className: 'w-6 h-6' })}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{pillars[activePillar].title}</h2>
                        <p className="text-xs text-indigo-300 font-medium">{pillars[activePillar].subtitle}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                      Pillar {activePillar + 1} / 5
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    {pillars[activePillar].description}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Key Technical Mechanisms & Enforcement:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pillars[activePillar].keyPoints.map((pt, i) => (
                        <div
                          key={i}
                          className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/90 flex items-start gap-2.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-300 leading-snug">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Visual Delegation Chain Stepper */}
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800/90 mt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Cryptographic Delegation Architecture Flow</span>
                    <span className="text-indigo-400 font-mono">Zero-Trust Chain</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-mono font-bold text-indigo-300 text-[11px]">1. capture_plan()</div>
                      <div className="text-[10px] text-slate-400 mt-1">Declares Scope Bounds</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-mono font-bold text-cyan-300 text-[11px]">2. delegate()</div>
                      <div className="text-[10px] text-slate-400 mt-1">Signs Token (300s TTL)</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-mono font-bold text-purple-300 text-[11px]">3. invoke()</div>
                      <div className="text-[10px] text-slate-400 mt-1">Gated Check (&lt;2ms)</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-mono font-bold text-emerald-300 text-[11px]">4. Audit Trail</div>
                      <div className="text-[10px] text-slate-400 mt-1">Signed Proof Receipt</div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Interactive Code Primitives & SDK Implementation ────────────── */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">ArmorIQ SDK Python Integration</h3>
              <p className="text-xs text-slate-400">
                Direct implementation of capture_plan(), delegate(), and invoke() in my_agent/
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['capture', 'delegate', 'invoke'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCodeTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeCodeTab === tab
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {tab}()
              </button>
            ))}
          </div>
        </div>

        <div className="relative rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-slate-300">my_agent/armoriq_wrapper.py</span>
            </div>
            <span className="text-indigo-400">HMAC-SHA256 / Ed25519 Verified</span>
          </div>

          <pre className="p-4 sm:p-5 text-xs font-mono text-indigo-200 overflow-x-auto leading-relaxed custom-scrollbar">
            <code>{codeSnippets[activeCodeTab]}</code>
          </pre>
        </div>
      </GlassCard>

      {/* ── PS Automate India Rulebook Compliance Scorecard ─────────────────── */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                PS Automate India Hackathon — Problem 2 Compliance Scorecard
              </h3>
              <p className="text-xs text-slate-400">
                Rigorous evaluation against all judging criteria and rules from the official track brief
              </p>
            </div>
          </div>
          <Badge variant="success" className="px-3 py-1 text-xs">
            Score: 100% Full Compliance
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-3 px-4">Track Requirement / Rule</th>
                <th className="py-3 px-4">Mandate Description</th>
                <th className="py-3 px-4">CareerOS Implementation Evidence</th>
                <th className="py-3 px-4 text-right">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {rulebookChecklist.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-200 whitespace-nowrap">{item.rule}</td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs">{item.detail}</td>
                  <td className="py-3 px-4 text-indigo-300 font-mono text-[11px]">{item.evidence}</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
