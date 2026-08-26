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
  Target,
  Sliders,
  Maximize,
  Minimize,
  Eye,
  SlidersHorizontal,
  Compass
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

  // ── Physics & Distance Controls State ──────────────────────────────────────
  const [nodeRepulsion, setNodeRepulsion] = useState(850);       // Repulsion strength (higher = more spaced out)
  const [linkDistance, setLinkDistance] = useState(140);         // Link spring distance (higher = further apart)
  const [centerGravity, setCenterGravity] = useState(0.04);      // Pull toward center (lower = looser)
  const [particleSpeed, setParticleSpeed] = useState(0.006);     // Flow speed
  const [showParticles, setShowParticles] = useState(true);
  const [labelMode, setLabelMode] = useState('smart');           // 'smart' | 'always' | 'key_only' | 'hover'
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);
  const [activePreset, setActivePreset] = useState('spacious');

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

      if (candidateId !== 'candidate_all') {
        const targetNode = rawNodes.find((n) => n.id === candidateId);
        if (targetNode) {
          setSelectedNode(targetNode);
          setTimeout(() => {
            if (fgRef.current && targetNode.x !== undefined && targetNode.y !== undefined) {
              fgRef.current.centerAt(targetNode.x, targetNode.y, 800);
              fgRef.current.zoom(1.8, 800);
            }
          }, 350);
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

  // 3. Dynamic D3 Force Engine Settings (Real-time Spacing Update)
  useEffect(() => {
    if (fgRef.current) {
      const charge = fgRef.current.d3Force('charge');
      if (charge) {
        charge.strength(-nodeRepulsion);
        charge.distanceMax(3000);
      }
      const link = fgRef.current.d3Force('link');
      if (link) {
        link.distance(linkDistance);
      }
      const center = fgRef.current.d3Force('center');
      if (center && typeof center.strength === 'function') {
        center.strength(centerGravity);
      }
      fgRef.current.d3ReheatSimulation();
    }
  }, [nodeRepulsion, linkDistance, centerGravity, graphData]);

  // Dynamic window resizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(620, window.innerHeight - 240),
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
      fgRef.current.zoom(1.8, 600);
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
      fgRef.current.zoomToFit(600, 60);
    }
  };

  // Quick Spacing Boosters
  const handleSpreadApart = () => {
    setNodeRepulsion((prev) => Math.min(2200, prev + 250));
    setLinkDistance((prev) => Math.min(320, prev + 35));
    setActivePreset('custom');
  };

  const handleTighten = () => {
    setNodeRepulsion((prev) => Math.max(250, prev - 250));
    setLinkDistance((prev) => Math.max(50, prev - 35));
    setActivePreset('custom');
  };

  const applyPreset = (presetName) => {
    setActivePreset(presetName);
    if (presetName === 'spacious') {
      setNodeRepulsion(950);
      setLinkDistance(150);
      setCenterGravity(0.04);
    } else if (presetName === 'expansive') {
      setNodeRepulsion(1600);
      setLinkDistance(230);
      setCenterGravity(0.02);
    } else if (presetName === 'balanced') {
      setNodeRepulsion(550);
      setLinkDistance(100);
      setCenterGravity(0.08);
    } else if (presetName === 'clustered') {
      setNodeRepulsion(300);
      setLinkDistance(65);
      setCenterGravity(0.18);
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
            <span>Candidate View:</span>
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
          <div className="pointer-events-auto relative w-64 sm:w-72">
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

          {/* Group Visibility Toggles */}
          <div className="pointer-events-auto hidden lg:flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-lg flex-wrap max-w-xl">
            {Object.keys(NODE_COLORS).map((group) => {
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

          {/* Graph Action Buttons & Distance Quick Bar */}
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-lg">
            
            {/* Quick Distance Spread / Tighten */}
            <button
              onClick={handleSpreadApart}
              title="Spread Nodes Apart (Decrease Congestion)"
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Maximize className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Spread</span>
            </button>
            <button
              onClick={handleTighten}
              title="Tighten Nodes Closer"
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Minimize className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tighten</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-700 mx-1" />

            {/* Open Physics & Graph Control Drawer */}
            <button
              onClick={() => setShowControlsDrawer(!showControlsDrawer)}
              title="Physics & Graph Spacing Settings"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                showControlsDrawer
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Physics Controls</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-700 mx-1" />

            {/* Standard Zoom & Refresh */}
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
              title="Fit Screen"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => loadGraph(selectedCandidate)}
              title="Reload Graph RAG"
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Floating Physics & Distance Controls Drawer ─────────────────── */}
        {showControlsDrawer && (
          <div className="absolute top-20 right-4 z-30 w-84 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Graph Spacing & Physics Engine</h3>
              </div>
              <button
                onClick={() => setShowControlsDrawer(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Layout Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2">Spacing Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'spacious', name: '🌌 Spacious (Clean)', desc: 'Optimal breathing room' },
                  { id: 'expansive', name: '🌐 Ultra-Wide Map', desc: 'Maximum node distance' },
                  { id: 'balanced', name: '🎯 Balanced Layout', desc: 'Standard force balance' },
                  { id: 'clustered', name: '🧩 Tight Clustered', desc: 'Compact grouping' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      activePreset === p.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs">{p.name}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fine-Tuning Sliders */}
            <div className="space-y-3.5 pt-2 border-t border-slate-800">
              {/* Node Repulsion (Charge) */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">Node Repulsion (Charge Distance)</span>
                  <span className="font-mono text-cyan-400 font-bold">{nodeRepulsion}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="2400"
                  step="50"
                  value={nodeRepulsion}
                  onChange={(e) => {
                    setNodeRepulsion(Number(e.target.value));
                    setActivePreset('custom');
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>Tight (200)</span>
                  <span>Spacious (850)</span>
                  <span>Expansive (2400)</span>
                </div>
              </div>

              {/* Link Spring Distance */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">Link Spring Length</span>
                  <span className="font-mono text-indigo-400 font-bold">{linkDistance}px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="350"
                  step="10"
                  value={linkDistance}
                  onChange={(e) => {
                    setLinkDistance(Number(e.target.value));
                    setActivePreset('custom');
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>Short (40px)</span>
                  <span>Optimal (140px)</span>
                  <span>Long (350px)</span>
                </div>
              </div>

              {/* Center Gravity */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">Center Pull Gravity</span>
                  <span className="font-mono text-purple-400 font-bold">{centerGravity.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.005"
                  max="0.30"
                  step="0.005"
                  value={centerGravity}
                  onChange={(e) => {
                    setCenterGravity(Number(e.target.value));
                    setActivePreset('custom');
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Label Visibility Mode */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Node Label Rendering</label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {[
                    { id: 'smart', label: 'Smart (Auto)' },
                    { id: 'always', label: 'Always All' },
                    { id: 'key_only', label: 'Key Nodes' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setLabelMode(mode.id)}
                      className={`py-1 text-[11px] rounded-lg font-semibold transition-all cursor-pointer ${
                        labelMode === mode.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => applyPreset('spacious')}
                className="text-xs text-slate-400 hover:text-indigo-400 underline cursor-pointer"
              >
                Reset to Defaults
              </button>
              <button
                onClick={() => {
                  if (fgRef.current) fgRef.current.d3ReheatSimulation();
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reheat Physics
              </button>
            </div>
          </div>
        )}

        {/* Force Graph Canvas Container */}
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
            linkDirectionalParticles={showParticles ? (link) => (link.type === 'TEAM_SYNERGY' ? 4 : link.type === 'USES_TECH' ? 1 : 2) : 0}
            linkDirectionalParticleSpeed={particleSpeed}
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

              // Determine whether to draw label
              const shouldDrawLabel =
                labelMode === 'always' ||
                isSelected ||
                isHovered ||
                (labelMode === 'key_only' && (isCandidate || isSharedSkill || isAchievement)) ||
                (labelMode === 'smart' && (globalScale > 0.75 || isCandidate || isSharedSkill || isAchievement));

              if (shouldDrawLabel) {
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

                ctx.fillStyle = isCandidate ? '#ffffff' : isSharedSkill ? '#6ee7b7' : isAchievement ? '#fde68a' : '#cbd5e1';
                ctx.fillText(label, node.x, node.y + radius + 3);
              }
            }}
          />
        </div>
      </div>

      {/* ── Bottom Inspector Panel ────────────────────────────────────────── */}
      {selectedNode && (
        <GlassCard className="p-6 bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-2xl relative animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Main Node Overview */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{
                    backgroundColor: `${NODE_COLORS[selectedNode.group] || '#6366f1'}22`,
                    border: `1.5px solid ${NODE_COLORS[selectedNode.group] || '#6366f1'}`,
                  }}
                >
                  {(() => {
                    const IconComponent = NODE_ICONS[selectedNode.group] || Sparkles;
                    return <IconComponent className="w-6 h-6" style={{ color: NODE_COLORS[selectedNode.group] || '#6366f1' }} />;
                  })()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="primary" className="capitalize text-xs">
                      {selectedNode.group} Node
                    </Badge>
                    {selectedNode.is_shared && (
                      <Badge variant="accent" className="text-xs bg-emerald-950/60 border-emerald-500/30 text-emerald-300">
                        ⚡ Shared Skill Hub
                      </Badge>
                    )}
                    {selectedNode.group === 'user' && (
                      <span className="text-xs text-indigo-400 font-mono font-bold">
                        Candidate Entity
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-white truncate">{selectedNode.label}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Node ID: <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">{selectedNode.id}</code>
                  </p>
                </div>
              </div>

              {/* Dynamic Attributes Grid */}
              {selectedNode.attributes && Object.keys(selectedNode.attributes).length > 0 && (
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Extracted Entity Metadata</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {Object.entries(selectedNode.attributes).map(([key, val]) => {
                      if (typeof val === 'object' && val !== null) return null;
                      return (
                        <div key={key} className="flex flex-col gap-0.5 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                          <span className="text-slate-500 capitalize font-medium">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-semibold text-slate-200 truncate">{String(val)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Shared Skill Synergies View */}
              {selectedNode.group === 'skill' && selectedNode.attributes?.holders && (
                <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase">Shared Skill Multi-Candidate Synergies</span>
                    <span className="text-xs font-bold text-slate-400">{selectedNode.attributes.holders.length} Qualified Candidates</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedNode.attributes.holders.map((holder, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl font-semibold">
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{holder.name} ({holder.proficiency})</span>
                        </div>
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
