import React, { useRef, useState } from "react";
import { useGeminiLive } from "../hooks/useGeminiLive";
import { Mic, MicOff, PhoneOff, Phone, Radio, Sparkles } from "lucide-react";

export const LiveVoiceRoom: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [_stream, setStream] = useState<MediaStream | null>(null);

  const {
    isConnected,
    isAiSpeaking,
    isMuted,
    userVolume,
    aiVolume,
    currentCaption,
    startSession,
    stopSession,
    toggleMute,
  } = useGeminiLive({
    voice: "Zephyr",
    systemInstruction: "You are an intelligent, friendly conversational partner in a live video call. Answer questions directly, keep responses concise, and converse naturally in real-time.",
    videoElement: videoRef.current,
  });

  const handleStart = async () => {
    const userMedia = await startSession();
    setStream(userMedia);
    if (videoRef.current && userMedia) {
      videoRef.current.srcObject = userMedia;
    }
  };

  const handleEnd = () => {
    stopSession();
    setStream(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <Radio className={`w-5 h-5 ${isConnected ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
          <span className="text-sm font-medium tracking-wide">
            {isConnected ? (isAiSpeaking ? "Gemini is speaking..." : "Listening to you...") : "Disconnected"}
          </span>
        </div>

        {/* AI Pulsing Orb */}
        <div className="relative w-40 h-40 flex items-center justify-center my-6">
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 blur-xl transition-all duration-150"
            style={{
              transform: `scale(${1 + (isAiSpeaking ? aiVolume * 2 : userVolume * 1.2)})`,
              opacity: isConnected ? 0.8 : 0.2,
            }}
          />
          <div className="relative z-10 w-28 h-28 rounded-full bg-slate-950 border border-cyan-500/30 flex items-center justify-center shadow-inner">
            <Sparkles className={`w-10 h-10 ${isAiSpeaking ? "text-cyan-400 animate-spin" : "text-slate-400"}`} />
          </div>
        </div>

        {/* Live Captions */}
        <div className="w-full min-h-[60px] bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 text-center text-sm text-slate-300 mb-6 flex items-center justify-center">
          {currentCaption ? (
            <p className="italic">"{currentCaption}"</p>
          ) : (
            <span className="text-slate-600">Live subtitles and transcript will appear here...</span>
          )}
        </div>

        {/* Hidden / Visible Video Element for Camera Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-48 h-32 rounded-xl object-cover mb-6 border border-slate-800 ${isConnected ? "block" : "hidden"}`}
        />

        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          {!isConnected ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Phone className="w-5 h-5" /> Start Live Call
            </button>
          ) : (
            <>
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition cursor-pointer ${isMuted ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-slate-800 hover:bg-slate-700 text-slate-200"}`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <button
                onClick={handleEnd}
                className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
