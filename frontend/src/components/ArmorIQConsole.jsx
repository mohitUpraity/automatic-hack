import React, { useState, useEffect } from 'react';
import { triggerAttack, fetchAuditLogs } from '../api/client';
import { Shield, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';

export default function ArmorIQConsole() {
  const [secured, setSecured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [attackResult, setAttackResult] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const loadAuditLogs = async () => {
    try {
      const data = await fetchAuditLogs();
      if (data.status === 'success') {
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleSimulateAttack = async () => {
    setLoading(true);
    setAttackResult(null);
    try {
      const res = await triggerAttack(secured);
      setAttackResult(res);
      await loadAuditLogs();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${secured ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {secured ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">ArmorIQ Multi-Agent Governance Shield</h2>
            <p className="text-xs text-slate-500">Problem 2 Hackathon Track — 8 RSA Sub-Agent Keypair Matrix</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <span className="text-xs font-semibold text-slate-700">ArmorIQ Shield:</span>
          <button
            onClick={() => setSecured(!secured)}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              secured ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {secured ? 'PROTECTED (ON)' : 'DISABLED (OFF)'}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Simulate Prompt Injection Attack (Scope Violation)</h3>
        <p className="text-xs text-slate-600 mb-3">
          Simulates a malicious prompt instructing <strong>opportunity_scout</strong> agent to invoke <strong>auto_apply_job</strong> tool (outside delegated scope).
        </p>

        <button
          onClick={handleSimulateAttack}
          disabled={loading}
          className={`px-4 py-2 text-white font-semibold rounded-lg text-xs transition-colors ${
            secured ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {loading ? 'Executing Simulation...' : secured ? 'Trigger Attack (ArmorIQ Active)' : 'Trigger Attack (Unprotected Bypass)'}
        </button>

        {attackResult && (
          <div className={`mt-4 p-3 rounded-lg border text-xs ${
            attackResult.status === 'blocked' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'
          }`}>
            <p className="font-bold text-sm mb-1">{attackResult.status === 'blocked' ? '🛡️ ATTACK BLOCKED BY ARMORIQ' : '⚠️ UNSECURED BREACH EXPLOITED'}</p>
            <p className="font-mono">{attackResult.message || attackResult.warning}</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm mb-3">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>Live Cryptographic Governance Audit Trail ({auditLogs.length} events)</span>
        </div>
        <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs max-h-48 overflow-y-auto space-y-1">
          {auditLogs.length === 0 ? (
            <p className="text-slate-500">No audit logs recorded yet.</p>
          ) : (
            auditLogs.map((log, idx) => (
              <div key={idx} className="border-b border-slate-800 pb-1">
                <span className="text-slate-400">[{new Date(log.timestamp * 1000).toLocaleTimeString()}]</span>{' '}
                <span className={log.status && log.status.includes('BLOCKED') ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {log.status}
                </span>{' '}
                <span className="text-purple-300">Agent: {log.sub_agent || log.agent_id}</span> → Tool: {log.requested_tool || log.tool_name}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
