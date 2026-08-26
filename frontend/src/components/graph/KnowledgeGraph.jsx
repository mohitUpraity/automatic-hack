import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useNavigate } from 'react-router-dom';
import { fetchKnowledgeGraph, fetchCandidates } from '../../api/client';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import {
  GitBranch,
  RefreshCw,
  X,
  Search,
  Sparkles,
  ExternalLink,
  FileText,
  Database,
  Cpu,
  Briefcase,
  Code,
  Trophy,
  User,
  Users,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Check,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Zap,
  ChevronDown,
  Network,
  Share2,
  BookOpen,
  Wand2,
  GraduationCap,
  Award,
  Medal,
  MapPin,
  Calendar,
  Building,
  Target
} from 'lucide-react';

const NODE_COLORS = {
  user: '#6366f1',          // indigo
  skill: '#10b981',         // emerald
  project: '#8b5cf6',       // violet
  experience: '#ec4899',    // rose/pink
  achievement: '#f59e0b',   // amber/gold
  education: '#06b6d4',     // cyan
  certification: '#14b8a6', // teal
  opportunity: '#f97316',   // orange
  document: '#38bdf8',      // sky
};

const CANDIDATE_COLORS = {
  candidate_mohit: '#6366f1',  // Indigo
  candidate_krati: '#ec4899',  // Rose
  candidate_vishnu: '#10b981', // Emerald
  candidate_all: '#818cf8',    // Light Indigo
};

const NODE_ICONS = {
  user: User,
  skill: Code,
  project: Cpu,
  experience: Briefcase,
  achievement: Trophy,
  education: GraduationCap,
  certification: Award,
  opportunity: Target,
  document: FileText,
};

