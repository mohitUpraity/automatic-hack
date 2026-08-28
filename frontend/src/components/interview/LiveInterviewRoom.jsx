import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Radio,
  Maximize2,
  Minimize2,
  Hand,
  ShieldCheck,
} from "lucide-react";
import { AudioStreamingManager } from "./AudioStreamingManager";
import { INITIAL_RUBRIC_STAGES, INTERVIEWER_PROFILES } from "./interviewData";
import InterviewerTile from "./InterviewerTile";
import CandidateTile from "./CandidateTile";
import CodeEditorPanel from "./CodeEditorPanel";
import WhiteboardPanel from "./WhiteboardPanel";
import MeetingControls from "./MeetingControls";
import SidePanel from "./SidePanel";
import CaptionsOverlay from "./CaptionsOverlay";
import FloatingReactions from "./FloatingReactions";
import InterviewDebriefModal from "./InterviewDebriefModal";

export default function LiveInterviewRoom({
  config = {
    company: "Google Cloud",
    role: "Senior Full-Stack Software Engineer",
    seniority: "Senior",
    format: "Full Technical & Coding",
    candidateName: "Mohit Upraity",
    voice: "Zephyr",
    resumeText: "",
    jobDescription: "",
    interviewerProfile: INTERVIEWER_PROFILES[0],
  },
  userStream = null,
  isMuted = false,
  isVideoOff = false,
  onToggleMic,
  onToggleVideo,
  onLeaveMeeting,
}) {
  const [activeLayout, setActiveLayout] = useState("split");
  const [activeSideTab, setActiveSideTab] = useState(null);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);

  // Audio & Speech States
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [aiVolume, setAiVolume] = useState(0);
  const [userVolume, setUserVolume] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [currentCaption, setCurrentCaption] = useState({
    speaker: "none",
    speakerName: "",
    text: "",
  });

  // Transcripts & Chat
  const [transcripts, setTranscripts] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [rubricStages, setRubricStages] = useState(INITIAL_RUBRIC_STAGES);
  const [reactions, setReactions] = useState([]);
  const [analytics, setAnalytics] = useState({
    userSpeakingSeconds: 0,
    aiSpeakingSeconds: 0,
    interruptionCount: 0,
    turnCount: 0,
    paceWpm: 130,
  });

  // Post-Interview Debrief Modal
  const [showDebrief, setShowDebrief] = useState(false);
  const [debriefData, setDebriefData] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastCodeSnippet, setLastCodeSnippet] = useState("");

  // Executive HR & Multimodal Observation States
  const [conductWarnings, setConductWarnings] = useState([]);
  const [activeWarningBanner, setActiveWarningBanner] = useState(null);
  const [interviewerObservations, setInterviewerObservations] = useState([]);
  const [codingChallenge, setCodingChallenge] = useState(null);
  const [whiteboardElements, setWhiteboardElements] = useState(null);

  // Refs
  const audioManagerRef = useRef(null);
  const socketRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const videoFeedRef = useRef(null);
  const activeStreamRef = useRef(userStream);
  const configRef = useRef(config);
  configRef.current = config;

  const selectedProfile =
    config.interviewerProfile ||
    INTERVIEWER_PROFILES.find((p) => p.voice === config.voice) ||
    INTERVIEWER_PROFILES[0];

  // Initialize WebSocket & Audio Manager
  useEffect(() => {
    let isMounted = true;
    const audioManager = new AudioStreamingManager();
    audioManagerRef.current = audioManager;

    audioManager.setOnVolumeChange((inVol, outVol) => {
      setUserVolume(inVol);
      setAiVolume(outVol);
      setIsAiSpeaking(outVol > 0.035);
    });

    const handleSocketMessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "ready") {
          console.log("✅ Gemini Live session READY — AI will begin speaking");
          setIsConnecting(false);
        }

        // 1. In-Meeting Floating Reaction Tool Call
        if (msg.type === "interviewer_reaction") {
          const newReaction = {
            id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            emoji: msg.data.emoji || "👏",
            label: msg.data.label || "Good Point",
            reason: msg.data.reason || "",
          };
          setReactions((prev) => [...prev, newReaction]);
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
          }, 4500);
        }

        // 2. Formal Conduct & Distraction Warning Tool Call
        else if (msg.type === "conduct_warning") {
          const warningObj = {
            id: `warn-${Date.now()}`,
            reason: msg.data.warning_reason || "Distraction or phone usage noticed",
            count: msg.data.warning_number || (conductWarnings.length + 1),
            isFinal: Boolean(msg.data.is_final_warning),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setConductWarnings((prev) => [...prev, warningObj]);
          setActiveWarningBanner(warningObj);
          setTimeout(() => setActiveWarningBanner(null), 9000);
        }

        // 3. Interviewer Telemetry Observation Tool Call
        else if (msg.type === "interviewer_observation") {
          setInterviewerObservations((prev) => [
            ...prev,
            {
              id: `obs-${Date.now()}`,
              category: msg.data.category || "non_verbal",
              type: msg.data.observation_type || "neutral_note",
              note: msg.data.note,
              scoreDelta: msg.data.score_delta || 0,
              timestamp: msg.data.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        }

        // 4. Live Coding Challenge Injection
        else if (msg.type === "push_coding_challenge") {
          setCodingChallenge(msg.data);
          setActiveSideTab("code");
        }

        // 5. Whiteboard Architectural Diagram Update
        else if (msg.type === "update_whiteboard") {
          setWhiteboardElements(msg.data);
          setActiveSideTab("whiteboard");
        }

        // 6. Conclude Interview Tool Trigger
        else if (msg.type === "conclude_interview") {
          console.log("🏁 Interview concluded by AI:", msg.data);
          triggerFullDebrief(msg.data);
        }

        // Voice and transcript events
        else if (msg.type === "audio") {
          setIsConnecting(false);
          audioManager.playAudioChunk(msg.data);
          setIsInterrupted(false);
        } else if (msg.type === "output_transcript") {
          setCurrentCaption({
            speaker: "ai",
            speakerName: selectedProfile.name,
            text: msg.text,
          });
          setTranscripts((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.speaker === "ai" && !last.isFinal) {
              return [
                ...prev.slice(0, -1),
                { ...last, text: last.text + " " + msg.text },
              ];
            }
            return [
              ...prev,
              {
                id: `ai-${Date.now()}`,
                speaker: "ai",
                speakerName: selectedProfile.name,
                text: msg.text,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                isFinal: false,
              },
            ];
          });
        } else if (msg.type === "input_transcript") {
          setCurrentCaption({
            speaker: "user",
            speakerName: config.candidateName || "You",
            text: msg.text,
          });
          setTranscripts((prev) => [
            ...prev,
            {
              id: `user-${Date.now()}`,
              speaker: "user",
              speakerName: config.candidateName || "You",
              text: msg.text,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isFinal: true,
            },
          ]);
        } else if (msg.type === "interrupted") {
          audioManager.stopPlayback();
          setIsAiSpeaking(false);
          setIsInterrupted(true);
          setAnalytics((prev) => ({
            ...prev,
            interruptionCount: prev.interruptionCount + 1,
          }));
          setTimeout(() => setIsInterrupted(false), 2500);
        } else if (msg.type === "turn_complete") {
          setAnalytics((prev) => ({
            ...prev,
            turnCount: prev.turnCount + 1,
          }));
        } else if (msg.type === "error") {
          console.error("❌ Server error:", msg.message);
        } else if (msg.type === "session_closed") {
          console.warn("⚠️ Gemini Live session closed by server");
        }
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    const wsUrl = `ws://${window.location.hostname || "localhost"}:3000/api/live`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      if (!isMounted) {
        ws.close();
        return;
      }
      console.log("🚀 Live Interview WebSocket connected to", wsUrl);
      setIsConnecting(false);

      // Send initial setup packet to Gemini Live with Dual Context
      const activeCfg = configRef.current || config;
      const setupPayload = {
        type: "setup",
        role: activeCfg.role,
        seniority: activeCfg.seniority || "Senior",
        voice: selectedProfile.voice || "Zephyr",
        candidateName: activeCfg.candidateName || "Candidate",
        interviewType: activeCfg.format || "Full Technical & Behavioral",
        company: activeCfg.company || "Google Cloud",
        companyContext: activeCfg.companyContext || `Target Company: ${activeCfg.company || "Google Cloud"}\nRole: ${activeCfg.role}`,
        candidateResume: activeCfg.candidateResume || activeCfg.resumeText || "Experienced Software Engineer",
        customContext: `Candidate Resume: ${activeCfg.resumeText || ""}\nJob Description: ${activeCfg.jobDescription || ""}`,
      };
      console.log("📤 Sending setup with dual context:", setupPayload.candidateName, setupPayload.company, setupPayload.role);
      ws.send(JSON.stringify(setupPayload));
    };

    ws.onmessage = handleSocketMessage;

    ws.onclose = (e) => {
      console.warn("🔌 WebSocket closed:", e.code, e.reason);
    };

    ws.onerror = (err) => {
      console.warn("WebSocket error on", wsUrl, err);
      setIsConnecting(false);
    };

    // Forward mic audio PCM to WebSocket
    let audioChunkCount = 0;
    audioManager.setOnAudioChunk((base64Pcm) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "audio", data: base64Pcm }));
        audioChunkCount++;
        if (audioChunkCount <= 3 || audioChunkCount % 50 === 0) {
          console.log(`🎙️ Audio chunk #${audioChunkCount} sent (${base64Pcm.length} bytes base64)`);
        }
      }
    });

    // Start Audio Capture — verify the stream is alive
    const captureStream = userStream;
    if (captureStream) {
      const audioTracks = captureStream.getAudioTracks();
      console.log("🔊 Audio tracks:", audioTracks.length, "enabled:", audioTracks.map(t => t.enabled), "readyState:", audioTracks.map(t => t.readyState));
      
      if (audioTracks.length > 0 && audioTracks[0].readyState === "live") {
        activeStreamRef.current = captureStream;
        audioManager.startAudioCapture(captureStream);
        if (videoFeedRef.current) {
          videoFeedRef.current.srcObject = captureStream;
        }
        console.log("✅ Audio capture started with lobby stream");
      } else {
        console.warn("⚠️ Lobby stream audio tracks are dead, requesting new stream...");
        navigator.mediaDevices
          ?.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: { width: { ideal: 640 }, height: { ideal: 360 } },
          })
          .then((stream) => {
            if (isMounted) {
              activeStreamRef.current = stream;
              audioManager.startAudioCapture(stream);
              if (videoFeedRef.current) {
                videoFeedRef.current.srcObject = stream;
              }
              console.log("✅ Audio capture started with NEW stream");
            }
          })
          .catch((err) => {
            console.error("❌ Could not get media stream:", err);
          });
      }
    } else {
      console.warn("⚠️ No userStream provided, requesting new stream...");
      navigator.mediaDevices
        ?.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: { width: { ideal: 640 }, height: { ideal: 360 } },
        })
        .then((stream) => {
          if (isMounted) {
            activeStreamRef.current = stream;
            audioManager.startAudioCapture(stream);
            if (videoFeedRef.current) {
              videoFeedRef.current.srcObject = stream;
            }
            console.log("✅ Audio capture started with fallback stream");
          }
        })
        .catch((err) => {
          console.error("❌ Could not get media stream:", err);
        });
    }

    // Video Frame Streaming Loop (~1 FPS, 640x360 high-definition vision feed)
    frameIntervalRef.current = setInterval(() => {
      const activeSocket = socketRef.current;
      if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN) return;
      const canvas = hiddenCanvasRef.current;
      const activeVideo = videoFeedRef.current;

      if (canvas && activeVideo && activeVideo.readyState >= 2 && !isVideoOff) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = 640;
          canvas.height = 360;
          ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
          const base64Jpeg = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
          activeSocket.send(JSON.stringify({ type: "video", data: base64Jpeg }));
        }
      }
    }, 1000);

    // Live analytics timer
    const analyticsTimer = setInterval(() => {
      setAnalytics((prev) => ({
        ...prev,
        userSpeakingSeconds: prev.userSpeakingSeconds + (userVolume > 0.05 && !isMuted ? 1 : 0),
        aiSpeakingSeconds: prev.aiSpeakingSeconds + (isAiSpeaking ? 1 : 0),
      }));
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(analyticsTimer);
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      audioManager.cleanup();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, []);

  // Sync mute state
  useEffect(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.setMute(isMuted);
    }
  }, [isMuted]);

  // Real-time browser speech recognition for 100% transcript grounding
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    let recognition;
    try {
      recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const spokenText = event.results[i][0].transcript.trim();
            if (spokenText && spokenText.length > 2) {
              setTranscripts((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.speaker === "user" && last.createdAt && (Date.now() - last.createdAt < 6000)) {
                  return [
                    ...prev.slice(0, -1),
                    { ...last, text: `${last.text} ${spokenText}`, createdAt: Date.now() },
                  ];
                }
                return [
                  ...prev,
                  {
                    id: `user-rec-${Date.now()}`,
                    speaker: "user",
                    speakerName: config.candidateName || "Candidate",
                    text: spokenText,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    isFinal: true,
                    createdAt: Date.now(),
                  },
                ];
              });
            }
          }
        }
      };

      recognition.onerror = () => {};
      recognition.onend = () => {
        try {
          if (!isMuted) recognition.start();
        } catch (e) {}
      };

      recognition.start();
    } catch (e) {}

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  }, [isMuted, config.candidateName]);

  // Sync video source element
  useEffect(() => {
    if (videoFeedRef.current) {
      videoFeedRef.current.srcObject = screenStream || userStream || activeStreamRef.current;
    }
  }, [userStream, screenStream, isVideoOff]);

  // Screen share handler
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.warn("Screen share cancelled:", err);
      }
    }
  };

  // Reactions
  const handleTriggerReaction = (emoji) => {
    const newReaction = {
      id: `react-${Date.now()}-${Math.random()}`,
      emoji,
      leftPercent: 30 + Math.random() * 40,
    };
    setReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2500);
  };

  // In-call chat
  const handleSendMessage = (text) => {
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: "user",
      senderName: config.candidateName || "You",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, newMsg]);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "text",
          data: `Candidate sent chat message: "${text}"`,
        })
      );
    }
  };

  // Sync Code IDE with Gemini Live
  const handleSyncCodeWithAi = (code, language) => {
    setLastCodeSnippet(code);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "text",
          data: `[Candidate Code in ${language}]:\n\`\`\`${language}\n${code}\n\`\`\`\nPlease review candidate code and give real-time feedback or ask questions.`,
        })
      );
    }
    handleTriggerReaction("⚡");
  };

  // Sync Whiteboard with Gemini Live
  const handleSyncWhiteboardWithAi = (dataUrl) => {
    if (socketRef.current?.readyState === WebSocket.OPEN && dataUrl) {
      const base64Jpeg = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      socketRef.current.send(
        JSON.stringify({
          type: "video",
          data: base64Jpeg,
        })
      );
      socketRef.current.send(
        JSON.stringify({
          type: "text",
          data: "Candidate updated their System Design Whiteboard architecture diagram. Please analyze the diagram components they drew.",
        })
      );
    }
    handleTriggerReaction("🎨");
  };

  // Trigger full evaluation and debrief modal
  const triggerFullDebrief = async (conclusionData = null) => {
    setShowDebrief(true);
    setIsEvaluating(true);

    if (audioManagerRef.current) {
      audioManagerRef.current.stopPlayback();
    }

    const evalPayload = {
      transcript: transcripts,
      role: config.role,
      seniority: config.seniority,
      format: config.format,
      company: config.company || selectedProfile.company,
      companyContext: config.companyContext || config.jobDescription,
      candidateResume: config.candidateResume || config.resumeText,
      conductWarnings: conductWarnings,
      interviewerObservations: interviewerObservations,
      codeSnippet: lastCodeSnippet,
      conclusionData: conclusionData,
      notes: chatMessages.map((m) => `${m.senderName}: ${m.text}`).join("\n"),
    };

    try {
      let res;
      try {
        res = await fetch("http://localhost:3000/api/evaluate-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(evalPayload),
        });
      } catch (e) {
        res = await fetch("/api/evaluate-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(evalPayload),
        });
      }
      const data = await res.json();
      if (conclusionData && conclusionData.overall_verdict) {
        data.hiringDecision = conclusionData.overall_verdict;
        if (conclusionData.readiness_score) {
          data.overall_readiness_score = conclusionData.readiness_score;
          data.overallScore = conclusionData.readiness_score;
        }
        if (conclusionData.reason && (!data.executive_summary || data.executive_summary.length < 50)) {
          data.executive_summary = `The live bar-raiser panel concluded with a ${conclusionData.overall_verdict} verdict. ${conclusionData.reason}`;
        }
      }
      setDebriefData(data);

      // Persist completed interview session into local interview history
      try {
        const historyItem = {
          id: `hist_${Date.now()}`,
          date: new Date().toISOString(),
          durationMinutes: Math.max(1, Math.round((analytics.userSpeakingSeconds + analytics.aiSpeakingSeconds) / 60) || 12),
          company: config.company || "Target Company",
          role: config.role || "Software Engineer",
          seniority: config.seniority || "Senior",
          candidateName: config.candidateName || "Candidate",
          interviewerName: config.interviewerProfile?.name || "Sarah (SVP Talent)",
          voice: config.voice || "Zephyr",
          hiringDecision: data.hiringDecision || (data.overall_readiness_score >= 80 ? "Hire" : "In Review"),
          readinessScore: data.overall_readiness_score || data.readinessScore || 85,
          conductStatus: data.conductStatus?.status || (conductWarnings.length === 0 ? "Clean (0 Warnings)" : `${conductWarnings.length} Conduct Warning(s)`),
          conductWarningsCount: conductWarnings.length,
          dimensions: data.dimensions || {
            technicalCompetence: 88,
            systemDesignRigor: 85,
            behavioralSTAR: 86,
            executivePresence: 88,
            communicationClarity: 87,
          },
          nonVerbal: data.nonVerbal || {
            postureScore: 90,
            eyeContactScore: 92,
            composureScore: 89,
            observations: interviewerObservations.map((o) => o.note),
          },
          executiveSummary: data.executive_summary || data.executiveSummary || "Completed full duplex bar-raiser simulation.",
          ...data,
        };
        const existing = JSON.parse(localStorage.getItem("careeros_interview_history") || "[]");
        localStorage.setItem("careeros_interview_history", JSON.stringify([historyItem, ...existing.slice(0, 50)]));
      } catch (saveErr) {
        console.warn("[Interview History Save Error]", saveErr);
      }
    } catch (err) {
      console.error("Evaluation request error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // End Call & Debrief
  const handleEndCall = () => {
    triggerFullDebrief();
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none relative font-sans">
      {/* Hidden elements for video frame capture */}
      <video ref={videoFeedRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* Floating Emojis */}
      <FloatingReactions reactions={reactions} />

      {/* Top Meeting Bar */}
      <header className="h-14 px-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-600/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {config.company || "Google Cloud"} • {config.role}
            </h1>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Radio className="w-3 h-3 animate-pulse" /> Full Duplex Active
              </span>
              <span>•</span>
              <span>Host: {selectedProfile.name}</span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">
              Turns: <span className="text-white font-bold">{analytics.turnCount}</span>
            </span>
          </div>

          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              } else {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="flex-1 flex overflow-hidden p-3 sm:p-4 gap-3 relative">
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Active Conduct Warning Banner Alert */}
          {activeWarningBanner && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 max-w-xl w-full px-4 animate-bounce">
              <div className="p-3.5 rounded-2xl bg-rose-950/95 border-2 border-rose-500 shadow-2xl backdrop-blur-md flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center font-bold text-sm shadow-md">
                    ⚠️
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-200 uppercase tracking-wider">
                      Conduct Warning #{activeWarningBanner.count} {activeWarningBanner.isFinal ? "(Final Warning)" : ""}
                    </div>
                    <div className="text-xs text-white font-medium">
                      {activeWarningBanner.reason}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveWarningBanner(null)}
                  className="text-xs text-rose-300 hover:text-white px-2 py-1 rounded-lg bg-rose-900/60"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Layout 1: Split Video View */}
          {activeLayout === "split" && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 h-full">
              <InterviewerTile
                profile={selectedProfile}
                isAiSpeaking={isAiSpeaking}
                aiVolume={aiVolume}
                isConnecting={isConnecting}
                isInterrupted={isInterrupted}
              />
              <CandidateTile
                stream={screenStream || userStream || activeStreamRef.current}
                candidateName={config.candidateName}
                isMuted={isMuted}
                isVideoOff={isVideoOff && !isScreenSharing}
                userVolume={userVolume}
                onToggleMic={onToggleMic}
                onToggleVideo={onToggleVideo}
              />
            </div>
          )}

          {/* Layout 2: Code Editor Split */}
          {activeLayout === "code_split" && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 h-full">
              <div className="lg:col-span-4 flex flex-col gap-3 h-full">
                <div className="flex-1 min-h-0">
                  <InterviewerTile
                    profile={selectedProfile}
                    isAiSpeaking={isAiSpeaking}
                    aiVolume={aiVolume}
                    isConnecting={isConnecting}
                    isInterrupted={isInterrupted}
                  />
                </div>
                <div className="h-44 sm:h-48">
                  <CandidateTile
                    stream={screenStream || userStream || activeStreamRef.current}
                    candidateName={config.candidateName}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff && !isScreenSharing}
                    userVolume={userVolume}
                    onToggleMic={onToggleMic}
                    onToggleVideo={onToggleVideo}
                  />
                </div>
              </div>
              <div className="lg:col-span-8 h-full">
                <CodeEditorPanel
                  initialCode={codingChallenge?.starter_code}
                  problemPrompt={codingChallenge?.problem_description}
                  onSyncCodeWithAi={handleSyncCodeWithAi}
                  onCodeChange={(c) => setLastCodeSnippet(c)}
                />
              </div>
            </div>
          )}

          {/* Layout 3: Whiteboard Split */}
          {activeLayout === "whiteboard_split" && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 h-full">
              <div className="lg:col-span-4 flex flex-col gap-3 h-full">
                <div className="flex-1 min-h-0">
                  <InterviewerTile
                    profile={selectedProfile}
                    isAiSpeaking={isAiSpeaking}
                    aiVolume={aiVolume}
                    isConnecting={isConnecting}
                    isInterrupted={isInterrupted}
                  />
                </div>
                <div className="h-44 sm:h-48">
                  <CandidateTile
                    stream={screenStream || userStream || activeStreamRef.current}
                    candidateName={config.candidateName}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff && !isScreenSharing}
                    userVolume={userVolume}
                    onToggleMic={onToggleMic}
                    onToggleVideo={onToggleVideo}
                  />
                </div>
              </div>
              <div className="lg:col-span-8 h-full">
                <WhiteboardPanel
                  diagramData={whiteboardElements}
                  onSyncWhiteboardWithAi={handleSyncWhiteboardWithAi}
                />
              </div>
            </div>
          )}

          {/* Live Closed Captions */}
          <CaptionsOverlay
            isVisible={captionsEnabled}
            speaker={currentCaption.speaker}
            speakerName={currentCaption.speakerName}
            text={currentCaption.text}
          />
        </div>

        {/* Right Drawer */}
        {activeSideTab && (
          <SidePanel
            activeTab={activeSideTab}
            interviewerProfile={selectedProfile}
            candidateName={config.candidateName}
            chatMessages={chatMessages}
            rubricStages={rubricStages}
            analytics={analytics}
            isAiSpeaking={isAiSpeaking}
            userVolume={userVolume}
            conductWarnings={conductWarnings}
            interviewerObservations={interviewerObservations}
            companyContext={config.companyContext}
            candidateResume={config.candidateResume}
            onSendMessage={handleSendMessage}
            onClose={() => setActiveSideTab(null)}
          />
        )}
      </main>

      {/* Bottom Floating Meeting Controls */}
      <MeetingControls
        isMuted={isMuted}
        isVideoOff={isVideoOff && !isScreenSharing}
        isScreenSharing={isScreenSharing}
        captionsEnabled={captionsEnabled}
        activeLayout={activeLayout}
        activeSideTab={activeSideTab}
        isHandRaised={isHandRaised}
        onToggleMic={onToggleMic}
        onToggleVideo={onToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleCaptions={() => setCaptionsEnabled(!captionsEnabled)}
        onToggleHandRaise={() => {
          setIsHandRaised(!isHandRaised);
          if (!isHandRaised) {
            handleTriggerReaction("✋");
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(
                JSON.stringify({
                  type: "text",
                  data: "Candidate raised their hand to ask a question or clarify.",
                })
              );
            }
          }
        }}
        onSelectLayout={(layout) => setActiveLayout(layout)}
        onToggleSideTab={(tab) => setActiveSideTab(activeSideTab === tab ? null : tab)}
        onTriggerReaction={handleTriggerReaction}
        onEndCall={handleEndCall}
      />

      {/* Post-Interview Debrief Modal */}
      {showDebrief && (
        <InterviewDebriefModal
          isOpen={showDebrief}
          debrief={debriefData}
          onClose={() => {
            setShowDebrief(false);
            if (onLeaveMeeting) onLeaveMeeting();
          }}
          onRetake={() => {
            setShowDebrief(false);
            if (onLeaveMeeting) onLeaveMeeting();
          }}
        />
      )}
    </div>
  );
}
