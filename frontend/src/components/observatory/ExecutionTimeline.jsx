import React, { useState } from 'react';
import { Activity, Clock, Loader2, CheckCircle2, ShieldAlert, ShieldOff, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';

const defaultStages = [
  { stage: 1, agent: 'document_processor', tool: 'convert_document', status: 'pending' },
  { stage: 2, agent: 'resume_extractor', tool: 'extract_entities', status: 'pending' },
  { stage: 3, agent: 'resume_analyzer', tool: 'analyze_skills', status: 'pending' },
  { stage: 4, agent: 'profile_maker', tool: 'generate_profile', status: 'pending' },
  { stage: 5, agent: 'opportunity_scout', tool: 'search_jobs', status: 'pending' },
  { stage: 6, agent: 'opportunity_ranker', tool: 'rank_opportunities', status: 'pending' },
  { stage: 7, agent: 'knowledge_builder', tool: 'build_graph', status: 'pending' },
  { stage: 8, agent: 'resume_tailor', tool: 'tailor_resume', status: 'pending' }
];

export default function ExecutionTimeline({ stages = defaultStages }) {
  const [selectedResult, setSelectedResult] = useState(null);
  const activeStages = stages && stages.length > 0 ? stages : defaultStages;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return { 
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          circleClass: 'bg-emerald-500/20 border-emerald-500',
          lineClass: 'border-emerald-500 border-solid',
          textClass: 'text-emerald-400'
        };
      case 'running':
        return { 
          icon: <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />,
          circleClass: 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
          lineClass: 'border-amber-500 border-dashed border-2 animate-[dash_1s_linear_infinite]',
          textClass: 'text-amber-400'
        };
      case 'error':
        return { 
          icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
          circleClass: 'bg-red-500/20 border-red-500',
          lineClass: 'border-red-500 border-dashed',
          textClass: 'text-red-400'
        };
      case 'blocked':
        return { 
          icon: <ShieldOff className="w-5 h-5 text-red-600 animate-pulse" />,
          circleClass: 'bg-red-600/30 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.7)]',
          lineClass: 'border-red-600 border-solid',
          textClass: 'text-red-500'
        };
      default: // pending
        return { 
          icon: <Clock className="w-5 h-5 text-slate-500" />,
          circleClass: 'bg-slate-800 border-slate-700',
          lineClass: 'border-slate-700 border-dotted',
          textClass: 'text-slate-500'
        };
    }
  };

  return (
    <GlassCard className="w-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-slate-800">
        <Activity className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-semibold text-slate-100">Execution Timeline</h2>
      </div>
      
      <div className="p-6 overflow-x-auto">
        <div className="flex items-start min-w-[800px] relative">
          {activeStages.map((stage, idx) => {
            const config = getStatusConfig(stage.status);
            const isLast = idx === activeStages.length - 1;
            
            return (
              <div key={idx} className="flex-1 relative flex flex-col items-center group">
                {!isLast && (
                  <div className={`absolute top-6 left-1/2 w-full h-0 border-t-2 ${config.lineClass} z-0`} style={{ transform: 'translateY(-1px)' }}></div>
                )}
                
                <motion.button
                  whileHover={stage.status === 'completed' || stage.status === 'blocked' ? { scale: 1.1 } : {}}
                  onClick={() => (stage.status === 'completed' || stage.status === 'blocked') && stage.result && setSelectedResult(stage.result)}
                  className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center bg-slate-900 transition-colors ${config.circleClass} ${stage.status === 'completed' || stage.status === 'blocked' ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {config.icon}
                </motion.button>
                
                <div className="mt-4 flex flex-col items-center text-center px-2">
                  <span className={`text-xs font-semibold ${config.textClass}`}>{stage.agent}</span>
                  <span className="text-[10px] text-slate-500 mt-1">{stage.tool}</span>
                  {stage.duration && (
                    <Badge variant="outline" className="mt-2 text-[9px] px-1 py-0 border-slate-700 text-slate-400">
                      {stage.duration}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <AnimatePresence>
        {selectedResult && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800 bg-slate-900/50 overflow-hidden"
          >
            <div className="p-4 relative">
              <button 
                onClick={() => setSelectedResult(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                &times;
              </button>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Execution Result</h4>
              <pre className="p-4 bg-slate-950 rounded-lg text-xs text-indigo-300 overflow-x-auto border border-slate-800 font-mono">
                {JSON.stringify(selectedResult, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
      `}} />
    </GlassCard>
  );
}
