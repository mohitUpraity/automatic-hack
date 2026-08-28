import { useState, useEffect, useRef, useCallback } from "react";
import { AudioStreamingManager } from "../components/interview/AudioStreamingManager";

export function useGeminiLive(options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [currentCaption, setCurrentCaption] = useState("");

  const socketRef = useRef(null);
  const audioManagerRef = useRef(null);
  const userStreamRef = useRef(null);
  const videoIntervalRef = useRef(null);

  const startSession = useCallback(async () => {
    try {
      // 1. Get user microphone & camera
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: { width: { ideal: 640 }, height: { ideal: 360 } },
      });
      userStreamRef.current = stream;

      // 2. Initialize Audio Manager
      const audioManager = new AudioStreamingManager();
      audioManagerRef.current = audioManager;

      audioManager.setOnVolumeChange((inVol, outVol) => {
        setUserVolume(inVol);
        setAiVolume(outVol);
        setIsAiSpeaking(outVol > 0.04);
      });

      // 3. Connect to WebSocket (supports local port 3000 bridge or port 8000 fallback)
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const targetWsUrl =
        window.location.port === "5173"
          ? `${protocol}//${window.location.hostname}:3000/api/live`
          : `${protocol}//${window.location.host}/api/live`;

      const ws = new WebSocket(targetWsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "setup",
            voice: options.voice || "Zephyr",
            systemInstruction: options.systemInstruction,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "ready") {
            setIsConnected(true);
          } else if (msg.type === "audio") {
            audioManager.playAudioChunk(msg.data);
          } else if (msg.type === "output_transcript") {
            setCurrentCaption(msg.text);
            setTranscript((prev) => [...prev, { speaker: "ai", text: msg.text }]);
          } else if (msg.type === "input_transcript") {
            setCurrentCaption(msg.text);
            setTranscript((prev) => [...prev, { speaker: "user", text: msg.text }]);
          } else if (msg.type === "interrupted") {
            audioManager.stopPlayback();
            setIsAiSpeaking(false);
          }
        } catch (e) {
          console.error("useGeminiLive parse error:", e);
        }
      };

      ws.onerror = (err) => {
        console.warn("useGeminiLive WebSocket error:", err);
      };

      // 4. Forward mic chunks to WebSocket
      audioManager.setOnAudioChunk((base64Pcm) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "audio", data: base64Pcm }));
        }
      });

      await audioManager.startAudioCapture(stream);

      // 5. Video frame loop (~1 FPS)
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext("2d");

      videoIntervalRef.current = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const video = options.videoElement;
        if (video && video.readyState >= 2 && ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          const base64Jpeg = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
          ws.send(JSON.stringify({ type: "video", data: base64Jpeg }));
        }
      }, 1200);

      return stream;
    } catch (err) {
      console.error("Failed to start Gemini Live session:", err);
      throw err;
    }
  }, [options.voice, options.systemInstruction, options.videoElement]);

  const toggleMute = useCallback(() => {
    if (userStreamRef.current) {
      userStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => {
        const next = !prev;
        audioManagerRef.current?.setMute(next);
        return next;
      });
    }
  }, []);

  const stopSession = useCallback(() => {
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    audioManagerRef.current?.cleanup();
    socketRef.current?.close();
    userStreamRef.current?.getTracks().forEach((t) => t.stop());
    setIsConnected(false);
    setIsAiSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    isConnected,
    isAiSpeaking,
    isMuted,
    userVolume,
    aiVolume,
    transcript,
    currentCaption,
    startSession,
    stopSession,
    toggleMute,
  };
}
