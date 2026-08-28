import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Sparkles, User } from "lucide-react";

interface UserTileProps {
  stream: MediaStream | null;
  candidateName: string;
  isMuted: boolean;
  isVideoOff: boolean;
  userVolume: number;
  onToggleMic: () => void;
  onToggleVideo: () => void;
}

export const UserTile: React.FC<UserTileProps> = ({
  stream,
  candidateName,
  isMuted,
  isVideoOff,
  userVolume,
  onToggleMic,
  onToggleVideo,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [blurBackground, setBlurBackground] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoOff]);

  // Audio level bars calculation (4 bars)
  const isSpeaking = userVolume > 0.05 && !isMuted;

  return (
    <div
      className={`relative w-full h-full bg-[#202124] rounded-2xl overflow-hidden border border-[#3c4043] flex items-center justify-center shadow-xl group transition-all duration-300 ${
        isSpeaking ? "ring-2 ring-emerald-500/80" : ""
      }`}
    >
      {/* Video Element */}
      {!isVideoOff && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 transition-all duration-300 ${
            blurBackground ? "filter backdrop-blur-md scale-105" : ""
          }`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-semibold shadow-inner">
            {candidateName
              ? candidateName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : <User className="w-10 h-10 text-white/90" />}
          </div>
          <p className="text-sm font-medium text-gray-300 mt-3">{candidateName || "You"}</p>
        </div>
      )}

      {/* Top Left Status & Background Effect Toggle */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <button
          onClick={() => setBlurBackground(!blurBackground)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all flex items-center space-x-1 ${
            blurBackground
              ? "bg-blue-600/90 text-white border-blue-400"
              : "bg-[#202124]/80 text-gray-300 border-[#3c4043] hover:bg-[#303134]"
          }`}
          title="Toggle Portrait Blur Effect"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span className="hidden sm:inline">Portrait Blur</span>
        </button>
      </div>

      {/* Top Right Quick Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={onToggleMic}
          className={`p-2 rounded-full backdrop-blur-md border transition-colors ${
            isMuted
              ? "bg-red-500/90 text-white border-red-400"
              : "bg-[#202124]/80 text-gray-200 border-[#3c4043] hover:bg-[#303134]"
          }`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleVideo}
          className={`p-2 rounded-full backdrop-blur-md border transition-colors ${
            isVideoOff
              ? "bg-red-500/90 text-white border-red-400"
              : "bg-[#202124]/80 text-gray-200 border-[#3c4043] hover:bg-[#303134]"
          }`}
          title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Name & Audio Indicator Tag */}
      <div className="absolute bottom-4 left-4 z-10 bg-[#202124]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#3c4043] flex items-center space-x-2 text-xs text-white">
        <span className="font-medium">{candidateName || "You"} (Candidate)</span>

        {/* Audio Visualizer Waves (3 bars) */}
        {isMuted ? (
          <MicOff className="w-3.5 h-3.5 text-red-400 ml-1" />
        ) : (
          <div className="flex items-center space-x-0.5 ml-1 h-3.5">
            <span
              className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
              style={{ height: `${Math.max(3, userVolume * 24)}px` }}
            />
            <span
              className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
              style={{ height: `${Math.max(5, userVolume * 36)}px` }}
            />
            <span
              className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
              style={{ height: `${Math.max(3, userVolume * 20)}px` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
