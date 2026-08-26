import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, BarChart3, Target, Rocket, ShieldCheck } from 'lucide-react';

const actions = [
  { icon: Sparkles, text: 'Analyze my resume', color: 'text-yellow-500' },
  { icon: Search, text: 'Find opportunities matching my profile', color: 'text-cyan-500' },
  { icon: BarChart3, text: 'What are my top skills?', color: 'text-green-500' },
  { icon: Target, text: 'Tailor resume for a company', color: 'text-indigo-500' },
  { icon: Rocket, text: 'Show my career trajectory', color: 'text-purple-500' },
  { icon: ShieldCheck, text: 'Run security audit demo', color: 'text-rose-500' }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function QuickActions({ onAction }) {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl mx-auto mt-8 px-4"
    >
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={i}
            variants={item}
            onClick={() => onAction(action.text)}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/50 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800/80 transition-all hover:-translate-y-1 hover:shadow-[0_4px_20px_-4px_rgba(99,102,241,0.2)] text-left group"
          >
            <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-900/50 ${action.color}`}>
              <Icon size={18} />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {action.text}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