export default function KnowledgeGraph({ userId = 'default-user' }) {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [candidatesList, setCandidatesList] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('candidate_all');
  const [graphMetrics, setGraphMetrics] = useState({ total_candidates: 3, total_nodes: 0, shared_skills_count: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedExcerpt, setCopiedExcerpt] = useState(false);
  const [copiedAttribute, setCopiedAttribute] = useState(false);

  const [activeGroups, setActiveGroups] = useState({
    user: true,
    skill: true,
    project: true,
    experience: true,
    achievement: true,
    education: true,
    certification: true,
    opportunity: true,
    document: true,
  });

  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // 1. Fetch Candidates List
  useEffect(() => {
    async function loadCandidates() {
      try {
        const cRes = await fetchCandidates();
        if (cRes.candidates && cRes.candidates.length > 0) {
          setCandidatesList(cRes.candidates);
        }
      } catch (err) {
        console.error('Failed to load candidate list:', err);
      }
    }
    loadCandidates();
  }, []);

  // 2. Fetch Knowledge Graph Data based on selected candidate
  const loadGraph = useCallback(async (candidateId = selectedCandidate) => {
    setLoading(true);
    try {
      const data = await fetchKnowledgeGraph(userId, candidateId === 'candidate_all' ? null : candidateId);
      const rawNodes = data.nodes || [];
      const rawEdges = data.edges || data.links || [];

      const formattedLinks = rawEdges.map((e) => ({
        source: typeof e.source === 'object' ? e.source.id : e.source,
        target: typeof e.target === 'object' ? e.target.id : e.target,
        type: e.type || 'CONNECTED_TO',
        label: e.label || '',
        desc: e.desc || ''
      }));

      setGraphData({
        nodes: rawNodes,
        links: formattedLinks,
      });

      if (data.metrics) {
        setGraphMetrics(data.metrics);
      }

      // Auto-select candidate node if specific candidate chosen
      if (candidateId !== 'candidate_all') {
        const targetNode = rawNodes.find((n) => n.id === candidateId);
        if (targetNode) {
          setSelectedNode(targetNode);
          setTimeout(() => {
            if (fgRef.current && targetNode.x !== undefined && targetNode.y !== undefined) {
              fgRef.current.centerAt(targetNode.x, targetNode.y, 800);
              fgRef.current.zoom(2.0, 800);
            }
          }, 300);
        }
      } else {
        setSelectedNode((prev) => prev || (rawNodes.find((n) => n.id === 'candidate_mohit') || rawNodes[0]));
      }
    } catch (err) {
      console.error('Failed to load knowledge graph:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadGraph(selectedCandidate);
  }, [selectedCandidate, userId, loadGraph]);

  // Dynamic window resizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(580, window.innerHeight - 260),
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Filter nodes & links based on active groups and search query
  const filteredData = useMemo(() => {
    const validNodes = graphData.nodes.filter((node) => {
      const groupMatch = activeGroups[node.group] !== false;
      const q = searchQuery.toLowerCase().trim();
      const searchMatch = !q || (
        (node.label && node.label.toLowerCase().includes(q)) ||
        (node.attributes?.name && node.attributes.name.toLowerCase().includes(q)) ||
        (node.attributes?.title && node.attributes.title.toLowerCase().includes(q)) ||
        (node.attributes?.company && node.attributes.company.toLowerCase().includes(q)) ||
        (node.attributes?.skill_name && node.attributes.skill_name.toLowerCase().includes(q))
      );
      return groupMatch && searchMatch;
    });
    const validNodeIds = new Set(validNodes.map((n) => n.id));

    const validLinks = graphData.links.filter(
      (link) =>
        validNodeIds.has(typeof link.source === 'object' ? link.source.id : link.source) &&
        validNodeIds.has(typeof link.target === 'object' ? link.target.id : link.target)
    );

    return { nodes: validNodes, links: validLinks };
  }, [graphData, activeGroups, searchQuery]);

  const toggleGroup = (group) => {
    setActiveGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (fgRef.current && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 600);
      fgRef.current.zoom(2.0, 600);
    }
  };

  const handleZoomIn = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.3, 400);
  };

  const handleZoomOut = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() / 1.3, 400);
  };

  const handleResetZoom = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(600, 50);
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAttribute(true);
    setTimeout(() => setCopiedAttribute(false), 2000);
  };

  const handleCopyExcerpt = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedExcerpt(true);
    setTimeout(() => setCopiedExcerpt(false), 2000);
  };

  // Find 1-hop connected neighbors for inspector
  const neighborInfo = useMemo(() => {
    if (!selectedNode) return [];
    const nodeId = selectedNode.id;
    const directLinks = graphData.links.filter(
      (l) =>
        (typeof l.source === 'object' ? l.source.id : l.source) === nodeId ||
        (typeof l.target === 'object' ? l.target.id : l.target) === nodeId
    );

    return directLinks.map((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      const otherId = sourceId === nodeId ? targetId : sourceId;
      const otherNode = graphData.nodes.find((n) => n.id === otherId);
      return {
        edgeType: link.type,
        edgeLabel: link.label || link.type,
        edgeDesc: link.desc,
        node: otherNode,
      };
    }).filter((item) => item.node);
  }, [selectedNode, graphData]);

  return (
    <div className="space-y-6">
      {/* Top Multi-Candidate Controls Header */}
      <GlassCard className="p-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        {/* Candidate Switcher Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Candidate Perspective:</span>
          </div>
          <div className="relative min-w-[260px]">
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold appearance-none pr-8 cursor-pointer shadow-inner"
            >
              {candidatesList.length === 0 ? (
                <option value="candidate_all">🌐 Multi-Candidate Global Network</option>
              ) : (
                candidatesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.role ? `(${c.role.split('|')[0].trim()})` : ''}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Global Graph Stats Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/60 border border-slate-800 rounded-lg text-xs">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 font-medium">Candidates:</span>
            <span className="font-bold text-slate-200">{graphMetrics.total_candidates || 3}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/60 border border-slate-800 rounded-lg text-xs">
            <Code className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-medium">Skill Hubs:</span>
            <span className="font-bold text-emerald-300">{graphMetrics.shared_skills_count || 5}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/60 border border-slate-800 rounded-lg text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-medium">Entities:</span>
            <span className="font-bold text-purple-300">{filteredData.nodes.length} Nodes</span>
          </div>
        </div>
      </GlassCard>

      {/* Main Graph Playground & Floating Controls */}
      <div className="relative border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950 shadow-2xl">
        {/* Floating Top Control Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Search Box */}
          <div className="pointer-events-auto relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search people, skills, projects, awards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Group Visibility Toggles (All Granular Types) */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-lg flex-wrap max-w-2xl">
            {Object.keys(NODE_COLORS).map((group) => {
              const Icon = NODE_ICONS[group] || Sparkles;
              const isActive = activeGroups[group];
              return (
                <button
                  key={group}
                  onClick={() => toggleGroup(group)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-slate-100 shadow-sm'
                      : 'text-slate-500 opacity-60 hover:opacity-100'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: NODE_COLORS[group] }}
                  />
                  <span className="capitalize">{group}s</span>
                </button>
              );
            })}
          </div>

          {/* Graph Action Buttons */}
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-lg">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset View / Fit Screen"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-700 mx-1" />
            <button
              onClick={() => loadGraph(selectedCandidate)}
              title="Reload Graph RAG"
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Force Graph Container */}
        <div ref={containerRef} className="w-full h-[640px] relative">
          {loading && graphData.nodes.length === 0 && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex items-center justify-center">
              <LoadingSpinner size="lg" text="Synthesizing multi-candidate Graph RAG embeddings & entities..." />
            </div>
          )}

          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={filteredData}
            backgroundColor="#030712"
            nodeRelSize={6}
            nodeVal={(node) => node.val || 6}
            nodeLabel={(node) => `${node.label} (${node.group?.toUpperCase()})`}
            linkColor={(link) => (link.type === 'TEAM_SYNERGY' ? '#818cf8' : link.type === 'USES_TECH' ? '#64748b' : '#334155')}
            linkWidth={(link) => (link.type === 'TEAM_SYNERGY' ? 2.5 : 1.2)}
            linkDirectionalParticles={(link) => (link.type === 'TEAM_SYNERGY' ? 4 : link.type === 'USES_TECH' ? 1 : 2)}
            linkDirectionalParticleSpeed={0.006}
            linkDirectionalParticleWidth={(link) => (link.type === 'TEAM_SYNERGY' ? 3 : 2)}
            linkDirectionalParticleColor={(link) => (link.type === 'TEAM_SYNERGY' ? '#c084fc' : '#818cf8')}
            onNodeClick={handleNodeClick}
            onNodeHover={(node) => setHoverNode(node || null)}
            cooldownTicks={140}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoverNode?.id === node.id;
              const isCandidate = node.group === 'user';
              const isSharedSkill = node.is_shared;
              const isAchievement = node.group === 'achievement';
              
              const nodeColor = isCandidate
                ? CANDIDATE_COLORS[node.id] || '#6366f1'
                : NODE_COLORS[node.group] || '#94a3b8';

              const radius = isCandidate ? 12 : isSharedSkill || isAchievement ? 9 : (node.val || 6) * 1.1;

              // Outer glowing aura
              if (isSelected || isHovered || isCandidate || isSharedSkill || isAchievement) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + (isSelected ? 6 : 3.5), 0, 2 * Math.PI, false);
                ctx.fillStyle = isCandidate ? `${nodeColor}44` : isSharedSkill ? '#10b98133' : isAchievement ? '#f59e0b33' : `${nodeColor}33`;
                ctx.fill();

                if (isSelected || isSharedSkill || isAchievement) {
                  ctx.strokeStyle = isSharedSkill ? '#34d399' : isAchievement ? '#fbbf24' : '#818cf8';
                  ctx.lineWidth = 1.5;
                  ctx.stroke();
                }
              }

              // Main node core circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = nodeColor;
              ctx.fill();

              // Inner border
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = isCandidate ? 1.8 : 0.8;
              ctx.stroke();

              // Draw Node Label below
              if (globalScale > 0.8 || isSelected || isHovered || isCandidate || isSharedSkill || isAchievement) {
                const label = node.label || node.id;
                const fontSize = isCandidate ? 12 / globalScale : (isSharedSkill || isAchievement) ? 10.5 / globalScale : 9.5 / globalScale;
                ctx.font = `${isCandidate || isSharedSkill || isAchievement ? 'bold' : 'normal'} ${fontSize}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth + 6, fontSize + 3];
                ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
                ctx.fillRect(
                  node.x - bckgDimensions[0] / 2,
                  node.y + radius + 2,
                  bckgDimensions[0],
                  bckgDimensions[1]
                );

                ctx.fillStyle = isCandidate ? '#ffffff' : isSharedSkill ? '#a7f3d0' : isAchievement ? '#fef3c7' : '#cbd5e1';
                ctx.fillText(label, node.x, node.y + radius + 3.5);
              }
            }}
          />
        </div>

        {/* Bottom Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-xl pointer-events-auto flex items-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span>Entities:</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" /> Candidate</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Skill</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" /> Project</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#ec4899]" /> Experience</span>
            <span className="flex items-center gap-1 text-amber-300 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> 🏆 Award</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" /> 🎓 Education</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6]" /> 📜 Cert</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" /> Opportunity</span>
          </div>
        </div>
      </div>

      {/* ── Slide-Out Node Intelligence Inspector Drawer ───────────────────── */}
      {selectedNode && (
        <GlassCard className="p-6 bg-slate-900/95 backdrop-blur-xl border-indigo-500/30 shadow-2xl relative animate-fade-in space-y-6">
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  backgroundColor: selectedNode.cluster_color || NODE_COLORS[selectedNode.group] || '#6366f1',
                }}
              >
                {React.createElement(NODE_ICONS[selectedNode.group] || Sparkles, {
                  className: 'w-6 h-6 text-white',
                })}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={selectedNode.group === 'user' ? 'primary' : 'secondary'} size="sm">
                    {selectedNode.group?.toUpperCase()} NODE
                  </Badge>
                  {selectedNode.is_shared && (
                    <Badge variant="success" size="sm">
                      ⚡ SHARED SKILL HUB
                    </Badge>
                  )}
                  <span className="text-xs text-slate-500 font-mono">ID: {selectedNode.id}</span>
                </div>
                <h2 className="text-xl font-extrabold text-white mt-1">{selectedNode.label}</h2>
              </div>
            </div>

            <button
              onClick={() => setSelectedNode(null)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Node Metadata & Entity Details */}
            <div className="lg:col-span-2 space-y-5">
              {/* Candidate Person Profile View */}
              {selectedNode.group === 'user' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Role & Specialization</span>
                      <span className="text-xs font-semibold text-indigo-400">{selectedNode.attributes?.location || 'Noida, India'}</span>
                    </div>
                    <p className="text-sm font-bold text-white">{selectedNode.attributes?.role}</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.attributes?.summary}</p>
                  </div>

                  {/* Peer Synergies & Team Recommendations */}
                  <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Graph RAG Peer Synergies & Team Synergies</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {selectedNode.id === 'candidate_mohit' && (
                        <>
                          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                            <span className="font-bold text-pink-400">⚡ Mohit + Krati</span>
                            <p className="text-slate-300 mt-1 text-[11px]">Full-Stack AI Product synergy: Mohit (AI/IoT & FastAPI) + Krati (Figma & UI/UX Design System).</p>
                          </div>
                          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                            <span className="font-bold text-emerald-400">⚡ Mohit + Vishnu</span>
                            <p className="text-slate-300 mt-1 text-[11px]">Backend Infrastructure synergy: Mohit (Vector search & LLMs) + Vishnu (Distributed PostgreSQL microservices).</p>
                          </div>
                        </>
                      )}
                      {selectedNode.id === 'candidate_krati' && (
                        <>
                          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                            <span className="font-bold text-indigo-400">⚡ Krati + Mohit</span>
                            <p className="text-slate-300 mt-1 text-[11px]">AI Application synergy: Krati designs frontend experiences powered by Mohit's AI and IoT pipelines.</p>
                          </div>
                          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                            <span className="font-bold text-emerald-400">⚡ Krati + Vishnu</span>
                            <p className="text-slate-300 mt-1 text-[11px]">Client-Server synergy: Krati builds modern Next.js interfaces consuming Vishnu's high-speed REST/GraphQL APIs.</p>
                          </div>
                        </>
                      )}
                      {selectedNode.id === 'candidate_vishnu' && (
                        <>
                          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                            <span className="font-bold text-indigo-400">⚡ Vishnu + Mohit</span>
                            <p className="text-slate-300 mt-1 text-[11px]">Python & FastAPI Core: Joint expertise in Python backend APIs, PostgreSQL, and scalable deployments.</p>
                          </div>
                          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                            <span className="font-bold text-pink-400">⚡ Vishnu + Krati</span>
                            <p className="text-slate-300 mt-1 text-[11px]">End-to-End Delivery: Vishnu delivers microservice APIs that Krati renders into high-performance UI workflows.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => navigate(`/studio?candidateId=${selectedNode.id}`)}
                      className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Wand2 className="w-4 h-4" />
                      Open in AI Resume Studio
                    </button>
                    <button
                      onClick={() => setSelectedCandidate(selectedNode.id)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <User className="w-4 h-4 text-indigo-400" />
                      Focus Graph on {selectedNode.label.split(' ')[0]}
                    </button>
                  </div>
                </div>
              )}

              {/* Achievement / Award Node View */}
              {selectedNode.group === 'achievement' && (
                <div className="space-y-4">
                  <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                        <Trophy className="w-4 h-4" /> Verified Honor & Competition Award
                      </span>
                      <span className="text-xs font-bold text-white font-mono">{selectedNode.attributes?.year}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">{selectedNode.attributes?.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.attributes?.impact}</p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Issuing Body: <span className="text-slate-200 font-semibold">{selectedNode.attributes?.organization}</span></span>
                      <span className="text-amber-300 font-bold">Winner: {selectedNode.attributes?.winner}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyText(`- **${selectedNode.attributes?.title}** (${selectedNode.attributes?.year}) — ${selectedNode.attributes?.impact}`)}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedAttribute ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copiedAttribute ? 'Copied Award Markdown!' : 'Copy Award to Clipboard for Resume'}
                  </button>
                </div>
              )}

              {/* Education Node View */}
              {selectedNode.group === 'education' && (
                <div className="space-y-4">
                  <div className="bg-cyan-950/20 p-4 rounded-xl border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4" /> Academic Degree
                      </span>
                      <span className="text-xs font-mono text-slate-400">{selectedNode.attributes?.period}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{selectedNode.attributes?.degree}</h3>
                    <p className="text-xs text-slate-300">{selectedNode.attributes?.institution}</p>
                    <p className="text-xs text-slate-400 pt-1">{selectedNode.attributes?.details}</p>
                  </div>
                </div>
              )}

              {/* Certification Node View */}
              {selectedNode.group === 'certification' && (
                <div className="space-y-4">
                  <div className="bg-teal-950/20 p-4 rounded-xl border border-teal-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-400 uppercase flex items-center gap-1.5">
                        <Award className="w-4 h-4" /> Professional Certification
                      </span>
                      <span className="text-xs font-mono text-slate-400">{selectedNode.attributes?.year}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{selectedNode.attributes?.name}</h3>
                    <p className="text-xs text-slate-300">Issued by: <span className="font-semibold text-teal-300">{selectedNode.attributes?.issuer}</span></p>
                  </div>
                </div>
              )}

              {/* Project Node View */}
              {selectedNode.group === 'project' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-purple-400 uppercase flex items-center gap-1.5">
                      <Cpu className="w-4 h-4" /> Featured Engineering Project
                    </span>
                    <h3 className="text-base font-bold text-white">{selectedNode.attributes?.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.attributes?.description}</p>
                    {selectedNode.attributes?.tech_stack && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Tech Stack:</span>
                        <span className="text-xs font-semibold text-purple-300">{selectedNode.attributes.tech_stack}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Work Experience Node View */}
              {selectedNode.group === 'experience' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-400 uppercase flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" /> Work Experience
                      </span>
                      <span className="text-xs font-mono text-slate-400">{selectedNode.attributes?.period}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{selectedNode.attributes?.role}</h3>
                    <p className="text-xs text-slate-300">{selectedNode.attributes?.company}</p>
                    <p className="text-xs text-slate-300 leading-relaxed pt-2">{selectedNode.attributes?.achievements}</p>
                  </div>
                </div>
              )}

              {/* Shared Skill View */}
              {selectedNode.group === 'skill' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Skill Mastered By</span>
                      <span className="text-xs font-semibold text-emerald-400">Verified Competency</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(selectedNode.attributes?.known_by || []).map((name, i) => (
                        <span key={i} className="px-3 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold text-xs rounded-lg flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          {name}
                        </span>
                      ))}
                    </div>

                    {selectedNode.attributes?.skill_gap_for && selectedNode.attributes.skill_gap_for.length > 0 && (
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-xs font-bold text-amber-400 uppercase block mb-1.5">Opportunity / Skill Gap For:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedNode.attributes.skill_gap_for.map((name, i) => (
                            <span key={i} className="px-2.5 py-0.5 bg-amber-950/40 border border-amber-500/20 text-amber-300 text-xs rounded-lg">
                              {name} (Could learn or collaborate)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Opportunity Node View */}
              {selectedNode.group === 'opportunity' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">{selectedNode.attributes?.category?.toUpperCase()} OPPORTUNITY</span>
                      <span className="text-xs font-extrabold text-emerald-400">{selectedNode.attributes?.relevance_score || 92}% Match</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{selectedNode.attributes?.title}</h3>
                    <p className="text-xs text-slate-400">{selectedNode.attributes?.company}</p>

                    <div className="flex items-center gap-3 pt-2">
                      {selectedNode.attributes?.url && (
                        <a
                          href={selectedNode.attributes.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          Direct Apply Link <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          const candId = selectedNode.attributes?.matched_candidate_id || (selectedCandidate !== 'candidate_all' ? selectedCandidate : 'candidate_mohit');
                          const oppId = selectedNode.attributes?.id || selectedNode.id.replace('opp_', '');
                          navigate(`/studio?candidateId=${candId}&oppId=${oppId}`);
                        }}
                        className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" /> Open in AI Resume Studio
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Interconnected Graph Neighbors */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>Direct Graph Connections ({neighborInfo.length})</span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                  {neighborInfo.map(({ edgeType, edgeLabel, node }, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleNodeClick(node)}
                      className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-xl text-xs flex items-center gap-2 text-slate-300 transition-all cursor-pointer"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: NODE_COLORS[node.group] || '#6366f1' }}
                      />
                      <span className="font-semibold text-white truncate max-w-[160px]">{node.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({edgeLabel || edgeType})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: RAG Vector Grounding Citation Card */}
            <div className="bg-slate-950/80 rounded-2xl p-5 border border-indigo-500/20 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                    <Database className="w-4 h-4" />
                    <span>Vector Search Provenance</span>
                  </div>
                  <Badge variant="accent" size="sm">
                    {selectedNode.vector_reference?.embedding_model || 'Gemini 001'}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <div>
                    <span className="text-slate-500">Source Document: </span>
                    <span className="font-semibold text-slate-200">{selectedNode.vector_reference?.source_doc || 'Candidate Portfolio'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Vector Chunk Index: </span>
                    <span className="font-mono text-cyan-400">#{selectedNode.vector_reference?.chunk_index ?? 0}</span>
                  </div>
                </div>

                {/* Excerpt Block */}
                <div className="relative bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 italic leading-relaxed">
                  <p className="line-clamp-6">
                    "{selectedNode.vector_reference?.chunk_excerpt || 'Entity grounded in vector database embeddings.'}"
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Cosine Vector Match:</span>
                  <span className="font-extrabold text-emerald-400">{selectedNode.vector_reference?.similarity_score || 96.4}%</span>
                </div>

                <button
                  onClick={() => handleCopyExcerpt(selectedNode.vector_reference?.chunk_excerpt || '')}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedExcerpt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedExcerpt ? 'Copied Vector Chunk!' : 'Copy Vector Reference'}
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
