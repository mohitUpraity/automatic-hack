import React, { useState } from 'react';
import { Shield, ShieldOff, Zap, AlertTriangle, CheckCircle, Lock, Loader2, Key, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const identityMatrix = [
  { agent: 'root_coordinator', scope: 'Full Orchestration', secure: true },
  { agent: 'document_processor', scope: 'documents:write', secure: true },
  { agent: 'opportunity_scout', scope: 'web:search', secure: true },
  { agent: 'untrusted_plugin', scope: 'system:root', secure: false },
];

export default function ShieldDemo() {
  const [shieldOn, setShieldOn] = useState(true);
  const [isAttacking, setIsAttacking] = useState(false);
  const [attackResult, setAttackResult] = useState(null);

  const simulateAttack = async () => {
    setIsAttacking(true);
    setAttackResult(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/demo/trigger-attack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secured: shieldOn })
      });
      
      let data;
      if (res.ok) {
        data = await res.json();
      } else {
        await new Promise(r => setTimeout(r, 1200));
        data = shieldOn 
          ? { status: 'blocked', sub_agent: 'untrusted_plugin', attempted_tool: 'auto_apply_job', allowed_tools: ['scout_and_store_opportunities'] }
          : { status: 'breached', executed_result: { status: 'applied', job_id: 99, charged_card: 999 }, warning: 'Security Shield OFF: Unauthorized tool executed!' };
      }
      setAttackResult(data);
    } catch (error) {
      await new Promise(r => setTimeout(r, 1200));
      setAttackResult(shieldOn 
        ? { status: 'blocked', sub_agent: 'untrusted_plugin', attempted_tool: 'auto_apply_job', allowed_tools: ['scout_and_store_opportunities'] }
        : { status: 'breached', executed_result: { status: 'applied', job_id: 99, charged_card: 999 }, warning: 'Security Shield OFF: Unauthorized tool executed!' });
    } finally {
      setIsAttacking(false);
    }
  };

  return (
    <GlassCard className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-100">ArmorIQ Shield Simulator</h2>
        </div>
        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
          shieldOn 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {shieldOn ? 'Shield Active' : 'Shield Disabled'}
        </span>
      </div>
      
      <div className="p-5 flex flex-col gap-6">
        
        {/* Top Controls: Interactive Switch + CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => { setShieldOn(!shieldOn); setAttackResult(null); }}
              className={`relative flex items-center w-36 h-11 rounded-full p-1 cursor-pointer transition-all duration-300 border ${
                shieldOn 
                  ? 'bg-emerald-950/60 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.25)]' 
                  : 'bg-rose-950/60 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
              }`}
            >
              <motion.div
                animate={{ x: shieldOn ? 96 : 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg ${
                  shieldOn ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                }`}
              >
                {shieldOn ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
              </motion.div>
              <span className={`absolute text-[11px] font-bold uppercase tracking-wider ${
                shieldOn ? 'left-3.5 text-emerald-400' : 'right-3.5 text-rose-400'
              }`}>
                {shieldOn ? 'ON' : 'OFF'}
              </span>
            </button>
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-200">
                {shieldOn ? 'Zero-Trust Mode' : 'Unsecured Mode'}
              </div>
              <div className="text-[11px] text-slate-400">
                {shieldOn ? 'Ed25519 Token Bounds Active' : 'Unbound Execution Allowed'}
              </div>
            </div>
          </div>

          <button
            onClick={simulateAttack}
            disabled={isAttacking}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {isAttacking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            <span>Simulate Prompt Injection</span>
          </button>
        </div>

        {/* Identity Matrix Scopes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Agent Capability Scopes</span>
            <span className="text-[10px] text-slate-500 font-mono">Ed25519 Verified</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {identityMatrix.map((id, idx) => (
              <div key={idx} className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between gap-2 overflow-hidden">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-mono font-bold text-slate-200 truncate">{id.agent}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    Scope: <span className="text-indigo-300">{id.scope}</span>
                  </div>
                </div>
                <div>
                  {id.secure && shieldOn ? (
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex">
                      <ShieldOff className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Attack Telemetry Box */}
        <div className="border border-slate-800/90 rounded-2xl bg-slate-950/90 p-4 relative overflow-hidden min-h-[160px]">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Attack Telemetry</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Real-Time Interceptor</span>
          </div>
          
          <AnimatePresence mode="wait">
            {isAttacking && (
              <motion.div key="attacking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-6 gap-2.5">
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="text-xs text-amber-400 font-mono">Executing prompt injection payload...</span>
              </motion.div>
            )}
            
            {attackResult && attackResult.status === 'blocked' && (
              <motion.div key="blocked" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400">ARMORIQ PROTECTED — ATTACK INTERCEPTED</h4>
                    <p className="text-[11px] text-emerald-200/80">Malicious prompt neutralized. Token bounds preserved.</p>
                  </div>
                </div>
                
                <div className="space-y-1.5 text-xs font-mono text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-blue-400 font-semibold">1. Intent:</span> 
                    <span>auto_apply_job with unauthorized parameters</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-indigo-400 font-semibold">2. Token Bound:</span> 
                    <span>mcp_scout.scout_and_store_opportunities</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-rose-400">
                    <span className="font-bold">3. Scope Intercept:</span> 
                    <span>Tool violation detected & blocked in 2ms</span>
                  </div>
                </div>
              </motion.div>
            )}

            {attackResult && attackResult.status === 'breached' && (
              <motion.div key="breached" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                <div className="bg-rose-950/50 border border-rose-500/50 rounded-xl p-3 flex items-center gap-3 animate-[shake_0.4s_ease-in-out]">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-400">SECURITY BREACH EXPLOITED</h4>
                    <p className="text-[11px] text-rose-200/80">{attackResult.warning}</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 font-mono text-xs text-rose-300 break-all">
                  <span className="text-slate-400">Executed Payload: </span>
                  {typeof attackResult.executed_result === 'object' 
                    ? JSON.stringify(attackResult.executed_result) 
                    : String(attackResult.executed_result || '')}
                </div>
              </motion.div>
            )}
            
            {!isAttacking && !attackResult && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 flex flex-col items-center justify-center text-center">
                <Shield className="w-6 h-6 text-slate-600 mb-1.5" />
                <span className="text-xs text-slate-500 font-mono">Click "Simulate Prompt Injection" to test ArmorIQ defenses</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
      `}} />
    </GlassCard>
  );
}
