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
  Compass,
  Download,
  Filter,
  Link as LinkIcon,
  Focus,
  Radio,
  Image as ImageIcon,
  Workflow,
  Orbit,
  GitFork,
  Boxes,
  Palette,
  Hexagon,
  Circle,
  Square,
  Gem,
  Stars,
  Grid,
  Sun,
  Moon
} from 'lucide-react';

// ── Themes & Color Palettes ──────────────────────────────────────────────────
const THEME_PALETTES = {
  cyberpunk: {
    id: 'cyberpunk',
    name: '⚡ Cyberpunk Neon',
    bg: '#030712',
    gridColor: 'rgba(0, 240, 255, 0.04)',
    nodeColors: {
      user: '#00f0ff',          // Electric Cyan
      skill: '#39ff14',         // Neon Lime
      project: '#b026ff',       // Cyber Purple
      experience: '#ff007f',    // Hot Pink
      achievement: '#ffd700',   // Laser Gold
      education: '#00ffff',     // Bright Cyan
      certification: '#00e5ff', // Aqua
      opportunity: '#ff5500',   // Blazing Orange
      document: '#38bdf8',      // Sky
    },
    candidateColors: {
      candidate_mohit: '#00f0ff',
      candidate_krati: '#ff007f',
      candidate_vishnu: '#39ff14',
      candidate_all: '#b026ff',
    },
    edgeColors: {
      KNOWS_SKILL: '#39ff14',
      BUILT_PROJECT: '#b026ff',
      USES_TECH: '#64748b',
      WORKED_AT: '#ff007f',
      EARNED_AWARD: '#ffd700',
      STUDIED_AT: '#00ffff',
      ACQUIRED_CERT: '#00e5ff',
      TEAM_SYNERGY: '#ff00ff',
      MATCHES_PROFILE: '#ff5500',
      SOURCES_CANDIDATE_DATA: '#38bdf8',
    }
  },
  cosmic: {
    id: 'cosmic',
    name: '🌌 Cosmic Nebula',
    bg: '#020617',
    gridColor: 'rgba(139, 92, 246, 0.05)',
    nodeColors: {
      user: '#818cf8',          // Light Indigo
      skill: '#34d399',         // Emerald Green
      project: '#c084fc',       // Starlight Violet
      experience: '#f472b6',    // Nebula Pink
      achievement: '#fbbf24',   // Solar Gold
      education: '#38bdf8',     // Celestial Sky
      certification: '#2dd4bf', // Astral Teal
      opportunity: '#fb923c',   // Cosmic Orange
      document: '#93c5fd',      // Moonstone
    },
    candidateColors: {
      candidate_mohit: '#818cf8',
      candidate_krati: '#f472b6',
      candidate_vishnu: '#34d399',
      candidate_all: '#c084fc',
    },
    edgeColors: {
      KNOWS_SKILL: '#34d399',
      BUILT_PROJECT: '#c084fc',
      USES_TECH: '#64748b',
      WORKED_AT: '#f472b6',
      EARNED_AWARD: '#fbbf24',
      STUDIED_AT: '#38bdf8',
      ACQUIRED_CERT: '#2dd4bf',
      TEAM_SYNERGY: '#e879f9',
      MATCHES_PROFILE: '#fb923c',
      SOURCES_CANDIDATE_DATA: '#93c5fd',
    }
  },
  matrix: {
    id: 'matrix',
    name: '🛡️ ArmorIQ Tactical / Matrix',
    bg: '#030d0a',
    gridColor: 'rgba(16, 185, 129, 0.06)',
    nodeColors: {
      user: '#10b981',          // Phosphor Green
      skill: '#34d399',         // Emerald
      project: '#059669',       // Deep Forest
      experience: '#065f46',    // Dark Green
      achievement: '#f59e0b',   // Tactical Amber
      education: '#14b8a6',     // Cyber Teal
      certification: '#0d9488', // Dark Teal
      opportunity: '#f97316',   // High-Threat Orange
      document: '#6ee7b7',      // Light Mint
    },
    candidateColors: {
      candidate_mohit: '#10b981',
      candidate_krati: '#14b8a6',
      candidate_vishnu: '#34d399',
      candidate_all: '#6ee7b7',
    },
    edgeColors: {
      KNOWS_SKILL: '#34d399',
      BUILT_PROJECT: '#10b981',
      USES_TECH: '#475569',
      WORKED_AT: '#059669',
      EARNED_AWARD: '#f59e0b',
      STUDIED_AT: '#14b8a6',
      ACQUIRED_CERT: '#0d9488',
      TEAM_SYNERGY: '#a7f3d0',
      MATCHES_PROFILE: '#f97316',
      SOURCES_CANDIDATE_DATA: '#6ee7b7',
    }
  },
  minimal_glass: {
    id: 'minimal_glass',
    name: '💎 Obsidian Glass',
    bg: '#09090b',
    gridColor: 'rgba(255, 255, 255, 0.03)',
    nodeColors: {
      user: '#6366f1',          // Indigo Iris
      skill: '#10b981',         // Soft Mint
      project: '#8b5cf6',       // Lavender
      experience: '#ec4899',    // Rose
      achievement: '#eab308',   // Ochre Gold
      education: '#06b6d4',     // Cyan
      certification: '#14b8a6', // Teal
      opportunity: '#f97316',   // Coral
      document: '#38bdf8',      // Sky
    },
    candidateColors: {
      candidate_mohit: '#6366f1',
      candidate_krati: '#ec4899',
      candidate_vishnu: '#10b981',
      candidate_all: '#818cf8',
    },
    edgeColors: {
      KNOWS_SKILL: '#10b981',
      BUILT_PROJECT: '#8b5cf6',
      USES_TECH: '#475569',
      WORKED_AT: '#ec4899',
      EARNED_AWARD: '#eab308',
      STUDIED_AT: '#06b6d4',
      ACQUIRED_CERT: '#14b8a6',
      TEAM_SYNERGY: '#c084fc',
      MATCHES_PROFILE: '#f97316',
      SOURCES_CANDIDATE_DATA: '#38bdf8',
    }
  }
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

const EDGE_TYPES = {
  KNOWS_SKILL: { label: 'Knows Skill', desc: 'Candidate possesses technical or domain skill' },
  BUILT_PROJECT: { label: 'Built Project', desc: 'Candidate developed and shipped project' },
  USES_TECH: { label: 'Uses Tech', desc: 'Project leverages specific framework or tool' },
  WORKED_AT: { label: 'Worked At', desc: 'Candidate career experience and roles' },
  EARNED_AWARD: { label: 'Earned Award', desc: 'Hackathon, patent, or honors' },
  STUDIED_AT: { label: 'Studied At', desc: 'University and academic degree' },
  ACQUIRED_CERT: { label: 'Acquired Cert', desc: 'Professional certification' },
  TEAM_SYNERGY: { label: 'Team Synergy', desc: 'Complementary cross-candidate collaboration' },
  MATCHES_PROFILE: { label: 'Matches Profile', desc: 'Scouted job matching candidate' },
  SOURCES_CANDIDATE_DATA: { label: 'Doc Source', desc: 'Provenance grounding source doc' },
};

const TOPOLOGY_MODES = [
  { id: 'organic', name: '🌐 Organic Constellation', desc: 'Dynamic force web with open repulsion', icon: Boxes },
  { id: 'tree_td', name: '🌲 Top-Down Tree DAG', desc: 'Structured hierarchy: Candidate at top → Entities below', icon: GitFork },
  { id: 'flow_lr', name: '➡️ Pipeline Flow DAG', desc: 'Horizontal flow from experience to skills to jobs', icon: Workflow },
  { id: 'radial', name: '🪐 Concentric Orbit', desc: 'Planetary multi-orbit ring structure', icon: Orbit },
];

const NODE_SHAPES = [
  { id: 'sphere', name: '🔮 Glowing Sphere', icon: Circle },
  { id: 'hexagon', name: '⬡ Cyber Hexagon', icon: Hexagon },
  { id: 'badge', name: '🔲 Glass Card Badge', icon: Square },
  { id: 'diamond', name: '💎 Prismatic Diamond', icon: Gem },
];

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

  // ── Theme & Style Engine ───────────────────────────────────────────────────
  const [visualTheme, setVisualTheme] = useState('cyberpunk');   // 'cyberpunk' | 'cosmic' | 'matrix' | 'minimal_glass'
  const [nodeShape, setNodeShape] = useState('sphere');          // 'sphere' | 'hexagon' | 'badge' | 'diamond'
  const [bgAtmosphere, setBgAtmosphere] = useState('grid');      // 'grid' | 'stars' | 'void'
  const [linkStyle, setLinkStyle] = useState('laser');           // 'laser' | 'dashed' | 'subtle'

  // ── Topology & Structural Layout Engine ────────────────────────────────────
  const [topologyMode, setTopologyMode] = useState('organic');   // 'organic' | 'tree_td' | 'flow_lr' | 'radial'
  const [dagLevelDistance, setDagLevelDistance] = useState(130); // Distance between hierarchy levels

  // ── Physics & Distance Controls State ──────────────────────────────────────
  const [nodeRepulsion, setNodeRepulsion] = useState(1050);      // Repulsion strength
  const [linkDistance, setLinkDistance] = useState(160);         // Link spring distance
  const [centerGravity, setCenterGravity] = useState(0.035);     // Pull toward center
  const [particleSpeed, setParticleSpeed] = useState(0.006);     // Flow speed
  const [showParticles, setShowParticles] = useState(true);
  const [labelMode, setLabelMode] = useState('smart');           // 'smart' | 'always' | 'key_only' | 'hover'
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);
  const [activePreset, setActivePreset] = useState('spacious');

  // ── Connection / Edge Controls State ───────────────────────────────────────
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [linkCurvature, setLinkCurvature] = useState(0.15);      // 0 = straight, 0.3 = curved
  const [linkWidthScale, setLinkWidthScale] = useState(1.5);
  const [isolateFocus, setIsolateFocus] = useState(false);       // Dims unrelated nodes on selection
  const [nodeSizingMode, setNodeSizingMode] = useState('degree'); // 'degree' (hub size) | 'category' | 'uniform'
  const [activeTabControls, setActiveTabControls] = useState('styles'); // 'styles' | 'topology' | 'physics' | 'connections'

  // Active Connection Types Toggles
  const [activeEdgeTypes, setActiveEdgeTypes] = useState({
    KNOWS_SKILL: true,
    BUILT_PROJECT: true,
    USES_TECH: true,
    WORKED_AT: true,
    EARNED_AWARD: true,
    STUDIED_AT: true,
    ACQUIRED_CERT: true,
    TEAM_SYNERGY: true,
    MATCHES_PROFILE: true,
    SOURCES_CANDIDATE_DATA: true,
  });

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

  const currentTheme = THEME_PALETTES[visualTheme] || THEME_PALETTES.cyberpunk;

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

      // Calculate node degree for dynamic sizing
      const degreeMap = {};
      rawEdges.forEach((e) => {
        const s = typeof e.source === 'object' ? e.source.id : e.source;
        const t = typeof e.target === 'object' ? e.target.id : e.target;
        degreeMap[s] = (degreeMap[s] || 0) + 1;
        degreeMap[t] = (degreeMap[t] || 0) + 1;
      });

      const processedNodes = rawNodes.map((n) => ({
        ...n,
        degree: degreeMap[n.id] || 1,
      }));

      const formattedLinks = rawEdges.map((e) => ({
        source: typeof e.source === 'object' ? e.source.id : e.source,
        target: typeof e.target === 'object' ? e.target.id : e.target,
        type: e.type || 'CONNECTED_TO',
        label: e.label || '',
        desc: e.desc || ''
      }));

      setGraphData({
        nodes: processedNodes,
        links: formattedLinks,
      });

      if (data.metrics) {
        setGraphMetrics(data.metrics);
      }

      if (candidateId !== 'candidate_all') {
        const targetNode = processedNodes.find((n) => n.id === candidateId);
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
        setSelectedNode((prev) => prev || (processedNodes.find((n) => n.id === 'candidate_mohit') || processedNodes[0]));
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

  // 3. Dynamic D3 Force Engine Settings
  useEffect(() => {
    if (fgRef.current) {
      const charge = fgRef.current.d3Force('charge');
      if (charge) {
        charge.strength(-nodeRepulsion);
        charge.distanceMax(3500);
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
  }, [nodeRepulsion, linkDistance, centerGravity, topologyMode, graphData]);

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

  // Filter nodes & links
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

    const validLinks = graphData.links.filter((link) => {
      const edgeTypeMatch = activeEdgeTypes[link.type] !== false;
      const sId = typeof link.source === 'object' ? link.source.id : link.source;
      const tId = typeof link.target === 'object' ? link.target.id : link.target;
      return edgeTypeMatch && validNodeIds.has(sId) && validNodeIds.has(tId);
    });

    return { nodes: validNodes, links: validLinks };
  }, [graphData, activeGroups, activeEdgeTypes, searchQuery]);

  // Focus neighbor set
  const activeFocusNeighborSet = useMemo(() => {
    const focusNode = hoverNode || selectedNode;
    if (!focusNode || !isolateFocus) return null;
    const neighborSet = new Set([focusNode.id]);
    filteredData.links.forEach((l) => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      if (sId === focusNode.id) neighborSet.add(tId);
      if (tId === focusNode.id) neighborSet.add(sId);
    });
    return neighborSet;
  }, [hoverNode, selectedNode, isolateFocus, filteredData.links]);

  const toggleGroup = (group) => {
    setActiveGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleEdgeType = (type) => {
    setActiveEdgeTypes((prev) => ({ ...prev, [type]: !prev[type] }));
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
    setNodeRepulsion((prev) => Math.min(2600, prev + 300));
    setLinkDistance((prev) => Math.min(350, prev + 40));
    setActivePreset('custom');
  };

  const handleTighten = () => {
    setNodeRepulsion((prev) => Math.max(250, prev - 300));
    setLinkDistance((prev) => Math.max(50, prev - 40));
    setActivePreset('custom');
  };

  const applyPreset = (presetName) => {
    setActivePreset(presetName);
    if (presetName === 'spacious') {
      setNodeRepulsion(1100);
      setLinkDistance(170);
      setCenterGravity(0.035);
      setLinkCurvature(0.15);
    } else if (presetName === 'expansive') {
      setNodeRepulsion(1800);
      setLinkDistance(250);
      setCenterGravity(0.02);
      setLinkCurvature(0.2);
    } else if (presetName === 'balanced') {
      setNodeRepulsion(650);
      setLinkDistance(120);
      setCenterGravity(0.08);
      setLinkCurvature(0.1);
    } else if (presetName === 'clustered') {
      setNodeRepulsion(350);
      setLinkDistance(70);
      setCenterGravity(0.18);
      setLinkCurvature(0.05);
    }
  };

  // Export Graph Canvas to PNG
  const handleExportPNG = () => {
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        const imageURI = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `careeros-${visualTheme}-graph-${selectedCandidate}-${Date.now()}.png`;
        link.href = imageURI;
        link.click();
      }
    }
  };

  // Export Graph Data to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredData, null, 2));
    const link = document.createElement('a');
    link.download = `careeros-knowledge-graph-${selectedCandidate}.json`;
    link.href = dataStr;
    link.click();
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

  // ── Canvas Custom Node Drawers ─────────────────────────────────────────────
  const drawHexagon = (ctx, x, y, r, fill, stroke, strokeWidth) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth || 1;
      ctx.stroke();
    }
  };

  const drawDiamond = (ctx, x, y, r, fill, stroke, strokeWidth) => {
    ctx.beginPath();
    ctx.moveTo(x, y - r * 1.15);
    ctx.lineTo(x + r * 1.15, y);
    ctx.lineTo(x, y + r * 1.15);
    ctx.lineTo(x - r * 1.15, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth || 1;
      ctx.stroke();
    }
  };

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
            <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-medium">Active Links:</span>
            <span className="font-bold text-cyan-300">{filteredData.links.length}</span>
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
          <div className="pointer-events-auto relative w-56 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search people, skills, projects..."
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

          {/* Theme Quick Switcher Pills */}
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-lg">
            {Object.values(THEME_PALETTES).map((thm) => {
              const isActive = visualTheme === thm.id;
              return (
                <button
                  key={thm.id}
                  onClick={() => setVisualTheme(thm.id)}
                  title={thm.name}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: thm.nodeColors.user }} />
                  <span className="hidden md:inline">{thm.name.split(' ')[1]}</span>
                </button>
              );
            })}
          </div>

          {/* Graph Action Buttons & Quick Controls */}
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

            {/* Isolate Focus Subgraph Toggle */}
            <button
              onClick={() => setIsolateFocus(!isolateFocus)}
              title={isolateFocus ? 'Focus Mode Active (Dims unselected)' : 'Enable Focus Neighborhood Mode'}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                isolateFocus
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Focus className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-slate-700 mx-1" />

            {/* Open Full Studio Control Drawer */}
            <button
              onClick={() => setShowControlsDrawer(!showControlsDrawer)}
              title="Visual Themes, Geometry, Physics & Edge Styles"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                showControlsDrawer
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Studio & Styles</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-700 mx-1" />

            {/* Standard Zoom, Export & Refresh */}
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
              onClick={handleExportPNG}
              title="Export Graph Canvas as PNG Image"
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
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

        {/* ── Comprehensive Floating Studio Controls Drawer ───────────────── */}
        {showControlsDrawer && (
          <div className="absolute top-20 right-4 z-30 w-96 max-h-[580px] overflow-y-auto bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Visual Themes & Graph Studio</h3>
              </div>
              <button
                onClick={() => setShowControlsDrawer(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controls Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'styles', label: '🎨 Aesthetics' },
                { id: 'topology', label: '📐 Structure' },
                { id: 'physics', label: '⚡ Physics' },
                { id: 'connections', label: '🔗 Edges' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTabControls(t.id)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTabControls === t.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── TAB 1: Aesthetics, Themes & Shapes ───────────────────────── */}
            {activeTabControls === 'styles' && (
              <div className="space-y-4">
                {/* Visual Theme Palettes */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Color Palettes & Lighting</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(THEME_PALETTES).map((thm) => (
                      <button
                        key={thm.id}
                        onClick={() => setVisualTheme(thm.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          visualTheme === thm.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs">{thm.name}</div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {['user', 'skill', 'project', 'experience'].map((k) => (
                            <span
                              key={k}
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: thm.nodeColors[k] }}
                            />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Node Geometry & Shapes */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Node Geometry & Shapes</label>
                  <div className="grid grid-cols-2 gap-2">
                    {NODE_SHAPES.map((shape) => {
                      const Icon = shape.icon;
                      const isActive = nodeShape === shape.id;
                      return (
                        <button
                          key={shape.id}
                          onClick={() => setNodeShape(shape.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs">{shape.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Canvas Background Atmosphere */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Canvas Atmosphere</label>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {[
                      { id: 'grid', label: '📐 Cyber Grid', icon: Grid },
                      { id: 'stars', label: '✨ Starfield', icon: Stars },
                      { id: 'void', label: '⬛ Deep Void', icon: Moon },
                    ].map((atm) => (
                      <button
                        key={atm.id}
                        onClick={() => setBgAtmosphere(atm.id)}
                        className={`py-1.5 text-[11px] rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          bgAtmosphere === atm.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <atm.icon className="w-3 h-3" />
                        <span>{atm.label.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Node Sizing Strategy */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Node Sizing Metric</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'degree', label: 'Hub Degree Centrality' },
                      { id: 'category', label: 'Entity Category Size' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setNodeSizingMode(mode.id)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left ${
                          nodeSizingMode === mode.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: Topology & Layout Structure ───────────────────────── */}
            {activeTabControls === 'topology' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-2">Graph Layout Topologies</label>
                  <div className="space-y-2">
                    {TOPOLOGY_MODES.map((mode) => {
                      const Icon = mode.icon;
                      const isActive = topologyMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => setTopologyMode(mode.id)}
                          className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left ${
                            isActive
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold">{mode.name}</div>
                            <div className="text-[11px] opacity-75 mt-0.5 leading-relaxed">{mode.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {topologyMode !== 'organic' && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-300">Hierarchy Level Separation</span>
                      <span className="font-mono text-cyan-400 font-bold">{dagLevelDistance}px</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="260"
                      step="10"
                      value={dagLevelDistance}
                      onChange={(e) => setDagLevelDistance(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: Physics & Distance ───────────────────────────────── */}
            {activeTabControls === 'physics' && (
              <div className="space-y-4">
                {/* Spacing Presets */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-2">Spacing Presets</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'spacious', name: '🌌 Spacious (Clean)', desc: 'Optimal breathing room' },
                      { id: 'expansive', name: '🌐 Ultra-Wide Map', desc: 'Maximum node distance' },
                      { id: 'balanced', name: '🎯 Balanced Layout', desc: 'Standard force equilibrium' },
                      { id: 'clustered', name: '🧩 Tight Clustered', desc: 'Compact semantic groups' }
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
                  </div>

                  {/* Center Gravity */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-300">Center Gravity</span>
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
                </div>
              </div>
            )}

            {/* ── TAB 4: Connections & Edge Types ─────────────────────────── */}
            {activeTabControls === 'connections' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">Connection Types ({Object.keys(EDGE_TYPES).length})</label>
                  <button
                    onClick={() => {
                      const allTrue = Object.values(activeEdgeTypes).every(Boolean);
                      const updated = {};
                      Object.keys(EDGE_TYPES).forEach((k) => (updated[k] = !allTrue));
                      setActiveEdgeTypes(updated);
                    }}
                    className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                  >
                    Toggle All
                  </button>
                </div>

                {/* Edge Type Toggle Badges */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {Object.entries(EDGE_TYPES).map(([typeKey, info]) => {
                    const isActive = activeEdgeTypes[typeKey];
                    const edgeCol = currentTheme.edgeColors[typeKey] || '#818cf8';
                    return (
                      <button
                        key={typeKey}
                        onClick={() => toggleEdgeType(typeKey)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-slate-950/80 border-slate-700 text-slate-200 shadow-sm'
                            : 'bg-slate-950/30 border-slate-800/40 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: edgeCol }} />
                          <div>
                            <div className="text-xs font-semibold">{info.label}</div>
                            <div className="text-[10px] text-slate-500">{typeKey}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isActive ? 'Active' : 'Hidden'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Edge Geometry & Labels */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Show Text Labels On Links</span>
                    <button
                      onClick={() => setShowEdgeLabels(!showEdgeLabels)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        showEdgeLabels ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {showEdgeLabels ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-300">Link Curvature</span>
                      <span className="font-mono text-cyan-400">{linkCurvature.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.4"
                      step="0.05"
                      value={linkCurvature}
                      onChange={(e) => setLinkCurvature(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setVisualTheme('cyberpunk');
                  setNodeShape('sphere');
                  applyPreset('spacious');
                }}
                className="text-xs text-slate-400 hover:text-indigo-400 underline cursor-pointer"
              >
                Reset All Defaults
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
            backgroundColor={currentTheme.bg}
            dagMode={
              topologyMode === 'tree_td' ? 'td' :
              topologyMode === 'flow_lr' ? 'lr' :
              topologyMode === 'radial' ? 'radialout' :
              null
            }
            dagLevelDistance={dagLevelDistance}
            nodeRelSize={6}
            linkCurvature={topologyMode === 'organic' ? linkCurvature : 0}
            nodeVal={(node) => {
              if (nodeSizingMode === 'degree') {
                return (node.degree || 2) * 2.5 + (node.group === 'user' ? 8 : 4);
              }
              return node.val || 6;
            }}
            nodeLabel={(node) => `${node.label} (${node.group?.toUpperCase()}) — ${node.degree || 1} connections`}
            linkColor={(link) => {
              const edgeCol = currentTheme.edgeColors[link.type];
              if (edgeCol) return edgeCol;
              if (link.type === 'TEAM_SYNERGY') return currentTheme.candidateColors.candidate_all;
              return '#475569';
            }}
            linkWidth={(link) => {
              const isHighPrio = link.type === 'TEAM_SYNERGY' || link.type === 'MATCHES_PROFILE';
              return (isHighPrio ? 2.5 : 1.2) * linkWidthScale;
            }}
            linkDirectionalParticles={showParticles ? (link) => (link.type === 'TEAM_SYNERGY' ? 4 : link.type === 'USES_TECH' ? 1 : 2) : 0}
            linkDirectionalParticleSpeed={particleSpeed}
            linkDirectionalParticleWidth={(link) => (link.type === 'TEAM_SYNERGY' ? 3.5 : 2.2)}
            linkDirectionalParticleColor={(link) => {
              const edgeCol = currentTheme.edgeColors[link.type];
              return edgeCol || currentTheme.nodeColors.user;
            }}
            linkCanvasObjectMode={showEdgeLabels ? () => 'after' : undefined}
            linkCanvasObject={showEdgeLabels ? (link, ctx, globalScale) => {
              if (globalScale < 0.8) return;
              const start = link.source;
              const end = link.target;
              if (typeof start !== 'object' || typeof end !== 'object') return;
              const textPos = {
                x: start.x + (end.x - start.x) / 2,
                y: start.y + (end.y - start.y) / 2
              };
              const label = link.label || link.type;
              const fontSize = 8.5 / globalScale;
              ctx.font = `${fontSize}px Inter, sans-serif`;
              ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
              const textWidth = ctx.measureText(label).width;
              ctx.fillRect(textPos.x - textWidth / 2 - 2, textPos.y - fontSize / 2 - 1, textWidth + 4, fontSize + 2);
              ctx.fillStyle = currentTheme.edgeColors[link.type] || '#94a3b8';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(label, textPos.x, textPos.y);
            } : undefined}
            onNodeClick={handleNodeClick}
            onNodeHover={(node) => setHoverNode(node || null)}
            cooldownTicks={140}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoverNode?.id === node.id;
              const isCandidate = node.group === 'user';
              const isSharedSkill = node.is_shared;
              const isAchievement = node.group === 'achievement';
              
              // Focus Isolation Dimming
              const isDimmed = isolateFocus && activeFocusNeighborSet && !activeFocusNeighborSet.has(node.id);

              const nodeColor = isCandidate
                ? currentTheme.candidateColors[node.id] || currentTheme.nodeColors.user
                : currentTheme.nodeColors[node.group] || '#94a3b8';

              let radius;
              if (nodeSizingMode === 'degree') {
                radius = isCandidate ? 14 : Math.min(18, Math.max(5, (node.degree || 2) * 1.6));
              } else {
                radius = isCandidate ? 12 : isSharedSkill || isAchievement ? 9 : (node.val || 6) * 1.1;
              }

              ctx.globalAlpha = isDimmed ? 0.15 : 1.0;

              // Outer glowing aura
              if (isSelected || isHovered || isCandidate || isSharedSkill || isAchievement) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + (isSelected ? 6 : 3.5), 0, 2 * Math.PI, false);
                ctx.fillStyle = `${nodeColor}33`;
                ctx.fill();

                if (isSelected || isSharedSkill || isAchievement) {
                  ctx.strokeStyle = nodeColor;
                  ctx.lineWidth = 1.5;
                  ctx.stroke();
                }
              }

              // Render Node by Selected Geometry Shape
              if (nodeShape === 'hexagon') {
                drawHexagon(ctx, node.x, node.y, radius, nodeColor, '#ffffff', isCandidate ? 2 : 1);
              } else if (nodeShape === 'diamond') {
                drawDiamond(ctx, node.x, node.y, radius, nodeColor, '#ffffff', isCandidate ? 2 : 1);
              } else if (nodeShape === 'badge') {
                const label = node.label || node.id;
                const bw = Math.max(radius * 2.2, label.length * 4.5 + 16);
                const bh = radius * 1.6;
                ctx.beginPath();
                ctx.roundRect(node.x - bw / 2, node.y - bh / 2, bw, bh, 6);
                ctx.fillStyle = `${nodeColor}ee`;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = isCandidate ? 2 : 0.8;
                ctx.stroke();
              } else {
                // Sphere (Default)
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = nodeColor;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = isCandidate ? 1.8 : 0.8;
                ctx.stroke();
              }

              // Determine whether to draw label
              const shouldDrawLabel =
                !isDimmed &&
                nodeShape !== 'badge' && (
                  labelMode === 'always' ||
                  isSelected ||
                  isHovered ||
                  (labelMode === 'key_only' && (isCandidate || isSharedSkill || isAchievement)) ||
                  (labelMode === 'smart' && (globalScale > 0.75 || isCandidate || isSharedSkill || isAchievement))
                );

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

                ctx.fillStyle = isCandidate ? '#ffffff' : '#cbd5e1';
                ctx.fillText(label, node.x, node.y + radius + 3);
              }

              ctx.globalAlpha = 1.0;
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
                    backgroundColor: `${currentTheme.nodeColors[selectedNode.group] || '#6366f1'}22`,
                    border: `1.5px solid ${currentTheme.nodeColors[selectedNode.group] || '#6366f1'}`,
                  }}
                >
                  {(() => {
                    const IconComponent = NODE_ICONS[selectedNode.group] || Sparkles;
                    return <IconComponent className="w-6 h-6" style={{ color: currentTheme.nodeColors[selectedNode.group] || '#6366f1' }} />;
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
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                      {selectedNode.degree || 1} Connections
                    </span>
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
                        style={{ backgroundColor: currentTheme.nodeColors[node.group] || '#6366f1' }}
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
