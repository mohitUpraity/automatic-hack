import React, { useRef, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff, User } from "lucide-react";

export default function CandidateTile({
  stream,
  candidateName = "Candidate",
  isMuted = false,
  isVideoOff = false,
  userVolume = 0,
  onToggleMic,
  onToggleVideo,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoOff]);

  const initials = candidateName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "ME";

  return (
    <div className="relative w-full h-full bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-xl group">
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
          isVideoOff || !stream ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Video Off Fallback Avatar */}
      {(isVideoOff || !stream) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-2xl ring-4 ring-cyan-500/20">
            {initials}
          </div>
          <p className="text-sm font-semibold text-slate-300 mt-3">{candidateName}</p>
          <span className="text-xs text-slate-500">Camera turned off</span>
        </div>
      )}

      {/* Top Left Tag */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-xs font-semibold text-slate-200">
          <span>{candidateName} (You)</span>
        </div>
      </div>

      {/* Bottom Floating Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
        {/* Real-time Mic Volume Bars */}
        <div className="flex items-center space-x-1 bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-700/80">
          <div className="flex items-end space-x-0.5 h-3.5">
            {[0.1, 0.25, 0.4, 0.6, 0.8].map((threshold, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  !isMuted && userVolume > threshold
                    ? "bg-emerald-400 h-3.5"
                    : "bg-slate-700 h-1.5"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Tile Mic/Cam Quick Action Buttons */}
        <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onToggleMic}
            className={`p-2 rounded-full backdrop-blur-md border transition-all ${
              isMuted
                ? "bg-rose-500/80 border-rose-400 text-white"
                : "bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggleVideo}
            className={`p-2 rounded-full backdrop-blur-md border transition-all ${
              isVideoOff
                ? "bg-rose-500/80 border-rose-400 text-white"
                : "bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white"
            }`}
            title={isVideoOff ? "Turn on camera" : "Turn off camera"}
          >
            {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
