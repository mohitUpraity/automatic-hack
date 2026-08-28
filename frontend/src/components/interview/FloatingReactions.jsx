import React from "react";

export default function FloatingReactions({ reactions = [] }) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {reactions.map((item) => (
        <div
          key={item.id}
          className="absolute bottom-20 flex items-center gap-2.5 animate-float-up select-none transform -translate-x-1/2"
          style={{
            left: `${item.leftPercent || 50}%`,
          }}
        >
          <span className="text-3xl sm:text-4xl filter drop-shadow-md">{item.emoji}</span>
          {item.label && (
            <div className="px-3 py-1.5 rounded-full bg-slate-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>{item.label}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
