import React, { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Captions,
  Smile,
  ScreenShare,
  Code,
  Layout,
  MessageSquare,
  Users,
  Info,
  Hand,
  PhoneOff,
  PenTool,
  Settings,
  MoreVertical,
  Check,
} from "lucide-react";
import { MeetingLayout } from "../types";

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  captionsEnabled: boolean;
  activeLayout: MeetingLayout;
  activeSideTab: "people" | "chat" | "rubric" | "notes" | null;
  isHandRaised: boolean;
  userVolume: number;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleCaptions: () => void;
  onToggleHandRaise: () => void;
  onSelectLayout: (layout: MeetingLayout) => void;
  onToggleSideTab: (tab: "people" | "chat" | "rubric" | "notes") => void;
  onTriggerReaction: (emoji: string) => void;
  onEndCall: () => void;
}

export const MeetingControls: React.FC<MeetingControlsProps> = ({
  isMuted,
  isVideoOff,
  isScreenSharing,
  captionsEnabled,
  activeLayout,
  activeSideTab,
  isHandRaised,
  userVolume,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleCaptions,
  onToggleHandRaise,
  onSelectLayout,
  onToggleSideTab,
  onTriggerReaction,
  onEndCall,
}) => {
  const [timeString, setTimeString] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const emojis = ["💖", "👍", "🎉", "👏", "💡", "🤔", "🚀", "🔥"];

  return (
    <div className="h-20 bg-[#202124] px-4 sm:px-6 flex items-center justify-between z-30 select-none border-t border-[#3c4043]/50">
      {/* Left Meeting Info & Time */}
      <div className="hidden md:flex items-center space-x-3 text-sm text-[#e8eaed] font-medium">
        <span>{timeString}</span>
        <span className="text-gray-500">|</span>
        <span className="font-mono text-xs text-gray-300">meet.ai/interview-live</span>
      </div>

      {/* Center Main Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3 mx-auto md:mx-0">
        {/* Microphone Button */}
        <div className="relative">
          <button
            onClick={onToggleMic}
            className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
              isMuted
                ? "bg-[#ea4335] hover:bg-[#d93025] text-white"
                : "bg-[#3c4043] hover:bg-[#43474b] text-white"
            }`}
            title={isMuted ? "Turn on microphone" : "Turn off microphone"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>

        {/* Camera Button */}
        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
            isVideoOff
              ? "bg-[#ea4335] hover:bg-[#d93025] text-white"
              : "bg-[#3c4043] hover:bg-[#43474b] text-white"
          }`}
          title={isVideoOff ? "Turn on camera" : "Turn off camera"}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Captions Button (CC) */}
        <button
          onClick={onToggleCaptions}
          className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
            captionsEnabled
              ? "bg-[#8ab4f8] text-[#202124]"
              : "bg-[#3c4043] hover:bg-[#43474b] text-white"
          }`}
          title="Turn on captions"
        >
          <Captions className="w-5 h-5" />
        </button>

        {/* Reactions Picker Button */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
              showReactions
                ? "bg-[#8ab4f8] text-[#202124]"
                : "bg-[#3c4043] hover:bg-[#43474b] text-white"
            }`}
            title="Send a reaction"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Reactions Floating Popup */}
          {showReactions && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-[#2d2f34] border border-[#3c4043] rounded-full px-3 py-2 flex items-center space-x-1.5 shadow-2xl z-50">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onTriggerReaction(emoji);
                    setShowReactions(false);
                  }}
                  className="hover:scale-125 text-xl sm:text-2xl p-1 rounded-full hover:bg-[#3c4043] transition-transform active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Screen Share Button */}
        <button
          onClick={onToggleScreenShare}
          className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
            isScreenSharing
              ? "bg-[#8ab4f8] text-[#202124]"
              : "bg-[#3c4043] hover:bg-[#43474b] text-white"
          }`}
          title="Present your screen to AI Interviewer"
        >
          <ScreenShare className="w-5 h-5" />
        </button>

        {/* Live Code IDE Split Button */}
        <button
          onClick={() =>
            onSelectLayout(activeLayout === "code_split" ? "split" : "code_split")
          }
          className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
            activeLayout === "code_split"
              ? "bg-[#8ab4f8] text-[#202124]"
              : "bg-[#3c4043] hover:bg-[#43474b] text-white"
          }`}
          title="Toggle Live Code Editor & Runner"
        >
          <Code className="w-5 h-5" />
        </button>

        {/* Whiteboard / Architecture Design Split Button */}
        <button
          onClick={() =>
            onSelectLayout(
              activeLayout === "whiteboard_split" ? "split" : "whiteboard_split"
            )
          }
          className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
            activeLayout === "whiteboard_split"
              ? "bg-[#8ab4f8] text-[#202124]"
              : "bg-[#3c4043] hover:bg-[#43474b] text-white"
          }`}
          title="Toggle Architecture Whiteboard"
        >
          <PenTool className="w-5 h-5" />
        </button>

        {/* Raise Hand Button */}
        <button
          onClick={onToggleHandRaise}
          className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
            isHandRaised
              ? "bg-[#fbbc04] text-[#202124]"
              : "bg-[#3c4043] hover:bg-[#43474b] text-white"
          }`}
          title="Raise hand to ask question or pause"
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* Red Leave / End Interview Button */}
        <button
          onClick={onEndCall}
          className="px-5 py-3 rounded-full bg-[#ea4335] hover:bg-[#d93025] active:bg-[#c5221f] text-white font-medium flex items-center space-x-2 transition-all duration-200 shadow-xl ml-2"
          title="End Interview & View Detailed Report"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-semibold">End Call</span>
        </button>
      </div>

      {/* Right Side Drawer Toggles */}
      <div className="hidden lg:flex items-center space-x-1">
        <button
          onClick={() => onToggleSideTab("rubric")}
          className={`p-2.5 rounded-full transition-colors ${
            activeSideTab === "rubric"
              ? "bg-[#8ab4f8]/20 text-[#8ab4f8]"
              : "text-gray-300 hover:bg-[#3c4043] hover:text-white"
          }`}
          title="Interview Guide & Live Rubric"
        >
          <Info className="w-5 h-5" />
        </button>

        <button
          onClick={() => onToggleSideTab("people")}
          className={`p-2.5 rounded-full transition-colors ${
            activeSideTab === "people"
              ? "bg-[#8ab4f8]/20 text-[#8ab4f8]"
              : "text-gray-300 hover:bg-[#3c4043] hover:text-white"
          }`}
          title="People & Interviewer Profile"
        >
          <Users className="w-5 h-5" />
        </button>

        <button
          onClick={() => onToggleSideTab("chat")}
          className={`p-2.5 rounded-full transition-colors ${
            activeSideTab === "chat"
              ? "bg-[#8ab4f8]/20 text-[#8ab4f8]"
              : "text-gray-300 hover:bg-[#3c4043] hover:text-white"
          }`}
          title="In-call messages & AI Chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
