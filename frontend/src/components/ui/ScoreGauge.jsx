import React, { useState, useEffect } from 'react';

const SIZE_MAP = {
  xs: 36,
  sm: 48,
  md: 64,
  lg: 88,
  xl: 112,
  '2xl': 136,
};

const ScoreGauge = ({ 
  score = 0, 
  size = 64, 
  strokeWidth, 
  showLabel = true, 
  labelSize,
  label,
  animate = true 
}) => {
  // Normalize size to a number
  let numericSize = 64;
  if (typeof size === 'number' && !isNaN(size)) {
    numericSize = size;
  } else if (typeof size === 'string') {
    if (SIZE_MAP[size.toLowerCase()]) {
      numericSize = SIZE_MAP[size.toLowerCase()];
    } else {
      const parsed = parseFloat(size);
      numericSize = !isNaN(parsed) && parsed > 0 ? parsed : 64;
    }
  }

  // Normalize strokeWidth
  const numericStrokeWidth = strokeWidth !== undefined && !isNaN(parseFloat(strokeWidth))
    ? parseFloat(strokeWidth)
    : Math.max(3, Math.round(numericSize * 0.075));

  // Normalize score
  const safeScore = typeof score === 'number' && !isNaN(score) ? Math.min(100, Math.max(0, Math.round(score))) : 0;

  const [currentScore, setCurrentScore] = useState(animate ? 0 : safeScore);
  
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setCurrentScore(safeScore);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setCurrentScore(safeScore);
    }
  }, [safeScore, animate]);

  let color = '#f87171'; // red-400
  if (safeScore >= 80) color = '#34d399'; // emerald-400
  else if (safeScore >= 60) color = '#fbbf24'; // amber-400
  else if (safeScore >= 40) color = '#fb923c'; // orange-400

  const radius = Math.max(1, (numericSize - numericStrokeWidth) / 2);
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  // Derive label typography class if not explicitly passed
  let resolvedLabelClass = labelSize;
  if (!resolvedLabelClass) {
    if (numericSize <= 36) resolvedLabelClass = 'text-[10px]';
    else if (numericSize <= 48) resolvedLabelClass = 'text-xs';
    else if (numericSize <= 64) resolvedLabelClass = 'text-sm';
    else if (numericSize <= 88) resolvedLabelClass = 'text-base font-black';
    else resolvedLabelClass = 'text-xl font-black';
  }

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: numericSize, height: numericSize }}>
      <svg className="transform -rotate-90 block" width={numericSize} height={numericSize}>
        <circle
          className="text-slate-700/30"
          strokeWidth={numericStrokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={numericSize / 2}
          cy={numericSize / 2}
        />
        <circle
          stroke={color}
          strokeWidth={numericStrokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          fill="transparent"
          r={radius}
          cx={numericSize / 2}
          cy={numericSize / 2}
        />
      </svg>
      {showLabel && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center font-bold text-slate-100 ${resolvedLabelClass}`}>
          <span>{safeScore}%</span>
          {label && <span className="text-[9px] font-normal text-slate-400 mt-0.5">{label}</span>}
        </div>
      )}
    </div>
  );
};

export default ScoreGauge;
