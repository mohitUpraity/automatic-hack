import React, { useEffect, useRef } from "react";
import { Mic, Sparkles, Volume2, ShieldCheck, Zap, Radio } from "lucide-react";

export default function InterviewerTile({
  profile,
  isAiSpeaking,
  aiVolume = 0,
  isConnecting,
  isInterrupted = false,
}) {
  const canvasRef = useRef(null);

  // Dynamic Gaussian audio waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;
    let phase = 0;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const waveCount = 4;
      const activeMultiplier = isAiSpeaking ? Math.max(0.35, aiVolume * 3.5) : 0.08;

      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        ctx.lineWidth = 2.5 - w * 0.4;
        ctx.strokeStyle =
          w === 0
            ? "rgba(59, 130, 246, 0.9)" // Blue
            : w === 1
            ? "rgba(16, 185, 129, 0.8)" // Emerald
            : w === 2
            ? "rgba(245, 158, 11, 0.8)" // Amber
            : "rgba(239, 68, 68, 0.7)"; // Red

        for (let x = 0; x < width; x++) {
          const progress = x / width;
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

  const fallbackAvatar = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80";

  return (
    <div className="relative w-full h-full bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center shadow-xl group transition-all duration-300">
      {/* Background Radial Glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-500"
        style={{
          background: isAiSpeaking
            ? `radial-gradient(circle at center, ${profile?.accentColor || "#3b82f6"} 0%, transparent 70%)`
            : "radial-gradient(circle at center, rgba(59,130,246,0.15) 0%, transparent 60%)",
        }}
      />

      {/* Top Header Tags */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-xs font-medium text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Interviewer</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-xs text-emerald-400 font-medium">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Full Duplex Live</span>
          </div>
        </div>

        {/* Live Speaking Status Indicator */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border transition-all duration-300 ${
            isInterrupted
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-bounce"
              : isAiSpeaking
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              : "bg-slate-950/70 text-slate-400 border-slate-800"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isInterrupted
                ? "bg-amber-400 animate-ping"
                : isAiSpeaking
                ? "bg-emerald-400 animate-pulse"
                : "bg-slate-500"
            }`}
          />
          <span>
            {isConnecting
              ? "Connecting..."
              : isInterrupted
              ? "Paused (Interrupted)"
              : isAiSpeaking
              ? "Speaking"
              : "Listening"}
          </span>
        </div>
      </div>

      {/* Center Avatar & Pulsing Speech Rings */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          {/* Outer Ripple Rings */}
          {isAiSpeaking && (
            <>
              <div
                className="absolute w-44 h-44 rounded-full border border-cyan-500/30 animate-ping pointer-events-none"
                style={{ animationDuration: "2s" }}
              />
              <div
                className="absolute w-56 h-56 rounded-full border border-blue-500/20 animate-pulse pointer-events-none"
              />
            </>
          )}

          {/* Avatar Container */}
          <div
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 shadow-2xl transition-all duration-300 ${
              isAiSpeaking
                ? "border-cyan-400 ring-4 ring-cyan-500/30 scale-105"
                : "border-slate-700"
            }`}
          >
            <img
              src={profile?.avatarUrl || fallbackAvatar}
              alt={profile?.name || "Interviewer"}
              className="w-full h-full object-cover"
            />
            {isConnecting && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Identity Information */}
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center space-x-1.5">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {profile?.name || "Dr. Elena Vance"}
            </h3>
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {profile?.role || "Lead Bar-Raiser"} • {profile?.company || "Google Cloud"}
          </p>
        </div>
      </div>

      {/* Bottom Waveform Visualizer Canvas */}
      <div className="absolute bottom-4 left-6 right-6 h-12 flex items-center justify-center pointer-events-none">
        <canvas
          ref={canvasRef}
          width={400}
          height={48}
          className="w-full max-w-sm h-full opacity-90"
        />
      </div>
    </div>
  );
}
