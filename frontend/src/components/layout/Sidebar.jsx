import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, MessageSquare, FileText, Activity, GitBranch, Menu, X, Wand2, User, Compass, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ stats }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Home/Chat', path: '/', icon: MessageSquare },
    { name: 'AI Resume Studio', path: '/studio', icon: Wand2 },
    { name: 'Opportunities Feed', path: '/opportunities', icon: Compass },
    { name: 'Candidate Documents', path: '/documents', icon: FileText },
    { name: 'Profile & Preferences', path: '/profile', icon: User },
    { name: 'Observatory', path: '/observatory', icon: Activity },
    { name: 'Knowledge Graph', path: '/knowledge-graph', icon: GitBranch },
  ];

  const getNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-indigo-500/10 text-indigo-400 border-l-4 border-indigo-500 font-medium'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-l-4 border-transparent'
    }`;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

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
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/40">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            CareerOS v3
          </h1>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={getNavLinkClass}>
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/50 space-y-3 bg-slate-950">
          {user ? (
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-600 flex items-center justify-center text-xs font-black text-white shrink-0 shadow">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-100 truncate">{user.name}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{user.role || user.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}

          <div className="flex justify-between items-center text-[10px] text-slate-500 px-1 font-mono">
            <span>Docs: {stats?.total_documents || 0}</span>
            <span>Profiles: {stats?.total_profiles || 0}</span>
          </div>
        </div>
      </div>
    </>
  );
}
