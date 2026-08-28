import React from "react";
import { Sparkles, User, Mic } from "lucide-react";

interface CaptionsOverlayProps {
  isVisible: boolean;
  speaker: "ai" | "user" | "none";
  speakerName: string;
  text: string;
}

export const CaptionsOverlay: React.FC<CaptionsOverlayProps> = ({
  isVisible,
  speaker,
  speakerName,
  text,
}) => {
  if (!isVisible || !text || speaker === "none") return null;

  const isAi = speaker === "ai";

  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 max-w-2xl w-[90%] z-20 pointer-events-none transition-all duration-300">
      <div className="bg-[#202124]/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#3c4043] shadow-2xl flex items-start space-x-3 text-left">
        {/* Speaker Icon */}
        <div
          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
            isAi ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"
          }`}
        >
          {isAi ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-semibold ${isAi ? "text-blue-400" : "text-emerald-400"}`}>
              {speakerName}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
              Live Closed Captions
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-100 font-medium leading-snug mt-0.5 break-words">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
};
