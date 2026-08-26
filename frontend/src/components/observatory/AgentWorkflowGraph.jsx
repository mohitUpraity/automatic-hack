import React, { useState, useEffect, useCallback } from 'react';
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
import { Bot, Crown, ShieldAlert, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const getStatusStyles = (status) => {
  switch (status) {
    case 'working':
      return { border: 'border-amber-400', bg: 'bg-amber-400/10', icon: <Loader2 className="w-4 h-4 text-amber-400 animate-spin" /> };
    case 'completed':
      return { border: 'border-emerald-400', bg: 'bg-emerald-400/10', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> };
    case 'error':
      return { border: 'border-red-400', bg: 'bg-red-400/10', icon: <ShieldAlert className="w-4 h-4 text-red-400" /> };
    case 'blocked':
      return { border: 'border-red-600', bg: 'bg-red-600/20', icon: <Zap className="w-4 h-4 text-red-600 animate-pulse" /> };
    default:
      return { border: 'border-slate-600', bg: 'bg-slate-800/50', icon: <Bot className="w-4 h-4 text-slate-400" /> };
  }
};

const AgentNode = ({ data }) => {
  const { border, bg, icon } = getStatusStyles(data.status);
  
  return (
    <div className={`relative flex flex-col p-4 w-64 rounded-xl border-l-4 ${border} bg-slate-900/80 backdrop-blur-sm border-y border-r border-slate-700/50 shadow-xl ${data.status === 'blocked' ? 'animate-pulse' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-500" />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-slate-100">{data.name}</h3>
        </div>
        <Badge variant={data.status === 'idle' ? 'default' : data.status === 'blocked' ? 'destructive' : 'primary'} className="text-[10px] px-1 py-0">
          {data.status || 'idle'}
        </Badge>
      </div>
      
      <p className="text-xs text-slate-400 mb-3 truncate" title={data.description}>
        {data.description}
      </p>
      
      <div className="flex flex-wrap gap-1 mt-auto">
        {data.tools?.map((tool, idx) => (
          <span key={idx} className="px-1.5 py-0.5 text-[10px] rounded-md bg-slate-800 text-slate-300 border border-slate-700">
            {tool.name}
          </span>
        ))}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-indigo-500" />
    </div>
  );
};

const RootNode = ({ data }) => {
  return (
    <div className="relative flex flex-col items-center justify-center p-4 w-72 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 border border-indigo-400/50 shadow-2xl shadow-indigo-500/20">
      <div className="absolute -top-3 bg-slate-900 rounded-full p-1 border border-indigo-500">
        <Crown className="w-5 h-5 text-amber-400" />
      </div>
      <h2 className="text-lg font-bold text-white mt-2">{data.name}</h2>
      <p className="text-xs text-indigo-100 text-center mt-1">{data.description}</p>
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/adk/graph`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        if (data && data.root_agent) {
          const root = data.root_agent;
          const initialNodes = [
            {
              id: 'root',
              type: 'root',
              position: { x: 400, y: 0 },
              data: { name: root.name, description: root.description, status: 'working' }
            }
          ];
          const initialEdges = [];
          
          if (root.sub_agents && Array.isArray(root.sub_agents)) {
            root.sub_agents.forEach((agent, index) => {
              const row = index < 4 ? 0 : 1;
              const col = index % 4;
              
              initialNodes.push({
                id: `agent-${index}`,
                type: 'agent',
                position: { x: col * 250, y: 180 + row * 180 },
                data: {
                  name: agent.name,
                  description: agent.description,
                  tools: agent.tools || [],
                  status: 'idle'
                }
              });
              
              initialEdges.push({
                id: `edge-root-${index}`,
                source: 'root',
                target: `agent-${index}`,
                animated: true,
                label: 'delegate()',
                style: { stroke: '#6366f1', strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#6366f1',
                },
                labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 500 },
                labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
                labelBgPadding: [4, 2],
                labelBgBorderRadius: 4
              });
            });
          }
          setNodes(initialNodes);
          setEdges(initialEdges);
        }
      } catch (error) {
        console.error('Error fetching graph:', error);
        // Fallback dummy data if API fails
        setNodes([
          { id: 'root', type: 'root', position: { x: 400, y: 0 }, data: { name: 'root_agent', description: 'Orchestrates the workflow', status: 'working' } },
          { id: 'agent-1', type: 'agent', position: { x: 0, y: 180 }, data: { name: 'document_processor', description: 'Processes documents', status: 'completed', tools: [{name: 'convert'}] } },
          { id: 'agent-2', type: 'agent', position: { x: 250, y: 180 }, data: { name: 'resume_extractor', description: 'Extracts data', status: 'working', tools: [{name: 'extract'}] } },
          { id: 'agent-3', type: 'agent', position: { x: 500, y: 180 }, data: { name: 'profile_maker', description: 'Builds profile', status: 'idle', tools: [{name: 'build'}] } },
          { id: 'agent-4', type: 'agent', position: { x: 750, y: 180 }, data: { name: 'opportunity_scout', description: 'Finds jobs', status: 'idle', tools: [{name: 'search'}] } }
        ]);
        setEdges([
          { id: 'e1', source: 'root', target: 'agent-1', animated: true, label: 'delegate()', style: { stroke: '#6366f1', strokeWidth: 2 } },
          { id: 'e2', source: 'root', target: 'agent-2', animated: true, label: 'delegate()', style: { stroke: '#6366f1', strokeWidth: 2 } },
          { id: 'e3', source: 'root', target: 'agent-3', animated: true, label: 'delegate()', style: { stroke: '#6366f1', strokeWidth: 2 } },
          { id: 'e4', source: 'root', target: 'agent-4', animated: true, label: 'delegate()', style: { stroke: '#6366f1', strokeWidth: 2 } }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGraph();
  }, [setNodes, setEdges]);

  if (isLoading) {
    return (
      <GlassCard className="flex items-center justify-center h-[450px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </GlassCard>
    );
  }

  return (
    <div className="w-full h-[450px] rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
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
        <Background color="rgba(100,116,139,0.1)" gap={16} size={1} />
        <Controls className="bg-slate-900 border-slate-700 fill-slate-300" />
      </ReactFlow>
    </div>
  );
}
