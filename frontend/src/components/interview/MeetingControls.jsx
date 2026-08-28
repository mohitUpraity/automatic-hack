import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Subtitles,
  Hand,
  Smile,
  PhoneOff,
  Users,
  MessageSquare,
  Activity,
  FileText,
  Code2,
  Layers,
  LayoutGrid,
  ChevronUp,
  Eye,
} from "lucide-react";

export default function MeetingControls({
  isMuted = false,
  isVideoOff = false,
  isScreenSharing = false,
  captionsEnabled = true,
  activeLayout = "split",
  activeSideTab = null,
  isHandRaised = false,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleCaptions,
  onToggleHandRaise,
  onSelectLayout,
  onToggleSideTab,
  onTriggerReaction,
  onEndCall,
}) {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);

  const emojis = ["👏", "💡", "🔥", "❤️", "👍", "🚀", "💻", "🎨"];

  return (
    <footer className="h-16 px-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between z-30 select-none relative">
      {/* Left Info */}
      <div className="hidden md:flex items-center space-x-3 text-xs text-slate-400">
        <span className="font-mono text-slate-300 font-medium">meet.careeros/live-interview</span>
        <span className="text-slate-600">•</span>
        <span className="text-slate-400">Gemini 3.1 Flash Live (Full Duplex)</span>
      </div>

      {/* Center Media & Workspace Pill */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 mx-auto md:mx-0">
        {/* Mic Toggle */}
        <button
          onClick={onToggleMic}
          className={`p-3 rounded-full transition-all duration-200 ${
            isMuted
              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
          }`}
          title={isMuted ? "Turn on microphone" : "Turn off microphone"}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full transition-all duration-200 ${
            isVideoOff
              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
          }`}
          title={isVideoOff ? "Turn on camera" : "Turn off camera"}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          className={`p-3 rounded-full transition-all duration-200 ${
            isScreenSharing
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
          }`}
          title={isScreenSharing ? "Stop presenting" : "Present screen"}
        >
          <ScreenShare className="w-5 h-5" />
        </button>

        {/* Captions Toggle */}
        <button
          onClick={onToggleCaptions}
          className={`p-3 rounded-full transition-all duration-200 ${
            captionsEnabled
              ? "bg-cyan-600/30 border border-cyan-500/50 text-cyan-300"
              : "bg-slate-800 hover:bg-slate-700 text-slate-400"
          }`}
          title={captionsEnabled ? "Turn off captions" : "Turn on captions"}
        >
          <Subtitles className="w-5 h-5" />
        </button>

        {/* Hand Raise */}
        <button
          onClick={onToggleHandRaise}
          className={`p-3 rounded-full transition-all duration-200 ${
            isHandRaised
              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
          }`}
          title={isHandRaised ? "Lower hand" : "Raise hand"}
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* Reactions Picker */}
        <div className="relative">
          <button
            onClick={() => setShowReactionsMenu(!showReactionsMenu)}
            className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
            title="Send reaction"
          >
            <Smile className="w-5 h-5" />
          </button>

          {showReactionsMenu && (
            <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-700 p-2 rounded-2xl shadow-2xl flex items-center space-x-1.5 z-50 animate-fadeIn">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onTriggerReaction(emoji);
                    setShowReactionsMenu(false);
                  }}
                  className="p-1.5 hover:bg-slate-800 rounded-xl text-xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layout Switcher (Split, Code IDE, Whiteboard) */}
        <div className="relative">
          <button
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className={`p-3 rounded-full transition-all ${
              activeLayout !== "split"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
            title="Switch layout mode"
          >
            {activeLayout === "code_split" && <Code2 className="w-5 h-5" />}
            {activeLayout === "whiteboard_split" && <Layers className="w-5 h-5" />}
            {activeLayout === "split" && <LayoutGrid className="w-5 h-5" />}
          </button>

          {showLayoutMenu && (
            <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-700 p-2 rounded-2xl shadow-2xl flex flex-col space-y-1 w-48 z-50 animate-fadeIn">
              <button
                onClick={() => {
                  onSelectLayout("split");
                  setShowLayoutMenu(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                  activeLayout === "split"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Video Grid (Split)</span>
              </button>

              <button
                onClick={() => {
                  onSelectLayout("code_split");
                  setShowLayoutMenu(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                  activeLayout === "code_split"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>Live Code Editor IDE</span>
              </button>

              <button
                onClick={() => {
                  onSelectLayout("whiteboard_split");
                  setShowLayoutMenu(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                  activeLayout === "whiteboard_split"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Architecture Whiteboard</span>
              </button>
            </div>
          )}
        </div>

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/30"
          title="End Interview & View Performance Scorecard"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">End Call</span>
        </button>
      </div>

      {/* Right Drawer Action Buttons */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        <button
          onClick={() => onToggleSideTab("people")}
          className={`p-2.5 rounded-full transition-all ${
            activeSideTab === "people"
              ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Participants"
        >
          <Users className="w-4 h-4" />
        </button>

        <button
          onClick={() => onToggleSideTab("chat")}
          className={`p-2.5 rounded-full transition-all ${
            activeSideTab === "chat"
              ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="In-call chat"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          onClick={() => onToggleSideTab("rubric")}
          className={`p-2.5 rounded-full transition-all ${
            activeSideTab === "rubric"
              ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Interview Agenda & Live Speech Analytics"
        >
          <Activity className="w-4 h-4" />
        </button>

        <button
          onClick={() => onToggleSideTab("notes")}
          className={`p-2.5 rounded-full transition-all ${
            activeSideTab === "notes"
              ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Personal Notes"
        >
          <FileText className="w-4 h-4" />
        </button>

        <button
          onClick={() => onToggleSideTab("telemetry")}
          className={`p-2.5 rounded-full transition-all relative ${
            activeSideTab === "telemetry"
              ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title="HR Live Telemetry & Observations"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
}
