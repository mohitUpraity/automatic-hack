import React from "react";

export default function FloatingReactions({ reactions = [] }) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {reactions.map((item) => (
        <div
          key={item.id}
          className="absolute bottom-16 text-3xl sm:text-4xl animate-float-up select-none"
          style={{
            left: `${item.leftPercent || 50}%`,
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}
