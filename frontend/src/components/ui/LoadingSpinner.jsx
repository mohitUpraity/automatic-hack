import React from 'react';

const LoadingSpinner = ({ size = 'md', text, variant = 'spinner' }) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 40
  };
  const pixelSize = sizeMap[size] || sizeMap.md;

  if (variant === 'skeleton') {
    return (
      <div 
        className="bg-slate-800/50 animate-pulse rounded-lg w-full h-full min-h-[20px]" 
      />
    );
  }

  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        {text && <p className="text-sm text-slate-400 font-medium">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div 
        className="border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin"
        style={{ width: pixelSize, height: pixelSize }}
      />
      {text && <p className="text-sm text-slate-400 font-medium">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
