import React, { useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Bot,
  Crown,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Zap,
  Key,
  Lock,
  Layers,
  ExternalLink,
  Shield,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import { fetchAdkGraph } from '../../api/client';

const AgentNode = ({ data }) => {
  return (
    <div
      onClick={() => data.onSelect && data.onSelect(data)}
      className="relative flex flex-col p-4 w-64 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl hover:border-indigo-500/80 transition-all cursor-pointer group"
    >
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 !bg-indigo-400" />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-100 truncate">{data.name}</h3>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
          {data.keyType || 'Ed25519'}
        </span>
      </div>

      <p className="text-[11px] text-slate-400 mb-3 line-clamp-2 leading-relaxed">
        {data.description}
      </p>

      <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-slate-800/80">
        {data.tools?.slice(0, 2).map((tool, idx) => (
          <span
            key={idx}
            className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-950 text-slate-300 border border-slate-800"
          >
            {typeof tool === 'string' ? tool : tool.name}
          </span>
        ))}
        {data.tools?.length > 2 && (
          <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-950 text-slate-500 border border-slate-800">
            +{data.tools.length - 2} more
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 !bg-indigo-500" />
    </div>
  );
};

const RootNode = ({ data }) => {
  return (
    <div
      onClick={() => data.onSelect && data.onSelect(data)}
      className="relative flex flex-col items-center justify-center p-5 w-80 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-700 border-2 border-indigo-300/50 shadow-2xl shadow-indigo-500/30 cursor-pointer hover:scale-105 transition-transform"
    >
      <div className="absolute -top-4 bg-slate-950 rounded-full p-2 border border-indigo-400 shadow-lg">
        <Crown className="w-5 h-5 text-amber-400" />
      </div>
      <h2 className="text-base font-extrabold text-white mt-1">{data.name}</h2>
      <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-200 mt-0.5">
        Master Intent Planner & Signer
      </span>
      <p className="text-xs text-indigo-100 text-center mt-2 leading-snug">
        {data.description}
      </p>
      <div className="mt-3 flex items-center gap-2 text-[10px] font-mono bg-slate-950/40 px-3 py-1 rounded-full text-indigo-200 border border-indigo-400/30">
        <Lock className="w-3 h-3 text-emerald-300" />
        <span>capture_plan() Active</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-white" />
    </div>
  );
};

const nodeTypes = {
  agent: AgentNode,
  root: RootNode,
};

export default function AgentWorkflowGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSelectNode = (nodeData) => {
    setSelectedAgent(nodeData);
  };

  useEffect(() => {
    const loadGraph = async () => {
      try {
        const data = await fetchAdkGraph();
        const root = data?.root_agent || {
          name: 'root_coordinator_agent',
          description: 'CareerOS Root Coordinator delegating authority with Ed25519 tokens',
          sub_agents: []
        };

        const initialNodes = [
          {
            id: 'root',
            type: 'root',
            position: { x: 450, y: 20 },
            data: {
              name: root.name || 'root_coordinator_agent',
              description: root.description,
              keyType: 'RSA-4096 / Master',
              publicKey: 'pub_root_master_0x8f21e',
              scopes: ['all:orchestrate', 'tokens:sign', 'plans:capture'],
              tools: [{ name: 'capture_plan' }, { name: 'delegate' }],
              onSelect: handleSelectNode
            }
          }
        ];

        const initialEdges = [];

        const defaultSubAgents = [
          { name: 'document_processor', description: 'Processes PDF/DOCX, splits chunks & generates embeddings', tools: [{ name: 'convert_document' }, { name: 'embed_chunks' }], scopes: ['documents:write', 'embeddings:write'], keyType: 'Ed25519-01' },
          { name: 'resume_extractor', description: 'Extracts structured candidate fields & entities', tools: [{ name: 'extract_resume' }], scopes: ['resumes:write'], keyType: 'Ed25519-02' },
          { name: 'resume_analyzer', description: 'Evaluates skills gaps, strengths & domain scores', tools: [{ name: 'analyze_resume' }], scopes: ['resumes:read', 'analysis:write'], keyType: 'Ed25519-03' },
          { name: 'profile_maker', description: 'Builds unified candidate profile & search targets', tools: [{ name: 'build_profile' }], scopes: ['analysis:read', 'profiles:write'], keyType: 'Ed25519-04' },
          { name: 'opportunity_scout', description: 'Searches jobs, hackathons & bounties via Firecrawl', tools: [{ name: 'scout_jobs' }], scopes: ['profiles:read', 'opportunities:write', 'web:search'], keyType: 'Ed25519-05' },
          { name: 'opportunity_ranker', description: 'Ranks discovered opportunities with semantic relevance', tools: [{ name: 'rank_jobs' }], scopes: ['opportunities:read', 'ranked:write'], keyType: 'Ed25519-06' },
          { name: 'knowledge_builder', description: 'Executes pgvector RAG vector searches over docs', tools: [{ name: 'rag_search' }], scopes: ['embeddings:read', 'knowledge:write'], keyType: 'Ed25519-07' },
          { name: 'resume_tailor', description: 'Generates tailored LaTeX/Markdown resume & PDF', tools: [{ name: 'tailor_resume' }], scopes: ['knowledge:read', 'profiles:read', 'resumes:write'], keyType: 'Ed25519-08' },
        ];

        const subList = (root.sub_agents && root.sub_agents.length > 0) ? root.sub_agents : defaultSubAgents;

        subList.forEach((agent, index) => {
          const row = Math.floor(index / 4);
          const col = index % 4;

          const agentData = {
            name: agent.name,
            description: agent.description,
            tools: agent.tools || [],
            scopes: agent.scopes || ['delegated:scope'],
            keyType: agent.keyType || `Ed25519-0${index + 1}`,
            publicKey: `pub_${agent.name}_0x${Math.random().toString(16).substr(2, 8)}`,
            onSelect: handleSelectNode
          };

          initialNodes.push({
            id: `agent-${index}`,
            type: 'agent',
            position: { x: col * 280, y: 220 + row * 220 },
            data: agentData
          });

          initialEdges.push({
            id: `edge-root-${index}`,
            source: 'root',
            target: `agent-${index}`,
            animated: true,
            label: 'delegate() [300s]',
            style: { stroke: '#6366f1', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#6366f1',
            },
            labelStyle: { fill: '#818cf8', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' },
            labelBgStyle: { fill: '#030712', fillOpacity: 0.9 },
            labelBgPadding: [6, 3],
            labelBgBorderRadius: 6
          });
        });

        setNodes(initialNodes);
        setEdges(initialEdges);
      } catch (e) {
        console.error('Error loading graph:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadGraph();
  }, [setNodes, setEdges]);

  return (
    <div className="space-y-6">
      <GlassCard className="flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Multi-Agent Cryptographic Topology & Delegation Graph
              </h2>
              <p className="text-xs text-slate-400">
                Interactive visualization of Root Coordinator $\to$ 8 Governed Sub-Agents with Ed25519 token boundaries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>8 Sub-Agents • 5 MCP Servers</span>
          </div>
        </div>

        {/* Flow Canvas */}
        <div className="w-full h-[520px] bg-slate-950 relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              className="dark"
            >
              <Background color="rgba(99, 102, 241, 0.08)" gap={20} size={1} />
              <Controls className="bg-slate-900 border-slate-700 fill-slate-300" />
              <MiniMap
                nodeColor="#4f46e5"
                maskColor="rgba(15, 23, 42, 0.8)"
                className="bg-slate-950 border border-slate-800 rounded-xl"
              />
            </ReactFlow>
          )}
        </div>

        {/* Node Detail Side Drawer / Inspector */}
        <AnimatePresence>
          {selectedAgent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-800 bg-slate-900/80 p-5 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">
                    Agent Cryptographic Identity Inspector: <span className="text-cyan-300 font-mono">{selectedAgent.name}</span>
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs font-mono">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Keypair & Algorithm</div>
                  <div className="text-indigo-300 font-bold">{selectedAgent.keyType || 'Ed25519 / SHA-256'}</div>
                  <div className="text-slate-400 text-[11px] truncate">Fingerprint: {selectedAgent.publicKey || '0x49f2b8...'}</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Authorized Scopes</div>
                  <div className="text-emerald-300 truncate">
                    {Array.isArray(selectedAgent.scopes) ? selectedAgent.scopes.join(', ') : 'delegated:scope'}
                  </div>
                  <div className="text-slate-400 text-[11px]">Token Validity: 300s TTL</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Whitelisted MCP Tools</div>
                  <div className="text-cyan-300 truncate">
                    {selectedAgent.tools?.map((t) => (typeof t === 'string' ? t : t.name)).join(', ') || 'none'}
                  </div>
                  <div className="text-slate-400 text-[11px]">Zero-Trust Gated</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
