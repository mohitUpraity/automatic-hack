import React, { useState, useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useNavigate } from 'react-router-dom';
import { fetchKnowledgeGraph } from '../../api/client';
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
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Check,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const NODE_COLORS = {
  user: '#6366f1',        // indigo
  skill: '#10b981',       // emerald
  project: '#8b5cf6',     // violet
  experience: '#ec4899',  // pink/rose
  opportunity: '#f97316', // orange/amber
  document: '#06b6d4',    // cyan
};

const NODE_ICONS = {
  user: User,
  skill: Code,
  project: Cpu,
  experience: Briefcase,
  opportunity: Trophy,
  document: FileText,
};

export default function KnowledgeGraph({ userId = 'default-user' }) {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedExcerpt, setCopiedExcerpt] = useState(false);
  const [activeGroups, setActiveGroups] = useState({
    user: true,
    skill: true,
    project: true,
    experience: true,
    opportunity: true,
    document: true,
  });

  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await fetchKnowledgeGraph(userId);
      const rawNodes = data.nodes || [];
      const rawEdges = data.edges || data.links || [];

      const formattedLinks = rawEdges.map((e) => ({
        source: typeof e.source === 'object' ? e.source.id : e.source,
        target: typeof e.target === 'object' ? e.target.id : e.target,
        type: e.type || 'CONNECTED_TO',
      }));

      setGraphData({
        nodes: rawNodes,
        links: formattedLinks,
      });

      // Auto-select user node or first node if none selected
      if (!selectedNode && rawNodes.length > 0) {
        const userNode = rawNodes.find((n) => n.group === 'user') || rawNodes[0];
        setSelectedNode(userNode);
      }
    } catch (err) {
      console.error('Failed to load knowledge graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [userId]);

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
      const searchMatch = !searchQuery || (node.label && node.label.toLowerCase().includes(searchQuery.toLowerCase()));
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

  // Connected nodes map for hover & selection highlighting
  const connectedNodeIds = useMemo(() => {
    const target = hoverNode || selectedNode;
    if (!target) return new Set();
    const set = new Set([target.id]);
    filteredData.links.forEach((l) => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      if (sId === target.id) set.add(tId);
      if (tId === target.id) set.add(sId);
    });
    return set;
  }, [hoverNode, selectedNode, filteredData.links]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (fgRef.current && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 600);
      fgRef.current.zoom(2.2, 600);
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
      fgRef.current.zoomToFit(600, 40);
    }
  };

  const handleCopyExcerpt = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedExcerpt(true);
    setTimeout(() => setCopiedExcerpt(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar & Filter Bar */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills, projects, opportunities, docs..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={loadGraph}
            disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Category Group Toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.keys(NODE_COLORS).map((group) => {
            const isActive = activeGroups[group];
            const count = graphData.nodes.filter((n) => n.group === group).length;
            const Icon = NODE_ICONS[group] || Layers;
            return (
              <button
                key={group}
                onClick={() => toggleGroup(group)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                  isActive
                    ? 'bg-slate-900/90 text-slate-200 border-slate-700 shadow-sm'
                    : 'bg-slate-950/40 text-slate-600 border-slate-900 opacity-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[group] }}
                />
                <Icon className="w-3 h-3 text-slate-400" />
                <span className="capitalize">{group}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-400 font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </GlassCard>

      {/* Main Canvas & Inspector Area */}
      <div ref={containerRef} className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950">
        {loading ? (
          <div className="h-[600px] flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" text="Constructing Semantic Vector-Grounded Graph..." />
          </div>
        ) : filteredData.nodes.length === 0 ? (
          <div className="h-[600px] flex flex-col items-center justify-center gap-3 text-center p-8">
            <GitBranch className="w-12 h-12 text-slate-600 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-300">No Graph Nodes Found</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Upload a resume or job document to generate your interconnected Obsidian-style profile graph.
            </p>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={filteredData}
            backgroundColor="#050711"
            nodeRelSize={6}
            nodeVal={(node) => node.val || (node.group === 'user' ? 10 : 5)}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.label || node.id;
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoverNode?.id === node.id;
              const isConnected = connectedNodeIds.has(node.id);
              const opacity = (hoverNode || selectedNode) ? (isConnected ? 1 : 0.15) : 0.95;

              const radius = node.group === 'user' ? 11 : (node.val || 5) + 2;
              const color = NODE_COLORS[node.group] || '#6366f1';

              // Glow on selected/connected
              if (isSelected || isHovered) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 8 / globalScale, 0, 2 * Math.PI, false);
                ctx.fillStyle = `${color}33`;
                ctx.fill();
              }

              // Node Circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = color;
              ctx.globalAlpha = opacity;
              ctx.fill();

              // Border Ring
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.strokeStyle = isSelected ? '#ffffff' : (isHovered ? '#cbd5e1' : `${color}aa`);
              ctx.lineWidth = isSelected ? 2.5 / globalScale : 1.5 / globalScale;
              ctx.stroke();

              // Text Label
              const fontSize = node.group === 'user' ? 13 / globalScale : 11 / globalScale;
              ctx.font = `${isSelected ? 'bold ' : ''}${fontSize}px Inter, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillStyle = isConnected ? '#ffffff' : '#94a3b8';
              ctx.globalAlpha = opacity;
              ctx.fillText(label, node.x, node.y + radius + 4 / globalScale);

              ctx.globalAlpha = 1.0;
            }}
            linkColor={() => 'rgba(148, 163, 184, 0.18)'}
            linkWidth={1.5}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleWidth={2}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={0.95}
            onNodeClick={handleNodeClick}
            onNodeHover={(node) => setHoverNode(node)}
            cooldownTicks={100}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
          />
        )}

        {/* Selected Node Intelligence Inspector Panel */}
        {selectedNode && (
          <GlassCard className="absolute top-4 right-4 w-96 max-h-[calc(100%-32px)] overflow-y-auto p-5 space-y-4 shadow-2xl border-indigo-500/40 bg-slate-950/95 z-20 backdrop-blur-xl animate-scale-in">
            {/* Panel Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-offset-2 ring-offset-slate-900"
                  style={{ backgroundColor: NODE_COLORS[selectedNode.group] || '#6366f1', ringColor: NODE_COLORS[selectedNode.group] }}
                />
                <Badge variant="primary" size="sm">
                  {selectedNode.group?.toUpperCase() || 'ENTITY'}
                </Badge>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Identification */}
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                {selectedNode.label}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Node ID: {selectedNode.id}
              </p>
            </div>

            {/* 🔮 Vector Search Grounding & RAG Provenance Card */}
            {selectedNode.vector_reference && (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900/80 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                      Vector Search Reference
                    </span>
                  </div>
                  {selectedNode.vector_reference.similarity_score && (
                    <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-200 border border-cyan-700/50">
                      {selectedNode.vector_reference.similarity_score}% Alignment
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Source Document:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[180px]">
                      {selectedNode.vector_reference.source_doc || 'Candidate Resume'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Embedding Space:</span>
                    <span className="text-cyan-400 font-mono text-[10px]">
                      {selectedNode.vector_reference.embedding_model || 'Gemini 001 (768-dim)'}
                    </span>
                  </div>
                </div>

                {/* Exact Vector Chunk Excerpt */}
                {selectedNode.vector_reference.chunk_excerpt && (
                  <div className="mt-2 pt-2 border-t border-cyan-900/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        Exact RAG Chunk Excerpt:
                      </span>
                      <button
                        onClick={() => handleCopyExcerpt(selectedNode.vector_reference.chunk_excerpt)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-all"
                      >
                        {copiedExcerpt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedExcerpt ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-cyan-900/40 text-[11px] font-mono text-slate-300 leading-relaxed max-h-32 overflow-y-auto italic">
                      "{selectedNode.vector_reference.chunk_excerpt}"
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Group-Specific Context Details */}
            {selectedNode.attributes && (
              <div className="space-y-2 pt-1 border-t border-slate-800/80 text-xs">
                {selectedNode.group === 'opportunity' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Category:</span>
                      <span className="capitalize px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/60 text-amber-300 font-semibold text-[11px]">
                        {selectedNode.attributes.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Company / Source:</span>
                      <span className="text-white font-medium">{selectedNode.attributes.company}</span>
                    </div>
                    {selectedNode.attributes.match_reasons && (
                      <div className="space-y-1">
                        <span className="text-slate-400 font-semibold text-[11px]">AI Matching Criteria:</span>
                        <div className="space-y-1">
                          {(Array.isArray(selectedNode.attributes.match_reasons)
                            ? selectedNode.attributes.match_reasons
                            : [selectedNode.attributes.match_reasons]
                          ).map((reason, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                              <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Action button */}
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={() => navigate('/studio')}
                        className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Auto-Tailor Resume in Studio
                      </button>
                      {selectedNode.attributes.url && (
                        <a
                          href={selectedNode.attributes.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-800 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          View Original Listing
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {selectedNode.group === 'project' && (
                  <div className="space-y-2">
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {selectedNode.attributes.description}
                    </p>
                    {selectedNode.attributes.tech_stack && (
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tech Stack:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {String(selectedNode.attributes.tech_stack)
                            .split(',')
                            .map((t, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 bg-violet-950/60 border border-violet-800/40 text-violet-300 rounded-md font-mono">
                                {t.trim()}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.group === 'experience' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Role & Period:</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.attributes.period}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {selectedNode.attributes.achievements}
                    </p>
                  </div>
                )}

                {selectedNode.group === 'user' && (
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target Role:</span>
                      <span className="text-indigo-300 font-semibold">{selectedNode.attributes.career_goals}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Contact:</span>
                      <span className="text-slate-200 font-mono text-[10px]">{selectedNode.attributes.email}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interconnected Knowledge Graph Connections */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Interconnected Entities</span>
                <span className="text-indigo-400 font-mono text-[10px]">
                  {filteredData.links.filter((l) => {
                    const s = typeof l.source === 'object' ? l.source.id : l.source;
                    const t = typeof l.target === 'object' ? l.target.id : l.target;
                    return s === selectedNode.id || t === selectedNode.id;
                  }).length} links
                </span>
              </h4>
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {filteredData.links
                  .filter((l) => {
                    const s = typeof l.source === 'object' ? l.source.id : l.source;
                    const t = typeof l.target === 'object' ? l.target.id : l.target;
                    return s === selectedNode.id || t === selectedNode.id;
                  })
                  .map((link, idx) => {
                    const sId = typeof link.source === 'object' ? link.source.id : link.source;
                    const neighborNode = sId === selectedNode.id
                      ? (typeof link.target === 'object' ? link.target : graphData.nodes.find((n) => n.id === link.target))
                      : (typeof link.source === 'object' ? link.source : graphData.nodes.find((n) => n.id === link.source));

                    if (!neighborNode) return null;
                    const nColor = NODE_COLORS[neighborNode.group] || '#6366f1';

                    return (
                      <div
                        key={idx}
                        onClick={() => handleNodeClick(neighborNode)}
                        className="text-xs p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: nColor }}
                          />
                          <span className="text-slate-300 group-hover:text-white font-medium truncate text-[11px]">
                            {neighborNode.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/40">
                            {link.type || 'LINK'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
