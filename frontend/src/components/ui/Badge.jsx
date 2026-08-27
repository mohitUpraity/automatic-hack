import React from 'react';

const Badge = ({ children, variant = 'default', size = 'sm', dot = false, icon: Icon }) => {
  const baseClasses = 'font-semibold rounded-full inline-flex items-center gap-1';
  
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  }[size] || sizeClasses.sm;

  const variantStyles = {
    default: 'bg-slate-700 text-slate-300',
    primary: 'bg-indigo-900/50 text-indigo-300 border border-indigo-700/50',
    success: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50',
    warning: 'bg-amber-900/50 text-amber-300 border border-amber-700/50',
    error: 'bg-red-900/50 text-red-300 border border-red-700/50',
    info: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
    job: 'bg-cyan-900/50 text-cyan-300',
    internship: 'bg-purple-900/50 text-purple-300',
    hackathon: 'bg-orange-900/50 text-orange-300',
    competition: 'bg-pink-900/50 text-pink-300',
    conclave: 'bg-teal-900/50 text-teal-300'
  };
  
  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-indigo-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-red-400',
    info: 'bg-blue-400',
    job: 'bg-cyan-400',
    internship: 'bg-purple-400',
    hackathon: 'bg-orange-400',
    competition: 'bg-pink-400',
    conclave: 'bg-teal-400'
  };

  const styleClass = variantStyles[variant] || variantStyles.default;
  const dotColorClass = dotColors[variant] || dotColors.default;

  return (
    <span className={`${baseClasses} ${sizeClasses} ${styleClass}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColorClass}`} />}
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

export default Badge;
