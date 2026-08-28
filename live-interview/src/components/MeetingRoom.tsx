import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  InterviewConfig,
  ChatMessage,
  TranscriptItem,
  MeetingLayout,
  RubricStage,
  LiveAnalytics,
  EvaluationReport,
} from "../types";
import { INITIAL_RUBRIC_STAGES } from "../data/interviewProfiles";
import { AudioStreamingManager } from "../utils/audio";
import { InterviewerTile } from "./InterviewerTile";
import { UserTile } from "./UserTile";
import { CodeEditor } from "./CodeEditor";
import { Whiteboard } from "./Whiteboard";
import { MeetingControls } from "./MeetingControls";
import { SidePanel } from "./SidePanel";
import { CaptionsOverlay } from "./CaptionsOverlay";
import { FloatingReactions, FloatingReactionItem } from "./FloatingReactions";
import { EvaluationModal } from "./EvaluationModal";
import { Sparkles, Radio, Maximize2, Minimize2 } from "lucide-react";

interface MeetingRoomProps {
  config: InterviewConfig;
  userStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onLeaveMeeting: () => void;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({
  config,
  userStream,
  isMuted,
  isVideoOff,
  onToggleMic,
  onToggleVideo,
  onLeaveMeeting,
}) => {
  const [activeLayout, setActiveLayout] = useState<MeetingLayout>("split");
  const [activeSideTab, setActiveSideTab] = useState<"people" | "chat" | "rubric" | "notes" | null>(null);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Live Speech & Audio states
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [aiVolume, setAiVolume] = useState(0);
  const [userVolume, setUserVolume] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [currentCaption, setCurrentCaption] = useState<{
    speaker: "ai" | "user" | "none";
    speakerName: string;
    text: string;
  }>({
    speaker: "none",
    speakerName: "",
    text: "",
  });

  // Data collections
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [rubricStages, setRubricStages] = useState<RubricStage[]>(INITIAL_RUBRIC_STAGES);
  const [reactions, setReactions] = useState<FloatingReactionItem[]>([]);
  const [analytics, setAnalytics] = useState<LiveAnalytics>({
    userSpeakingSeconds: 0,
    aiSpeakingSeconds: 0,
    interruptionCount: 0,
    turnCount: 0,
    paceWpm: 130,
  });

  // Post-Interview Evaluation Modal
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<EvaluationReport | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastCodeWritten, setLastCodeWritten] = useState<string>("");

  // Refs
  const audioManagerRef = useRef<AudioStreamingManager | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoFeedRef = useRef<HTMLVideoElement | null>(null);

