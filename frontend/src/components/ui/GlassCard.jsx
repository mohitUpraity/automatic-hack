import React from 'react';

const GlassCard = ({ 
  children, 
  className = '', 
  hover = true, 
  glow = false, 
  glowColor = 'primary', 
  onClick, 
  padding = 'p-5' 
}) => {
  const baseClasses = 'bg-slate-900/40 backdrop-blur-xl border border-white/[0.06] rounded-2xl shadow-lg relative overflow-hidden transition-all duration-300';
  
  const hoverClasses = hover ? 'hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]' : '';
  const cursorClass = onClick ? 'cursor-pointer' : '';
  
  let glowClasses = '';
  if (glow) {
    if (glowColor === 'primary') glowClasses = 'animate-pulse-glow';
    else if (glowColor === 'success') glowClasses = 'animate-pulse-glow-success';
    else if (glowColor === 'error') glowClasses = 'animate-pulse-glow-error';
  }

  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${glowClasses} ${cursorClass} ${padding} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;
