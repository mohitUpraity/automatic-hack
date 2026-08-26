import React, { useState, useEffect } from 'react';
import { ScrollText, RefreshCw, AlertTriangle, ShieldCheck, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const mockLogs = [
  { id: 1, timestamp: new Date().toISOString(), status: 'SUCCESS', type: 'DELEGATED', agent: 'root_agent', tool: 'delegate', scope: 'document_processor', ttl: '5m', details: { target: 'document_processor', tokens: 100 } },
  { id: 2, timestamp: new Date(Date.now() - 1000).toISOString(), status: 'SUCCESS', type: 'INVOKED', agent: 'document_processor', tool: 'convert_document', scope: 'self', details: { file: 'resume.pdf' } },
  { id: 3, timestamp: new Date(Date.now() - 3000).toISOString(), status: 'ERROR', type: 'BLOCKED', agent: 'untrusted_agent', tool: 'rm_rf', scope: 'system', reason: 'Scope violation intercepted by ArmorIQ', details: { attempted_tool: 'rm_rf', allowed: ['read'] } }
];

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/audit-logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || mockLogs);
      } else {
        setLogs(mockLogs);
      }
    } catch (error) {
      setLogs(mockLogs);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const logType = log.type || (log.status?.includes('BLOCKED') ? 'BLOCKED' : log.status === 'DELEGATED' ? 'DELEGATED' : 'INVOKED');
    if (filter !== 'ALL' && logType !== filter) return false;
    if (search) {
      const term = search.toLowerCase();
      const agentName = (log.agent || log.sub_agent || log.agent_id || log.parent_agent || '').toLowerCase();
      const toolName = (log.tool || log.requested_tool || log.event || '').toLowerCase();
      return agentName.includes(term) || toolName.includes(term);
    }
    return true;
  });

  const getLogStyles = (type) => {
    switch (type) {
      case 'BLOCKED': return 'border-red-500 bg-red-950/10';
      case 'DELEGATED': return 'border-blue-500 bg-blue-950/10';
      case 'INVOKED': return 'border-emerald-500 bg-emerald-950/10';
      default: return 'border-slate-600 bg-slate-900/50';
    }
  };

  return (
    <GlassCard className="flex flex-col h-full max-h-[600px]">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-slate-100">Audit Trail</h2>
          <Badge variant="primary" className="ml-2">{logs.length}</Badge>
        </div>
        <button onClick={fetchLogs} className={`p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-4 border-b border-slate-800/50 flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'DELEGATED', 'INVOKED', 'BLOCKED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                filter === f 
                  ? f === 'BLOCKED' ? 'bg-red-500/20 text-red-400 border-red-500/50'
                    : f === 'DELEGATED' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                    : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50'
                  : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search agent or tool..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-96 custom-scrollbar">
        <AnimatePresence>
          {filteredLogs.map((log, idx) => {
            const logId = log.id || `audit-${log.token_id || log.plan_id || log.event || 'item'}-${idx}-${log.timestamp || ''}`;
            const logType = log.type || (log.status?.includes('BLOCKED') ? 'BLOCKED' : log.status === 'DELEGATED' ? 'DELEGATED' : 'INVOKED');
            const agentName = log.agent || log.sub_agent || log.agent_id || log.parent_agent || 'System';
            const toolName = log.tool || log.requested_tool || log.event || 'action';
            const rawTime = log.timestamp ? (typeof log.timestamp === 'number' && log.timestamp < 10000000000 ? log.timestamp * 1000 : log.timestamp) : Date.now();
            const timeStr = new Date(rawTime).toLocaleTimeString();
            const isError = log.status === 'ERROR' || log.status?.includes('BLOCKED') || log.status === 'BLOCKED_SECURITY_VIOLATION';

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={logId}
                className={`rounded-lg border-l-4 border-y border-r border-slate-700/50 cursor-pointer transition-colors hover:bg-slate-800/50 ${getLogStyles(logType)}`}
                onClick={() => setExpandedId(expandedId === logId ? null : logId)}
              >
                <div className="p-3 flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {timeStr}
                      </span>
                      <Badge variant={isError ? 'destructive' : 'success'} className="text-[9px] px-1.5 py-0">
                        {log.status || 'SUCCESS'}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-300">{agentName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-mono text-indigo-300">{toolName}()</span>
                      {logType === 'DELEGATED' && <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">scope: {Array.isArray(log.allowed_scopes) ? log.allowed_scopes.join(', ') : log.scope || 'default'} | TTL: {log.ttl_seconds ? `${log.ttl_seconds}s` : log.ttl || '5m'}</span>}
                      {logType === 'BLOCKED' && <span className="text-xs text-red-400 flex items-center gap-1"><Zap className="w-3 h-3"/> {log.reason || 'Scope violation intercepted by ArmorIQ'}</span>}
                    </div>
                  </div>
                  {expandedId === logId ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
                
                <AnimatePresence>
                  {expandedId === logId && (log.details || log.tool_args || log.allowed_tools) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-700/50"
                    >
                      <div className="p-3 bg-slate-950/50 text-xs font-mono text-slate-400">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(log.details || { tool_args: log.tool_args, allowed_tools: log.allowed_tools }, null, 2)}</pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No audit logs found matching criteria.
            </div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
