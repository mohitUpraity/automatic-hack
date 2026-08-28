import React from "react";
import { Sparkles, Mic } from "lucide-react";

export default function CaptionsOverlay({
  isVisible = true,
  speaker = "none",
  speakerName = "",
  text = "",
}) {
  if (!isVisible || !text || speaker === "none") return null;

  const isAi = speaker === "ai";

  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 max-w-2xl w-[90%] z-20 pointer-events-none transition-all duration-300">
      <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/80 shadow-2xl flex items-start space-x-3 text-left">
        {/* Speaker Icon */}
        <div
          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
            isAi ? "bg-cyan-500/20 text-cyan-400" : "bg-emerald-500/20 text-emerald-400"
          }`}
        >
          {isAi ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-semibold ${isAi ? "text-cyan-400" : "text-emerald-400"}`}>
              {speakerName}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              Live Closed Captions
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-100 font-medium leading-snug mt-0.5 break-words">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
