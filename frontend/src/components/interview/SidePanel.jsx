import React, { useState } from "react";
import {
  X,
  Users,
  MessageSquare,
  FileText,
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Activity,
  Mic,
  Volume2,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Award,
} from "lucide-react";

export default function SidePanel({
  activeTab = "people",
  interviewerProfile,
  candidateName = "Candidate",
  chatMessages = [],
  rubricStages = [],
  analytics = { userSpeakingSeconds: 0, aiSpeakingSeconds: 0, interruptionCount: 0, paceWpm: 130 },
  isAiSpeaking = false,
  userVolume = 0,
  conductWarnings = [],
  interviewerObservations = [],
  companyContext = "",
  candidateResume = "",
  onSendMessage,
  onClose,
}) {
  const [inputText, setInputText] = useState("");
  const [candidateNotes, setCandidateNotes] = useState(
    "Key thoughts & assumptions:\n- Scale: 10M DAU, 1k QPS\n- Storage: 100GB/day\n- Focus on O(1) reads with Redis caching"
  );

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (onSendMessage) {
      onSendMessage(inputText.trim());
    }
    setInputText("");
  };

  const totalSpeaking = (analytics.userSpeakingSeconds || 0) + (analytics.aiSpeakingSeconds || 0) || 1;
  const userRatio = Math.round(((analytics.userSpeakingSeconds || 0) / totalSpeaking) * 100);
  const aiRatio = 100 - userRatio;

  const fallbackAvatar = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80";

  return (
    <div className="w-80 sm:w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-20 select-none shadow-2xl transition-all duration-300">
      {/* Top Header */}
      <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center space-x-2">
          {activeTab === "people" && <Users className="w-5 h-5 text-cyan-400" />}
          {activeTab === "chat" && <MessageSquare className="w-5 h-5 text-cyan-400" />}
          {activeTab === "rubric" && <Activity className="w-5 h-5 text-cyan-400" />}
          {activeTab === "notes" && <FileText className="w-5 h-5 text-cyan-400" />}
          {activeTab === "telemetry" && <Eye className="w-5 h-5 text-cyan-400" />}
          <h2 className="text-sm font-semibold text-white capitalize">
            {activeTab === "rubric" ? "Interview Agenda & Analytics" : activeTab === "telemetry" ? "HR Real-Time Telemetry" : `${activeTab} Panel`}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
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
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              In Call (2 Participants)
            </div>

            {/* AI Interviewer Participant */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-cyan-500">
                  <img
                    src={interviewerProfile?.avatarUrl || fallbackAvatar}
                    alt={interviewerProfile?.name || "Interviewer"}
                    className="w-full h-full object-cover"
                  />
                  {isAiSpeaking && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-semibold text-white">
                      {interviewerProfile?.name || "Dr. Elena Vance"}
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-xs text-slate-400">
                    Host • {interviewerProfile?.company || "Google Cloud"}
                  </div>
                </div>
              </div>

              <div className="text-[11px] font-mono text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                AI ({interviewerProfile?.voice || "Zephyr"})
              </div>
            </div>

            {/* Candidate Participant */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-700">
                  {candidateName[0] || "C"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{candidateName}</div>
                  <div className="text-xs text-slate-400">Candidate (You)</div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <div
                  className={`p-1.5 rounded-full ${
                    userVolume > 0.1
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* AI Persona Details */}
            <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interviewer Persona Focus</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {interviewerProfile?.personality ||
                  "Articulate, encouraging, and deeply technical with a focus on scalable architecture and problem decomposition."}
              </p>
            </div>
          </div>
        )}

        {/* 2. CHAT TAB */}
        {activeTab === "chat" && (
          <div className="h-full flex flex-col justify-between -m-4 p-4">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/50 rounded-xl text-xs text-cyan-200">
                <div className="font-semibold flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> In-Call AI Chat
                </div>
                Messages typed here are directly fed into the interviewer&apos;s real-time context.
              </div>

              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div className="text-[10px] text-slate-400 mb-0.5 px-1">
                    {msg.senderName} • {msg.timestamp}
                  </div>
                  <div
                    className={`max-w-[85%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-cyan-600 text-white rounded-br-none"
                        : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSend} className="mt-3 flex items-center space-x-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Send a message to interviewer..."
                className="flex-1 bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors shadow-md shadow-cyan-600/30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* 3. RUBRIC & SPEECH ANALYTICS TAB */}
        {activeTab === "rubric" && (
          <div className="space-y-5">
            {/* Live Speaking Ratio Analytics */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Live Talk Time Ratio
                </span>
                <span className="font-mono text-cyan-400">{userRatio}% Candidate</span>
              </div>

              {/* Progress Split Bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${userRatio}%` }}
                />
                <div
                  className="bg-indigo-500/60 transition-all duration-500"
                  style={{ width: `${aiRatio}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>You: {analytics.userSpeakingSeconds || 0}s</span>
                <span>Interviewer: {analytics.aiSpeakingSeconds || 0}s</span>
              </div>
            </div>

            {/* Speaking Pace & Interruption Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Interruptions
                </div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {analytics.interruptionCount || 0}
                </div>
                <div className="text-[10px] text-emerald-400">Natural barge-in</div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Target WPM
                </div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {analytics.paceWpm || 130}
                </div>
                <div className="text-[10px] text-cyan-400">Conversational flow</div>
              </div>
            </div>

            {/* 5-Stage Agenda Rubric Checklist */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Interview Agenda (45 Min)
              </div>

              <div className="space-y-2">
                {rubricStages.map((stage, idx) => (
                  <div
                    key={stage.id}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start space-x-3"
                  >
                    <div className="mt-0.5">
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          stage.completed ? "text-emerald-400" : "text-slate-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{stage.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {stage.targetMinutes}m
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. CANDIDATE NOTES TAB */}
        {activeTab === "notes" && (
          <div className="h-full flex flex-col -m-4 p-4 space-y-2">
            <div className="text-xs font-semibold text-slate-300">
              Personal Interview Scratchpad
            </div>
            <p className="text-[11px] text-slate-400">
              Jot down requirements, scale calculations, and system design notes.
            </p>
            <textarea
              value={candidateNotes}
              onChange={(e) => setCandidateNotes(e.target.value)}
              className="flex-1 w-full bg-slate-950 text-slate-200 text-xs p-3 rounded-xl border border-slate-800 resize-none focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
              placeholder="Write your scratchpad notes here..."
            />
          </div>
        )}

        {/* 5. HR REAL-TIME TELEMETRY & OBSERVATIONS TAB */}
        {activeTab === "telemetry" && (
          <div className="space-y-4">
            {/* Integrity & Conduct Status */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Live Conduct & Integrity
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    conductWarnings.length === 0
                      ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-400"
                      : conductWarnings.length === 1
                      ? "bg-amber-950/80 border-amber-500/30 text-amber-400"
                      : "bg-rose-950/80 border-rose-500/30 text-rose-400"
                  }`}
                >
                  {conductWarnings.length === 0
                    ? "Clean (0 Warnings)"
                    : `${conductWarnings.length} Warning${conductWarnings.length > 1 ? "s" : ""}`}
                </span>
              </div>

              {conductWarnings.length > 0 ? (
                <div className="space-y-1.5 mt-2">
                  {conductWarnings.map((w, idx) => (
                    <div
                      key={w.id || idx}
                      className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300 flex items-start gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-bold">Warning #{w.count || idx + 1} ({w.timestamp})</div>
                        <div className="text-slate-300">{w.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Multimodal vision analysis active. Eye contact, posture, and attention are within professional thresholds.
                </p>
              )}
            </div>

            {/* In-Meeting AI Observations Feed */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Interviewer Live Notes ({interviewerObservations.length})</span>
                <span className="text-[10px] text-cyan-400 font-mono">Real-time</span>
              </div>

              {interviewerObservations.length === 0 ? (
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                  Interviewer is listening and observing your responses... Notes will stream here as the conversation progresses.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {interviewerObservations.map((obs, idx) => (
                    <div
                      key={obs.id || idx}
                      className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                        obs.type === "green_flag"
                          ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                          : obs.type === "red_flag"
                          ? "bg-rose-950/30 border-rose-500/30 text-rose-200"
                          : obs.type === "yellow_flag"
                          ? "bg-amber-950/30 border-amber-500/30 text-amber-200"
                          : "bg-slate-950/60 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span className="uppercase tracking-wider font-bold">
                          {obs.category?.replace("_", " ")}
                        </span>
                        <span>{obs.timestamp}</span>
                      </div>
                      <p>{obs.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dual Context Summary Card */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
                <FileText className="w-3.5 h-3.5" />
                <span>Dual Context Active</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1">
                <div>• <strong className="text-white">Target Company Context:</strong> Ingested into panel memory.</div>
                <div>• <strong className="text-white">Candidate Resume Context:</strong> Analyzed for STAR probing.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
