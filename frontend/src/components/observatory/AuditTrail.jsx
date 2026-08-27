import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  Key,
  Lock,
  Clock,
  CheckCircle2,
  Filter,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import { fetchAuditLogs } from '../../api/client';

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchAuditLogs();
      if (data && data.logs && data.logs.length > 0) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.warn('Audit fetch fallback:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 6000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const status = log.status || '';
    const event = log.event || '';

    let category = 'INVOKED';
    if (status.includes('BLOCKED') || event.includes('BLOCKED')) category = 'BLOCKED';
    else if (event === 'PLAN_CAPTURED' || status === 'AUTHORIZED') category = 'PLAN';
    else if (event === 'AUTHORITY_DELEGATED' || status === 'DELEGATED') category = 'DELEGATED';
    else if (status === 'HELD_APPROVAL' || event.includes('APPROVAL')) category = 'HELD';
    else if (status.includes('ALLOWED')) category = 'ALLOWED';

    if (filter !== 'ALL') {
      if (filter === 'BLOCKED' && category !== 'BLOCKED') return false;
      if (filter === 'DELEGATED' && category !== 'DELEGATED') return false;
      if (filter === 'PLAN' && category !== 'PLAN') return false;
      if (filter === 'HELD' && category !== 'HELD') return false;
      if (filter === 'ALLOWED' && category !== 'ALLOWED') return false;
    }

    if (search) {
      const term = search.toLowerCase();
      const agent = (log.sub_agent || log.agent_id || log.parent_agent || '').toLowerCase();
      const tool = (log.requested_tool || log.intent || log.event || '').toLowerCase();
      const token = (log.token_id || log.plan_id || '').toLowerCase();
      return agent.includes(term) || tool.includes(term) || token.includes(term);
    }

    return true;
  });

  const exportAuditProof = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `armoriq_audit_proof_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogBorder = (log) => {
    const status = log.status || '';
    const event = log.event || '';
    if (status.includes('BLOCKED') || event.includes('BLOCKED')) return 'border-rose-500 bg-rose-950/20';
    if (status === 'HELD_APPROVAL' || event.includes('APPROVAL')) return 'border-amber-500 bg-amber-950/20';
    if (event === 'AUTHORITY_DELEGATED' || status === 'DELEGATED') return 'border-cyan-500 bg-cyan-950/20';
    if (event === 'PLAN_CAPTURED') return 'border-indigo-500 bg-indigo-950/20';
    return 'border-emerald-500 bg-emerald-950/20';
  };

  return (
    <GlassCard className="flex flex-col h-full overflow-hidden">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Cryptographic Chain of Trust & Audit Ledger</h2>
              <Badge variant="primary" className="px-2 py-0.5 text-[10px]">
                {logs.length} Receipts
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Immutable log of every plan capture, signed delegation token, and guarded tool invocation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={exportAuditProof}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95"
            title="Download Full Cryptographic Proof JSON"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export JSON Proof</span>
          </button>

          <button
            onClick={loadLogs}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'DELEGATED', label: 'Delegations' },
            { id: 'ALLOWED', label: 'Allowed Tools' },
            { id: 'BLOCKED', label: 'Blocked Violations' },
            { id: 'HELD', label: 'Held Approvals' },
            { id: 'PLAN', label: 'Plan Captures' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border ${
                filter === f.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search agent, tool, token ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 font-mono"
          />
        </div>
      </div>

      {/* Audit Log Entries List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[500px] custom-scrollbar bg-slate-950/20">
        <AnimatePresence>
          {filteredLogs.map((log, idx) => {
            const logId = log.action_id || log.token_id || log.plan_id || `log_${idx}`;
            const rawTime = log.timestamp
              ? typeof log.timestamp === 'number' && log.timestamp < 10000000000
                ? log.timestamp * 1000
                : log.timestamp
              : Date.now();
            const timeStr = new Date(rawTime).toLocaleTimeString();
            const isExpanded = expandedId === logId;

            return (
              <motion.div
                key={logId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`rounded-2xl border-l-4 border-y border-r border-slate-800/90 transition-all ${getLogBorder(
                  log
                )}`}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : logId)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 transition-colors gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">{timeStr}</span>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-extrabold font-mono rounded-full uppercase shrink-0 ${
                        log.status?.includes('BLOCKED')
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : log.status === 'HELD_APPROVAL'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : log.status === 'DELEGATED'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {log.status || 'SUCCESS'}
                    </span>

                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs font-bold text-slate-200 font-mono truncate">
                        {log.sub_agent || log.agent_id || log.parent_agent || 'Root Coordinator'}
                      </span>
                      <span className="text-slate-600">→</span>
                      <span className="text-xs font-mono text-indigo-300 truncate">
                        {log.requested_tool || log.event || log.intent || 'action'}()
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {log.ttl_seconds && (
                      <span className="hidden md:inline text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        TTL: {log.ttl_seconds}s
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-800/80 bg-slate-950/90 p-4 space-y-3 font-mono text-xs overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                        <div>
                          <span className="text-slate-500">Event: </span>
                          <span className="text-indigo-400 font-bold">{log.event}</span>
                        </div>
                        {log.token_id && (
                          <div>
                            <span className="text-slate-500">Token ID: </span>
                            <span className="text-cyan-300">{log.token_id}</span>
                          </div>
                        )}
                        {log.allowed_scopes && (
                          <div className="sm:col-span-2">
                            <span className="text-slate-500">Allowed Scopes: </span>
                            <span className="text-emerald-300">{Array.isArray(log.allowed_scopes) ? log.allowed_scopes.join(', ') : log.allowed_scopes}</span>
                          </div>
                        )}
                        {log.reason && (
                          <div className="sm:col-span-2 text-rose-400">
                            <span className="text-slate-500">Interception Reason: </span>
                            {log.reason}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Cryptographic Payload & Args:</span>
                        <pre className="p-3 bg-slate-900 rounded-xl text-[11px] text-indigo-200 overflow-x-auto border border-slate-800 custom-scrollbar">
                          {JSON.stringify(log.tool_args || log.details || log, null, 2)}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <ScrollText className="w-8 h-8 text-slate-600" />
              <div className="text-xs font-mono">No cryptographic audit logs matched your search filters.</div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