  // Initialize Audio & WebSocket Connection
  useEffect(() => {
    const audioManager = new AudioStreamingManager();
    audioManagerRef.current = audioManager;

    audioManager.setOnVolumeChange((inVol, outVol) => {
      setUserVolume(inVol);
      setAiVolume(outVol);
      setIsAiSpeaking(outVol > 0.04);
    });

    // Determine WS protocol
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/live`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected to /api/live");
      // Send Setup packet to Gemini Live API
      ws.send(
        JSON.stringify({
          type: "setup",
          role: config.role,
          seniority: config.seniority,
          voice: config.interviewerProfile.voice,
          candidateName: config.candidateName,
          interviewType: config.format,
          customContext: `Candidate Resume: ${config.resumeText}\nJob Description: ${config.jobDescription}`,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "ready") {
          setIsConnecting(false);
        } else if (msg.type === "audio") {
          // Play 24kHz audio chunk from Gemini Live
          audioManager.playAudioChunk(msg.data);
          setIsInterrupted(false);
        } else if (msg.type === "output_transcript") {
          // Closed captions for AI
          setCurrentCaption({
            speaker: "ai",
            speakerName: config.interviewerProfile.name,
            text: msg.text,
          });
          // Append to transcripts
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
                speakerName: config.interviewerProfile.name,
                text: msg.text,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                isFinal: false,
              },
            ];
          });
        } else if (msg.type === "input_transcript") {
          // Closed captions for User
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
          // Candidate interrupted the AI
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
        }
      } catch (err) {
        console.error("Error processing WS message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("Live WebSocket error:", err);
      setIsConnecting(false);
    };

    // Forward mic audio PCM to WebSocket
    audioManager.setOnAudioChunk((base64Pcm) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "audio", data: base64Pcm }));
      }
    });

    // Start Audio Capture with user's stream
    if (userStream) {
      audioManager.startAudioCapture(userStream);
    }

    // Video Streaming Frame Loop (~1 FPS)
    frameIntervalRef.current = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const canvas = hiddenCanvasRef.current;
      const activeVideo = videoFeedRef.current;

      if (canvas && activeVideo && activeVideo.readyState >= 2 && !isVideoOff) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = 320;
          canvas.height = 180;
          ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          const base64Jpeg = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
          ws.send(JSON.stringify({ type: "video", data: base64Jpeg }));
        }
      }
    }, 1200);

    // Live analytics timer
    const analyticsTimer = setInterval(() => {
      setAnalytics((prev) => ({
        ...prev,
        userSpeakingSeconds: prev.userSpeakingSeconds + (userVolume > 0.05 && !isMuted ? 1 : 0),
        aiSpeakingSeconds: prev.aiSpeakingSeconds + (isAiSpeaking ? 1 : 0),
      }));
    }, 1000);

    return () => {
      clearInterval(analyticsTimer);
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      audioManager.cleanup();
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [config]);

  // Update mute state in Audio Manager
  useEffect(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.setMute(isMuted);
    }
  }, [isMuted]);

  // Update video element feed source
  useEffect(() => {
    if (videoFeedRef.current) {
      videoFeedRef.current.srcObject = screenStream || userStream;
    }
  }, [userStream, screenStream, isVideoOff]);

  // Screen share handling
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
      }
    }
  };

  // Reactions trigger
  const handleTriggerReaction = (emoji: string) => {
    const newReaction: FloatingReactionItem = {
      id: `react-${Date.now()}-${Math.random()}`,
      emoji,
      leftPercent: 30 + Math.random() * 40,
    };
    setReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2500);
  };

  // Chat message send
  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      senderName: config.candidateName || "You",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, newMsg]);

    // Send to Gemini Live session
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "text",
          data: `Candidate shared message in chat: "${text}"`,
        })
      );
    }
  };

  // Sync Code IDE with AI
  const handleSyncCodeWithAi = (code: string, language: string) => {
    setLastCodeWritten(code);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "text",
          data: `[Candidate Code in ${language} IDE]:\n\`\`\`${language}\n${code}\n\`\`\`\nPlease examine the candidate's code, give interactive feedback or ask them about their design choices.`,
        })
      );
    }
    handleTriggerReaction("💻");
  };

  // Sync Whiteboard with AI
  const handleSyncWhiteboardWithAi = (base64Jpeg: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "video",
          data: base64Jpeg,
        })
      );
      socketRef.current.send(
        JSON.stringify({
          type: "text",
          data: "Candidate updated their System Design Whiteboard architecture diagram. Please review the diagram they drew on their screen.",
        })
      );
    }
    handleTriggerReaction("🎨");
  };

  // End Call & Trigger Comprehensive Evaluation
  const handleEndCall = async () => {
    setShowEvaluation(true);
    setIsEvaluating(true);

    if (audioManagerRef.current) {
      audioManagerRef.current.stopPlayback();
    }

    try {
      const res = await fetch("/api/evaluate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcripts,
          role: config.role,
          seniority: config.seniority,
          format: config.format,
          codeSnippet: lastCodeWritten,
          notes: chatMessages.map((m) => `${m.senderName}: ${m.text}`).join("\n"),
        }),
      });
      const data = await res.json();
      setEvaluationReport(data);
    } catch (err) {
      console.error("Evaluation request failed:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#202124] text-[#e8eaed] flex flex-col overflow-hidden select-none relative">
      {/* Hidden video & canvas for frame grabbing */}
      <video ref={videoFeedRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* Floating Emojis Overlay */}
      <FloatingReactions reactions={reactions} />

      {/* Top Header Meeting Bar */}
      <header className="h-14 px-4 sm:px-6 bg-[#202124] border-b border-[#3c4043]/50 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
              {config.role} • {config.format}
            </h1>
            <div className="flex items-center space-x-2 text-[11px] text-gray-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <Radio className="w-3 h-3 animate-pulse" /> Full Duplex Active
              </span>
              <span>•</span>
              <span>Interviewer: {config.interviewerProfile.name}</span>
            </div>
          </div>
        </div>

        {/* Top Right Controls & Hand Raise Indicator */}
        <div className="flex items-center space-x-2">
          {isHandRaised && (
            <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 animate-bounce">
              <span>✋</span> Hand Raised
            </div>
          )}

          <div className="hidden md:flex items-center space-x-1.5 bg-[#2d2f34] px-3 py-1 rounded-full border border-[#3c4043] text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono">REC Live</span>
          </div>
        </div>
      </header>

      {/* Center Stage Layout */}
      <main className="flex-1 flex overflow-hidden p-3 sm:p-4 gap-3 sm:gap-4 relative">
        {/* Dynamic Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          {/* Layout 1: Normal Video Grid (Split) */}
          {activeLayout === "split" && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 h-full">
              {/* Interviewer Tile */}
              <InterviewerTile
                profile={config.interviewerProfile}
                isAiSpeaking={isAiSpeaking}
                aiVolume={aiVolume}
                isConnecting={isConnecting}
                isInterrupted={isInterrupted}
              />

              {/* Candidate Tile */}
              <UserTile
                stream={screenStream || userStream}
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
              {/* Video Tiles Stack (Left) */}
              <div className="lg:col-span-4 flex flex-col gap-3 h-full">
                <div className="flex-1 min-h-0">
                  <InterviewerTile
                    profile={config.interviewerProfile}
                    isAiSpeaking={isAiSpeaking}
                    aiVolume={aiVolume}
                    isConnecting={isConnecting}
                    isInterrupted={isInterrupted}
                  />
                </div>
                <div className="h-44 sm:h-52">
                  <UserTile
                    stream={screenStream || userStream}
                    candidateName={config.candidateName}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff && !isScreenSharing}
                    userVolume={userVolume}
                    onToggleMic={onToggleMic}
                    onToggleVideo={onToggleVideo}
                  />
                </div>
              </div>

              {/* Code Editor (Right) */}
              <div className="lg:col-span-8 h-full">
                <CodeEditor onSyncCodeWithAi={handleSyncCodeWithAi} />
              </div>
            </div>
          )}

          {/* Layout 3: Whiteboard Split */}
          {activeLayout === "whiteboard_split" && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 h-full">
              {/* Video Tiles Stack (Left) */}
              <div className="lg:col-span-4 flex flex-col gap-3 h-full">
                <div className="flex-1 min-h-0">
                  <InterviewerTile
                    profile={config.interviewerProfile}
                    isAiSpeaking={isAiSpeaking}
                    aiVolume={aiVolume}
                    isConnecting={isConnecting}
                    isInterrupted={isInterrupted}
                  />
                </div>
                <div className="h-44 sm:h-52">
                  <UserTile
                    stream={screenStream || userStream}
                    candidateName={config.candidateName}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff && !isScreenSharing}
                    userVolume={userVolume}
                    onToggleMic={onToggleMic}
                    onToggleVideo={onToggleVideo}
                  />
                </div>
              </div>

              {/* System Design Whiteboard (Right) */}
              <div className="lg:col-span-8 h-full">
                <Whiteboard onSyncWhiteboardWithAi={handleSyncWhiteboardWithAi} />
              </div>
            </div>
          )}

          {/* Real-time Closed Captions Overlay */}
          <CaptionsOverlay
            isVisible={captionsEnabled}
            speaker={currentCaption.speaker}
            speakerName={currentCaption.speakerName}
            text={currentCaption.text}
          />
        </div>

        {/* Right Side Drawer */}
        {activeSideTab && (
          <SidePanel
            activeTab={activeSideTab}
            interviewerProfile={config.interviewerProfile}
            candidateName={config.candidateName}
            chatMessages={chatMessages}
            rubricStages={rubricStages}
            analytics={analytics}
            isAiSpeaking={isAiSpeaking}
            userVolume={userVolume}
            onSendMessage={handleSendMessage}
            onClose={() => setActiveSideTab(null)}
          />
        )}
      </main>

      {/* Bottom Floating Control Bar */}
      <MeetingControls
        isMuted={isMuted}
        isVideoOff={isVideoOff && !isScreenSharing}
        isScreenSharing={isScreenSharing}
        captionsEnabled={captionsEnabled}
        activeLayout={activeLayout}
        activeSideTab={activeSideTab}
        isHandRaised={isHandRaised}
        userVolume={userVolume}
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
                  data: "Candidate raised their hand to ask a question or clarify something.",
                })
              );
            }
          }
        }}
        onSelectLayout={(layout) => setActiveLayout(layout)}
        onToggleSideTab={(tab) =>
          setActiveSideTab(activeSideTab === tab ? null : tab)
        }
        onTriggerReaction={handleTriggerReaction}
        onEndCall={handleEndCall}
      />

      {/* Post-Interview Evaluation Modal */}
      {showEvaluation && (
        <EvaluationModal
          report={evaluationReport}
          isLoading={isEvaluating}
          onRetake={() => {
            setShowEvaluation(false);
            onLeaveMeeting();
          }}
          onClose={() => {
            setShowEvaluation(false);
            onLeaveMeeting();
          }}
        />
      )}
    </div>
  );
};
