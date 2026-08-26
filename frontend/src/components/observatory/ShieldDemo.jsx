import React, { useState } from 'react';
import { Shield, ShieldOff, Zap, AlertTriangle, CheckCircle, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const identityMatrix = [
  { agent: 'root_agent', scope: 'Full Access', secure: true },
  { agent: 'document_processor', scope: 'Read/Write File', secure: true },
  { agent: 'opportunity_scout', scope: 'Network Out', secure: true },
  { agent: 'untrusted_plugin', scope: 'Unknown', secure: false },
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
        // Mock fallback response
        await new Promise(r => setTimeout(r, 1500));
        data = shieldOn 
          ? { status: 'blocked', sub_agent: 'untrusted_plugin', attempted_tool: 'delete_database', allowed_tools: ['read_temp'] }
          : { status: 'breached', executed_result: 'Database tables dropped successfully.', warning: 'Unsecured execution enabled.' };
      }
      setAttackResult(data);
    } catch (error) {
      await new Promise(r => setTimeout(r, 1500));
      setAttackResult(shieldOn 
        ? { status: 'blocked', sub_agent: 'untrusted_plugin', attempted_tool: 'delete_database', allowed_tools: ['read_temp'] }
        : { status: 'breached', executed_result: 'Data exfiltrated successfully.', warning: 'Unsecured execution enabled.' });
    } finally {
      setIsAttacking(false);
    }
  };

  return (
    <GlassCard className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b border-slate-800">
        <Shield className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-semibold text-slate-100">ArmorIQ Shield Simulator</h2>
      </div>
      
      <div className="p-6 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => { setShieldOn(!shieldOn); setAttackResult(null); }}
              className={`relative flex items-center justify-between w-48 h-16 rounded-full p-2 cursor-pointer transition-all duration-500 border-2 ${
                shieldOn 
                  ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
                  : 'bg-red-950/40 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
              }`}
            >
              <motion.div
                animate={{ x: shieldOn ? 128 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg absolute z-10 ${
                  shieldOn ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
                }`}
              >
                {shieldOn ? <Shield className="w-6 h-6" /> : <ShieldOff className="w-6 h-6" />}
              </motion.div>
              <div className={`w-full flex justify-between px-4 text-xs font-bold uppercase tracking-wider z-0 ${shieldOn ? 'text-emerald-400' : 'text-red-400'}`}>
                <span className={shieldOn ? 'opacity-0' : 'opacity-100 pl-14'}>Unsecured</span>
                <span className={shieldOn ? 'opacity-100 pr-14' : 'opacity-0'}>Protected</span>
              </div>
            </button>
            <p className="text-sm text-slate-400 text-center max-w-xs">
              Toggle ArmorIQ to secure agent tool execution scopes.
            </p>
          </div>

          <button
            onClick={simulateAttack}
            disabled={isAttacking}
            className="w-full max-w-xs py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isAttacking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            Simulate Prompt Injection
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {identityMatrix.map((id, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 flex flex-col gap-2 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono font-bold text-slate-300">{id.agent}</span>
                  {id.secure && shieldOn ? <Lock className="w-3 h-3 text-emerald-500" /> : <ShieldOff className="w-3 h-3 text-slate-600" />}
                </div>
                <Badge variant={id.secure ? 'outline' : 'destructive'} className="text-[9px] w-fit">
                  Scope: {id.scope}
                </Badge>
                {(!shieldOn && !id.secure) && <div className="absolute inset-0 border-2 border-red-500/50 rounded-lg animate-pulse pointer-events-none" />}
              </div>
            ))}
          </div>

          <div className="mt-4 h-48 border border-slate-800 rounded-xl bg-slate-950 p-4 overflow-hidden relative">
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Attack Log</h3>
            
            <AnimatePresence mode="wait">
              {isAttacking && (
                <motion.div key="attacking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-24 gap-3">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                  <span className="text-xs text-amber-400 font-mono">Executing injected prompt...</span>
                </motion.div>
              )}
              
              {attackResult && attackResult.status === 'blocked' && (
                <motion.div key="blocked" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
                  <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-lg p-3 flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-400">ARMORIQ PROTECTED & BLOCKED</h4>
                      <p className="text-xs text-emerald-200/70">Malicious intent neutralized</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-2"><span className="text-blue-400">1. Intent Capture:</span> <span>Prompt intercepted</span></div>
                    <div className="flex items-center gap-2"><span className="text-indigo-400">2. Token Auth:</span> <span>Agent token verified</span></div>
                    <div className="flex items-center gap-2"><span className="text-amber-400">3. Scope Verify:</span> <span>{attackResult.attempted_tool} NOT in {JSON.stringify(attackResult.allowed_tools)}</span></div>
                    <div className="flex items-center gap-2 text-red-400"><span className="font-bold">4. INTERCEPT:</span> <span>Execution denied instantly</span></div>
                  </div>
                </motion.div>
              )}

              {attackResult && attackResult.status === 'breached' && (
                <motion.div key="breached" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full justify-center">
                  <div className="bg-red-950/40 border-2 border-red-500 rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden animate-[shake_0.5s_ease-in-out]">
                    <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                    <div className="flex items-center gap-3 relative z-10">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                      <div>
                        <h4 className="text-lg font-bold text-red-500">UNSECURED BREACH EXPLOITED</h4>
                        <p className="text-xs text-red-300 font-mono mt-1">{attackResult.warning}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-red-500/30 relative z-10">
                      <span className="text-xs text-red-400 font-mono">
                        Result: {typeof attackResult.executed_result === 'object' ? JSON.stringify(attackResult.executed_result) : String(attackResult.executed_result || '')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {!isAttacking && !attackResult && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex items-center justify-center">
                  <span className="text-xs text-slate-600 font-mono">Waiting for simulation...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}} />
    </GlassCard>
  );
}
