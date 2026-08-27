import React, { useState, useEffect } from 'react';

const ScoreGauge = ({ 
  score = 0, 
  size = 64, 
  strokeWidth = 4, 
  showLabel = true, 
  labelSize = 'text-sm',
  animate = true 
}) => {
  const [currentScore, setCurrentScore] = useState(animate ? 0 : score);
  
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setCurrentScore(score);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setCurrentScore(score);
    }
  }, [score, animate]);

  let color = '#f87171'; // red-400
  if (score >= 80) color = '#34d399'; // emerald-400
  else if (score >= 60) color = '#fbbf24'; // amber-400
  else if (score >= 40) color = '#fb923c'; // orange-400

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-slate-500/20"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showLabel && (
        <div className={`absolute inset-0 flex items-center justify-center font-bold text-slate-100 ${labelSize}`}>
          {score}%
        </div>
      )}
    </div>
  );
};

export default ScoreGauge;
