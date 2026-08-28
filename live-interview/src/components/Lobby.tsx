import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Sparkles,
  Settings,
  ShieldCheck,
  ChevronRight,
  Upload,
  User,
  Zap,
  Volume2,
  Briefcase,
  Layers,
  GraduationCap,
} from "lucide-react";
import {
  InterviewConfig,
  InterviewerProfile,
  InterviewFormat,
  SeniorityLevel,
} from "../types";
import { INTERVIEWER_PROFILES } from "../data/interviewProfiles";

interface LobbyProps {
  onJoinMeeting: (config: InterviewConfig) => void;
  stream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  userVolume: number;
  onToggleMic: () => void;
  onToggleVideo: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onJoinMeeting,
  stream,
  isMuted,
  isVideoOff,
  userVolume,
  onToggleMic,
  onToggleVideo,
}) => {
  const [candidateName, setCandidateName] = useState("Alex Turner");
  const [role, setRole] = useState("Senior Full-Stack Software Engineer");
  const [seniority, setSeniority] = useState<SeniorityLevel>("Senior");
  const [format, setFormat] = useState<InterviewFormat>("Full Technical & Coding");
  const [selectedInterviewer, setSelectedInterviewer] = useState<InterviewerProfile>(
    INTERVIEWER_PROFILES[0]
  );
  const [resumeText, setResumeText] = useState(
    "5+ years building scalable React/Node.js microservices, distributed caching with Redis, Kubernetes deployment pipelines, and GraphQL APIs. Previously optimized search latency by 40%."
  );
  const [jobDescription, setJobDescription] = useState(
    "Google Cloud Platform Senior Engineer: Designing high-throughput cloud services, fault-tolerant architectures, and interactive web tools."
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoOff]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    onJoinMeeting({
      candidateName: candidateName.trim() || "Candidate",
      role,
      seniority,
      format,
      interviewerProfile: selectedInterviewer,
      resumeText,
      jobDescription,
      customRequirements: "",
      durationMinutes: 45,
    });
  };

  return (
    <div className="min-h-screen bg-[#202124] text-[#e8eaed] flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none">
      {/* Top Google Meet style Header */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between pb-4 border-b border-[#3c4043]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              MeetAI Interview Platform
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Live Duplex v3.1
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Interactive Google Meet simulation powered by Gemini Multimodal Live API
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Real-time Audio & Vision Active</span>
        </div>
      </header>

      {/* Main Content: Split Grid */}
      <main className="w-full max-w-7xl mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Camera Preview & Test */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full aspect-video bg-[#1e1e24] rounded-3xl overflow-hidden border border-[#3c4043] shadow-2xl flex items-center justify-center group">
            {!isVideoOff && stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6">
                <div className="w-24 h-24 rounded-full bg-[#2d2f34] flex items-center justify-center text-white text-3xl font-semibold mb-3 border border-[#3c4043]">
                  {candidateName
                    ? candidateName.slice(0, 2).toUpperCase()
                    : <User className="w-10 h-10 text-gray-400" />}
                </div>
                <p className="text-sm font-medium text-gray-300">Camera is off</p>
                <p className="text-xs text-gray-500 mt-1">
                  You can toggle your camera anytime during the interview.
                </p>
              </div>
            )}

            {/* Mic Visualizer Bar */}
            <div className="absolute bottom-5 left-5 bg-[#202124]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#3c4043] flex items-center space-x-2 text-xs text-white">
              {isMuted ? (
                <MicOff className="w-4 h-4 text-red-400" />
              ) : (
                <div className="flex items-center space-x-1">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <div className="w-16 h-2 bg-[#3c4043] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-75"
                      style={{ width: `${Math.min(100, userVolume * 250)}%` }}
                    />
                  </div>
                </div>
              )}
              <span className="font-medium text-gray-200">
                {isMuted ? "Mic Off" : "Mic Live"}
              </span>
            </div>

            {/* Camera & Mic Quick Control Floating Bar */}
            <div className="absolute bottom-5 right-5 flex items-center space-x-3">
              <button
                type="button"
                onClick={onToggleMic}
                className={`p-3 rounded-full transition-all duration-200 shadow-xl ${
                  isMuted
                    ? "bg-[#ea4335] text-white hover:bg-[#d93025]"
                    : "bg-[#3c4043] text-white hover:bg-[#4a4e52]"
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={onToggleVideo}
                className={`p-3 rounded-full transition-all duration-200 shadow-xl ${
                  isVideoOff
                    ? "bg-[#ea4335] text-white hover:bg-[#d93025]"
                    : "bg-[#3c4043] text-white hover:bg-[#4a4e52]"
                }`}
                title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Ensure your microphone and camera permissions are allowed for the most realistic Google Meet interview experience.
          </p>
        </div>

        {/* Right Column: Customization & Join Form */}
        <div className="lg:col-span-5 bg-[#1e1e24] p-6 sm:p-7 rounded-3xl border border-[#3c4043] shadow-2xl flex flex-col space-y-5">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Ready to join your interview?
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Select your AI interviewer persona and target job profile.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            {/* Candidate Name Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Your Full Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Alex Turner"
                required
                className="w-full bg-[#2d2f34] text-white text-sm rounded-xl px-3.5 py-2.5 border border-[#3c4043] focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* Target Role & Seniority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" /> Target Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#2d2f34] text-white text-xs rounded-xl px-3 py-2.5 border border-[#3c4043] focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="Senior Full-Stack Software Engineer">Full-Stack Engineer</option>
                  <option value="Staff Backend & Distributed Systems Engineer">Backend / Distributed</option>
                  <option value="Staff Frontend & Web Architect">Frontend / Web</option>
                  <option value="Principal Machine Learning Engineer">Machine Learning / AI</option>
                  <option value="Senior Engineering Manager">Engineering Manager</option>
                  <option value="Senior Product Manager">Product Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" /> Seniority Level
                </label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value as SeniorityLevel)}
                  className="w-full bg-[#2d2f34] text-white text-xs rounded-xl px-3 py-2.5 border border-[#3c4043] focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="Junior">Junior (L3)</option>
                  <option value="Mid-Level">Mid-Level (L4)</option>
                  <option value="Senior">Senior (L5)</option>
                  <option value="Staff / Principal">Staff / Principal (L6/L7)</option>
                </select>
              </div>
            </div>

            {/* Interview Format */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" /> Interview Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as InterviewFormat)}
                className="w-full bg-[#2d2f34] text-white text-xs rounded-xl px-3 py-2.5 border border-[#3c4043] focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="Full Technical & Coding">Full Technical & Live Coding (45m)</option>
                <option value="System Design & Architecture">System Design & Distributed Scalability (45m)</option>
                <option value="Behavioral & Leadership (STAR)">Behavioral & Leadership STAR Method (30m)</option>
              </select>
            </div>

            {/* AI Interviewer Persona Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Interviewer Persona & Voice
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {INTERVIEWER_PROFILES.map((interviewer) => (
                  <button
                    key={interviewer.name}
                    type="button"
                    onClick={() => setSelectedInterviewer(interviewer)}
                    className={`p-2 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                      selectedInterviewer.name === interviewer.name
                        ? "bg-blue-600/20 border-blue-500 text-white shadow-md ring-1 ring-blue-500"
                        : "bg-[#2d2f34] border-[#3c4043] text-gray-300 hover:bg-[#383a40]"
                    }`}
                  >
                    <img
                      src={interviewer.avatarUrl}
                      alt={interviewer.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate">
                        {interviewer.name}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        Voice: {interviewer.voice}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Resume & Target Context Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 py-1"
              >
                <span>{showAdvanced ? "Hide Resume & Custom Context" : "+ Add Your Resume / Job Context"}</span>
              </button>

              {showAdvanced && (
                <div className="mt-2 space-y-3 p-3.5 bg-[#2d2f34] rounded-2xl border border-[#3c4043]">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Your Resume Highlights / Bio
                    </label>
                    <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      rows={2}
                      className="w-full bg-[#1e1e24] text-xs text-white p-2.5 rounded-xl border border-[#3c4043] focus:outline-none focus:border-blue-500 resize-none font-mono"
                      placeholder="Paste resume summary..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Join Call Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-all duration-200 shadow-xl shadow-blue-600/30 cursor-pointer"
            >
              <span>Join Google Meet Call</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto pt-4 border-t border-[#3c4043] text-center text-xs text-gray-500">
        MeetAI Google Meet Interview Platform • Full Duplex Real-Time Voice & Video Powered by Google Gemini
      </footer>
    </div>
  );
};
