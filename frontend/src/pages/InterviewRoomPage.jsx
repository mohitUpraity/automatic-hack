import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchOpportunityById } from "../api/client";
import { INTERVIEWER_PROFILES } from "../components/interview/interviewData";
import LiveInterviewRoom from "../components/interview/LiveInterviewRoom";
import InterviewHistoryView from "../components/interview/InterviewHistoryView";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Sliders,
  FileText,
  Building,
  UserCheck,
  Volume2,
  Clock,
  Layers,
} from "lucide-react";

export default function InterviewRoomPage() {
  const [searchParams] = useSearchParams();
  const { id: paramOppId } = useParams();
  const navigate = useNavigate();
  const { user, candidates = [], selectedCandidateId } = useAuth();

  const [lobbyView, setLobbyView] = useState(searchParams.get("tab") === "history" ? "history" : "studio");

  const oppId = searchParams.get("oppId") || paramOppId || searchParams.get("id");
  const [company, setCompany] = useState(searchParams.get("company") || "Google Cloud");
  const [role, setRole] = useState(searchParams.get("role") || "Senior Full-Stack Software Engineer");
  const [seniority, setSeniority] = useState(searchParams.get("seniority") || "Senior");
  const [format, setFormat] = useState(searchParams.get("format") || "Full Technical & Coding");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const candidateName = searchParams.get("candidate") || user?.name || (candidates.length > 0 ? candidates[0].name : "Mohit Upraity");

  // Pre-call Lobby States
  const [inMeeting, setInMeeting] = useState(false);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [userStream, setUserStream] = useState(null);
  const [micVolume, setMicVolume] = useState(0);

  const previewVideoRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  const [showContextModal, setShowContextModal] = useState(false);
  const [activeTab, setActiveTab] = useState("jd"); // "jd" | "resume"

  // 1. Fetch target opportunity from database API
  useEffect(() => {
    if (oppId) {
      fetchOpportunityById(oppId)
        .then((res) => {
          if (res?.opportunity) {
            const opp = res.opportunity;
            if (opp.company || opp.company_name || opp.source) {
              setCompany(opp.company || opp.company_name || opp.source);
            }
            if (opp.title) setRole(opp.title);
            if (opp.description) setJobDescription(opp.description);
            if (opp.requirements) {
              setJobDescription((prev) =>
                prev ? `${prev}\n\nRequirements & Skills:\n${opp.requirements}` : opp.requirements
              );
            }
            if (opp.seniority_level || opp.level) {
              setSeniority(opp.seniority_level || opp.level);
            }
          }
        })
        .catch((err) => {
          console.warn("[Interview Lobby] Opportunity DB fetch fallback:", err);
        });
    }
  }, [oppId]);

  // 2. Preload candidate resume from Supabase database persona, AuthContext, or localStorage
  useEffect(() => {
    // A. Check active candidate persona from database
    const activeCandidate = candidates.find(
      (c) => c.id === selectedCandidateId || String(c.id) === String(selectedCandidateId)
    ) || candidates[0];

    if (activeCandidate?.resume_text) {
      setResumeText(activeCandidate.resume_text);
      return;
    }
    if (activeCandidate?.resume_markdown) {
      setResumeText(activeCandidate.resume_markdown);
      return;
    }

    // B. Check user profile
    if (user?.resume_text) {
      setResumeText(user.resume_text);
      return;
    }
    if (user?.raw_markdown) {
      setResumeText(user.raw_markdown);
      return;
    }

    // C. Check localStorage cache
    const cachedResume = localStorage.getItem("careeros_resume_text") ||
      localStorage.getItem("careeros_raw_resume") ||
      localStorage.getItem("careeros_parsed_resume");
    if (cachedResume) {
      setResumeText(cachedResume);
      return;
    }

    // D. Default structured benchmark
    setResumeText(
      `Candidate Name: ${candidateName}\nSkills: React, Node.js, Python, TypeScript, Distributed Systems, Cloud Architecture, PostgreSQL, Docker, Kubernetes\nExperience: Senior Full-Stack Software Engineer with 6+ years experience architecting high-scale microservices, real-time streaming engines, and resilient distributed pipelines.`
    );
  }, [user, candidates, selectedCandidateId, candidateName]);

  const selectedProfile = INTERVIEWER_PROFILES[selectedProfileIndex];

  const meetingConfig = useMemo(() => ({
    company,
    role,
    seniority,
    format,
    candidateName,
    voice: selectedProfile.voice,
    companyContext: `Target Company: ${company}\nTarget Role: ${seniority} ${role}\nJob Description & Expectations:\n${jobDescription || "Standard high-bar industry benchmarks for scalability, distributed systems, clean code, and leadership."}`,
    candidateResume: resumeText || `Candidate Name: ${candidateName}\nTarget Role: ${role}\nExperienced engineer with background in full-stack, distributed systems, and real-time architectures.`,
    resumeText,
    jobDescription,
    interviewerProfile: selectedProfile,
  }), [company, role, seniority, format, candidateName, selectedProfile, resumeText, jobDescription]);

  // Request camera and microphone for Lobby preview
  useEffect(() => {
    let isMounted = true;

    async function initLobbyDevices() {
      if (userStream) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setUserStream(stream);

        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }

        // Setup live mic volume meter for lobby
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVol = () => {
          if (!isMounted || inMeetingRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setMicVolume(Math.min(100, Math.round(avg * 2)));
          animFrameRef.current = requestAnimationFrame(checkVol);
        };
        animFrameRef.current = requestAnimationFrame(checkVol);
      } catch (err) {
        console.warn("Lobby video/audio access error, trying audio-only:", err);
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          if (isMounted) {
            setUserStream(audioOnlyStream);
            setVideoEnabled(false);
          }
        } catch (e) {
          console.warn("Audio-only access also unavailable:", e);
        }
      }
    }

    initLobbyDevices();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const inMeetingRef = useRef(inMeeting);
  useEffect(() => {
    inMeetingRef.current = inMeeting;
    if (inMeeting) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    }
  }, [inMeeting]);

  const handleToggleMic = () => {
    setMicEnabled((prev) => {
      const next = !prev;
      if (userStream) {
        userStream.getAudioTracks().forEach((t) => {
          t.enabled = next;
        });
      }
      return next;
    });
  };

  const handleToggleVideo = () => {
    setVideoEnabled((prev) => {
      const next = !prev;
      if (userStream) {
        userStream.getVideoTracks().forEach((t) => {
          t.enabled = next;
        });
      }
      return next;
    });
  };

  // If in meeting, mount the full duplex live interview studio
  if (inMeeting) {
    return (
      <LiveInterviewRoom
        config={meetingConfig}
        userStream={userStream}
        isMuted={!micEnabled}
        isVideoOff={!videoEnabled}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleVideo}
        onLeaveMeeting={() => {
          setInMeeting(false);
          navigate("/opportunities");
        }}
      />
    );
  }

  // Pre-meeting Lobby UI
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-cyan-500/30">
      {/* Top Brand Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between max-w-7xl mx-auto w-full mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-600/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              CareerOS Live Interview Studio
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                Gemini 3.1 Flash Live
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Full Duplex Multi-Agent Mock Interview & Bar-Raiser Simulation
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner">
            <button
              onClick={() => setLobbyView("studio")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                lobbyView === "studio"
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Live Studio</span>
            </button>
            <button
              onClick={() => setLobbyView("history")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                lobbyView === "history"
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Interview History</span>
            </button>
          </div>

          <button
            onClick={() => navigate("/opportunities")}
            className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-900 transition-colors"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Conditionally Render History or Studio Lobby */}
      {lobbyView === "history" ? (
        <div className="max-w-7xl mx-auto w-full flex-1 mt-2">
          <InterviewHistoryView
            onLaunchInterview={(item) => {
              if (item.company) setCompany(item.company);
              if (item.role) setRole(item.role);
              if (item.seniority) setSeniority(item.seniority);
              setLobbyView("studio");
            }}
          />
        </div>
      ) : (
        /* Main Grid: Device Check vs Interview Config */
        <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 my-auto">
        {/* Left: Camera Preview & Hardware Checks */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
            {/* Live Video Element */}
            <video
              ref={previewVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
                videoEnabled ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* Video Off Placeholder */}
            {!videoEnabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-4">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <VideoOff className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-white">Camera is turned off</h3>
                <p className="text-xs text-slate-400 mt-1">
                  You can still speak and participate in the live interview.
                </p>
              </div>
            )}

            {/* Device Control Badges */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/80 shadow-2xl">
              <button
                onClick={handleToggleMic}
                className={`p-3 rounded-full transition-all ${
                  micEnabled
                    ? "bg-slate-800 hover:bg-slate-700 text-white"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
                }`}
                title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
              >
                {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                onClick={handleToggleVideo}
                className={`p-3 rounded-full transition-all ${
                  videoEnabled
                    ? "bg-slate-800 hover:bg-slate-700 text-white"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
                }`}
                title={videoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            </div>

            {/* Real-time Mic Level Visualizer */}
            <div className="absolute top-4 left-4 flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-xs text-slate-300">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-75"
                  style={{ width: `${micEnabled ? micVolume : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full-duplex real-time audio with instant conversational barge-in support.</span>
            </div>
            <div className="flex items-center space-x-1 font-mono text-cyan-400 text-[11px]">
              <Radio className="w-3 h-3 animate-pulse" /> 16kHz PCM In / 24kHz Out
            </div>
          </div>
        </div>

        {/* Right: Interview Setup & Persona Selection */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-2xl flex flex-col space-y-5">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Interview Setup & Target Role
            </h2>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">Seniority</label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 font-semibold"
                >
                  <option value="Junior">Junior (L3)</option>
                  <option value="Mid-Level">Mid-Level (L4)</option>
                  <option value="Senior">Senior (L5)</option>
                  <option value="Staff / Principal">Staff / Principal (L6+)</option>
                  <option value="Engineering Manager">Engineering Manager (M1)</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[11px] text-slate-400 block mb-1 font-medium">Target Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 font-semibold"
              />
            </div>

            {/* Dual Context Pill & Inspector */}
            <div className="mt-3.5 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  Dual Context Ingestion
                </span>
                <span className="text-[10px] bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                  JD + Resume Ready
                </span>
              </div>

              {/* Tabs for quick context editing */}
              <div className="flex rounded-xl bg-slate-900 p-1 gap-1 text-[11px]">
                <button
                  onClick={() => setActiveTab("jd")}
                  className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
                    activeTab === "jd"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Job Description ({company})
                </button>
                <button
                  onClick={() => setActiveTab("resume")}
                  className={`flex-1 py-1 rounded-lg font-semibold transition-all ${
                    activeTab === "resume"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Candidate Resume ({candidateName})
                </button>
              </div>

              {activeTab === "jd" ? (
                <textarea
                  rows={3}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste Job Description, tech stack requirements, or company core values..."
                  className="w-full bg-slate-900/60 text-slate-200 text-[11px] p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 resize-none font-mono placeholder:text-slate-600"
                />
              ) : (
                <textarea
                  rows={3}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste resume experience, notable projects, tech skills..."
                  className="w-full bg-slate-900/60 text-slate-200 text-[11px] p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 resize-none font-mono placeholder:text-slate-600"
                />
              )}
            </div>
          </div>

          {/* Persona Selection */}
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
              2. Select AI Interviewer Persona
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {INTERVIEWER_PROFILES.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProfileIndex(idx)}
                  className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                    selectedProfileIndex === idx
                      ? "bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50"
                      : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Voice: <span className="text-cyan-400 font-mono">{p.voice}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Persona Highlight */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{selectedProfile.name} • {selectedProfile.role}</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {selectedProfile.personality}
            </p>
          </div>

          {/* Start Interview CTA */}
          <button
            onClick={() => setInMeeting(true)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:from-cyan-700 active:to-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <span>Enter Live Interview Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
      )}
    </div>
  );
}
