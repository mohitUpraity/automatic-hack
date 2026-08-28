import React, { useEffect, useState } from "react";

export interface FloatingReactionItem {
  id: string;
  emoji: string;
  leftPercent: number;
}

interface FloatingReactionsProps {
  reactions: FloatingReactionItem[];
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ reactions }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-20 text-3xl sm:text-4xl animate-float-up select-none"
          style={{
            left: `${r.leftPercent}%`,
          }}
        >
          {r.emoji}
        </div>
      ))}
    </div>
  );
};
