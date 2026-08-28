import { useState, useEffect, useRef, useCallback } from "react";
import { AudioStreamingManager } from "../utils/audio";

export interface UseGeminiLiveOptions {
  voice?: "Zephyr" | "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede";
  systemInstruction?: string;
  videoElement?: HTMLVideoElement | null;
}

export function useGeminiLive(options: UseGeminiLiveOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);
  const [transcript, setTranscript] = useState<{ speaker: "ai" | "user"; text: string }[]>([]);
  const [currentCaption, setCurrentCaption] = useState<string>("");

  const socketRef = useRef<WebSocket | null>(null);
  const audioManagerRef = useRef<AudioStreamingManager | null>(null);
  const userStreamRef = useRef<MediaStream | null>(null);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

      // 3. Connect to WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/live`);
      socketRef.current = ws;

      ws.onopen = () => {
        // Send setup packet
        ws.send(
          JSON.stringify({
            type: "setup",
            voice: options.voice || "Zephyr",
            systemInstruction: options.systemInstruction,
          })
        );
      };

      ws.onmessage = (event) => {
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
