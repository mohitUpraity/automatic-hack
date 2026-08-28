import React, { useEffect, useRef } from "react";
import { Mic, Sparkles, Volume2, Bot, ShieldCheck, Zap } from "lucide-react";
import { InterviewerProfile } from "../types";

interface InterviewerTileProps {
  profile: InterviewerProfile;
  isAiSpeaking: boolean;
  aiVolume: number;
  isConnecting: boolean;
  statusText?: string;
  isInterrupted?: boolean;
}

export const InterviewerTile: React.FC<InterviewerTileProps> = ({
  profile,
  isAiSpeaking,
  aiVolume,
  isConnecting,
  statusText = "Ready",
  isInterrupted = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animate dynamic waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw 5 animated wave lines
      const waveCount = 4;
      const activeMultiplier = isAiSpeaking ? Math.max(0.35, aiVolume * 3.5) : 0.08;

      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        ctx.lineWidth = 2.5 - w * 0.4;
        ctx.strokeStyle =
          w === 0
            ? "rgba(66, 133, 244, 0.9)" // Google Blue
            : w === 1
            ? "rgba(52, 168, 83, 0.8)" // Google Green
            : w === 2
            ? "rgba(251, 188, 4, 0.8)" // Google Yellow
            : "rgba(234, 67, 53, 0.7)"; // Google Red

        for (let x = 0; x < width; x++) {
          const progress = x / width;
          // Gaussian envelope so wave fades at edges
          const envelope = Math.sin(progress * Math.PI);
          const freq = 0.03 + w * 0.01;
          const y =
            centerY +
            Math.sin(x * freq + phase + w) *
              (height * 0.38) *
              envelope *
              activeMultiplier;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      phase += isAiSpeaking ? 0.12 : 0.02;
      animId = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => cancelAnimationFrame(animId);
  }, [isAiSpeaking, aiVolume]);

  return (
    <div className="relative w-full h-full bg-[#1e1e24] rounded-2xl overflow-hidden border border-[#3c4043] flex flex-col items-center justify-center shadow-xl group transition-all duration-300">
      {/* Background Subtle Gradient & Glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-500"
        style={{
          background: isAiSpeaking
            ? `radial-gradient(circle at center, ${profile.accentColor} 0%, transparent 70%)`
            : "radial-gradient(circle at center, rgba(26,115,232,0.15) 0%, transparent 60%)",
        }}
      />

      {/* Top Status Badges */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-[#202124]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#3c4043] text-xs font-medium text-[#e8eaed]">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>AI Interviewer</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1 bg-[#202124]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#3c4043] text-[11px] text-gray-300">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Full Duplex Live</span>
          </div>
        </div>

        {/* State indicator */}
        <div className="flex items-center space-x-2">
          {isInterrupted ? (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Interrupted
            </span>
          ) : isAiSpeaking ? (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Speaking...
            </span>
          ) : isConnecting ? (
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              Connecting...
            </span>
          ) : (
            <span className="bg-[#3c4043]/70 text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              Listening
            </span>
          )}
        </div>
      </div>

      {/* Center Avatar & Visualizer */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        {/* Pulsing Ripple Rings when AI Speaks */}
        {isAiSpeaking && (
          <>
            <div
              className="absolute w-44 h-44 rounded-full border border-blue-500/30 animate-ping opacity-40 pointer-events-none"
              style={{ animationDuration: "2s" }}
            />
            <div
              className="absolute w-56 h-56 rounded-full border border-indigo-500/20 animate-ping opacity-25 pointer-events-none"
              style={{ animationDuration: "2.8s" }}
            />
          </>
        )}

        {/* Profile Avatar Frame */}
        <div
          className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1.5 transition-all duration-300 ${
            isAiSpeaking
              ? "ring-4 ring-blue-500/80 shadow-[0_0_30px_rgba(66,133,244,0.4)] scale-105"
              : "ring-2 ring-[#3c4043]"
          }`}
          style={{
            background: isAiSpeaking
              ? "linear-gradient(135deg, #1a73e8, #0d904f, #f9ab00, #ea4335)"
              : "#2d2f34",
          }}
        >
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-full h-full object-cover rounded-full bg-[#202124]"
          />

          {/* Speaking Audio Badge */}
          <div
            className={`absolute bottom-0 right-0 p-2 rounded-full border border-[#202124] shadow-lg transition-colors ${
              isAiSpeaking ? "bg-blue-600 text-white" : "bg-[#3c4043] text-gray-300"
            }`}
          >
            {isAiSpeaking ? (
              <Volume2 className="w-4 h-4 animate-bounce" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="text-center mt-4 z-10 px-4 max-w-sm">
          <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight flex items-center justify-center gap-1.5">
            {profile.name}
            <span title="Verified Google Interviewer">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 font-medium">
            {profile.role} • {profile.company}
          </p>
        </div>

        {/* Live Soundwave Canvas */}
        <div className="w-48 sm:w-64 h-12 mt-2">
          <canvas
            ref={canvasRef}
            width={260}
            height={48}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Bottom Google Meet style Name Tag */}
      <div className="absolute bottom-4 left-4 z-10 bg-[#202124]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#3c4043] flex items-center space-x-2 text-xs text-white">
        <span className="font-medium">{profile.name}</span>
        <span className="text-gray-400">|</span>
        <span className="text-blue-400 font-mono text-[11px]">Gemini 3.1 Live ({profile.voice})</span>
      </div>
    </div>
  );
};
