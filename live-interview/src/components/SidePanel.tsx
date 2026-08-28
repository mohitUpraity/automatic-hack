import React, { useState } from "react";
import {
  X,
  Users,
  MessageSquare,
  FileText,
  Send,
  Sparkles,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Activity,
  Mic,
  Volume2,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { InterviewerProfile, ChatMessage, RubricStage, LiveAnalytics } from "../types";

interface SidePanelProps {
  activeTab: "people" | "chat" | "rubric" | "notes";
  interviewerProfile: InterviewerProfile;
  candidateName: string;
  chatMessages: ChatMessage[];
  rubricStages: RubricStage[];
  analytics: LiveAnalytics;
  isAiSpeaking: boolean;
  userVolume: number;
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  activeTab,
  interviewerProfile,
  candidateName,
  chatMessages,
  rubricStages,
  analytics,
  isAiSpeaking,
  userVolume,
  onSendMessage,
  onClose,
}) => {
  const [inputText, setInputText] = useState("");
  const [candidateNotes, setCandidateNotes] = useState(
    "Key thoughts & assumptions:\n- Scale: 10M DAU, 1k QPS\n- Storage: 100GB/day\n- Focus on O(1) reads with Redis caching"
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const totalSpeaking =
    analytics.userSpeakingSeconds + analytics.aiSpeakingSeconds || 1;
  const userRatio = Math.round(
    (analytics.userSpeakingSeconds / totalSpeaking) * 100
  );
  const aiRatio = 100 - userRatio;

  return (
    <div className="w-80 sm:w-96 h-full bg-[#202124] border-l border-[#3c4043] flex flex-col z-20 select-none shadow-2xl transition-all duration-300">
      {/* Top Header */}
      <div className="px-4 py-3.5 border-b border-[#3c4043] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {activeTab === "people" && <Users className="w-5 h-5 text-blue-400" />}
          {activeTab === "chat" && <MessageSquare className="w-5 h-5 text-blue-400" />}
          {activeTab === "rubric" && <Activity className="w-5 h-5 text-blue-400" />}
          {activeTab === "notes" && <FileText className="w-5 h-5 text-blue-400" />}
          <h2 className="text-sm font-semibold text-white capitalize">
            {activeTab === "rubric" ? "Interview Guide & Analytics" : `${activeTab} Panel`}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-[#303134] transition-colors"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 1. PEOPLE TAB */}
        {activeTab === "people" && (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              In Call (2)
            </div>

            {/* AI Interviewer Participant */}
            <div className="p-3 bg-[#2d2f34] rounded-xl border border-[#3c4043] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-500">
                  <img
                    src={interviewerProfile.avatarUrl}
                    alt={interviewerProfile.name}
                    className="w-full h-full object-cover"
                  />
                  {isAiSpeaking && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#202124]" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1">
                    {interviewerProfile.name}
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Host • {interviewerProfile.company}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  AI ({interviewerProfile.voice})
                </span>
              </div>
            </div>

            {/* Candidate Participant */}
            <div className="p-3 bg-[#2d2f34] rounded-xl border border-[#3c4043] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  {candidateName
                    ? candidateName.slice(0, 2).toUpperCase()
                    : <User className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    {candidateName || "You"} (You)
                  </div>
                  <div className="text-[11px] text-gray-400">Candidate</div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-gray-300">Live</span>
              </div>
            </div>

            {/* Interviewer Persona Info Card */}
            <div className="p-3 bg-[#1e1e24] rounded-xl border border-[#3c4043] text-xs text-gray-300 space-y-1.5">
              <div className="font-semibold text-white flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Interviewer Focus
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {interviewerProfile.personality}
              </p>
            </div>
          </div>
        )}

        {/* 2. CHAT TAB */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              <div className="p-2.5 bg-[#2d2f34]/80 rounded-lg text-xs text-gray-400 text-center">
                Messages sent here are synced in real time with the AI Interviewer.
              </div>

              {chatMessages.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-500">
                  No messages yet. Say hello or share a link/code snippet!
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 text-[11px] text-gray-400">
                      <span className="font-medium text-gray-300">{msg.senderName}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div
                      className={`p-2.5 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-[#2d2f34] text-gray-100 border border-[#3c4043] rounded-bl-none font-sans"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input Field */}
            <form onSubmit={handleSend} className="mt-3 flex items-center space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Send a message to interviewer..."
                className="flex-1 bg-[#2d2f34] text-xs text-white rounded-xl px-3 py-2.5 border border-[#3c4043] focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* 3. RUBRIC & LIVE ANALYTICS TAB */}
        {activeTab === "rubric" && (
          <div className="space-y-4">
            {/* Live Speaking Balance Metric */}
            <div className="p-3.5 bg-[#2d2f34] rounded-xl border border-[#3c4043] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Speaking Balance</span>
                <span className="text-gray-400 font-mono text-[11px]">
                  You {userRatio}% | AI {aiRatio}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-[#1e1e24] rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all duration-300"
                  style={{ width: `${userRatio}%` }}
                />
                <div
                  className="bg-blue-500 transition-all duration-300"
                  style={{ width: `${aiRatio}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>🟢 You: {Math.round(analytics.userSpeakingSeconds)}s</span>
                <span>🔵 AI: {Math.round(analytics.aiSpeakingSeconds)}s</span>
              </div>
            </div>

            {/* Interruptibility / Full Duplex Indicator */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-blue-400" />
                Live Duplex & Interruptions
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                You can speak naturally and interrupt at any moment! The AI will stop instantly and listen to your clarification.
              </p>
            </div>

            {/* Stages Rubric Checklist */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Interview Roadmap
              </div>
              {rubricStages.map((stage, idx) => (
                <div
                  key={stage.id}
                  className="p-2.5 bg-[#2d2f34] rounded-xl border border-[#3c4043] space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{stage.title}</span>
                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {stage.targetMinutes}m
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    {stage.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. NOTES TAB */}
        {activeTab === "notes" && (
          <div className="h-full flex flex-col space-y-2">
            <div className="text-xs text-gray-400">
              Private scratchpad for formulas, estimations, and requirements:
            </div>
            <textarea
              value={candidateNotes}
              onChange={(e) => setCandidateNotes(e.target.value)}
              className="flex-1 w-full p-3 bg-[#1e1e24] text-gray-200 text-xs rounded-xl border border-[#3c4043] focus:outline-none focus:border-blue-500 font-mono resize-none leading-relaxed"
              placeholder="Jot down notes during the call..."
            />
          </div>
        )}
      </div>
    </div>
  );
};
