import { NavLink } from 'react-router-dom';
import { Shield, MessageSquare, FileText, Activity, GitBranch, Menu, X, Wand2 } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ stats }) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Home/Chat', path: '/', icon: MessageSquare },
    { name: 'AI Resume Studio', path: '/studio', icon: Wand2 },
    { name: 'Documents & Opps', path: '/documents', icon: FileText },
    { name: 'Observatory', path: '/observatory', icon: Activity },
    { name: 'Knowledge Graph', path: '/knowledge-graph', icon: GitBranch },
  ];

  const getNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-indigo-500/10 text-indigo-400 border-l-4 border-indigo-500 font-medium'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-l-4 border-transparent'
    }`;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-white"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={`fixed inset-y-0 left-0 z-40 w-[260px] bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/50 flex flex-col transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-8">
          <Shield className="w-8 h-8 text-indigo-500" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            CareerOS v3
          </h1>
        </div>

        <nav className="flex-1 px-4">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={getNavLinkClass}>
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800/50">
          <div className="bg-slate-900/50 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              System Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Documents</span>
                <span className="text-slate-200">{stats?.total_documents || 0}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Profiles</span>
                <span className="text-slate-200">{stats?.total_profiles || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
