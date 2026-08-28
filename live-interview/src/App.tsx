import React, { useState, useEffect, useRef } from "react";
import { InterviewConfig } from "./types";
import { Lobby } from "./components/Lobby";
import { MeetingRoom } from "./components/MeetingRoom";

export default function App() {
  const [meetingConfig, setMeetingConfig] = useState<InterviewConfig | null>(null);
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [userVolume, setUserVolume] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Request initial MediaStream (audio + video) in Lobby
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setUserStream(stream);

        // Simple volume monitor for Lobby
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const monitor = () => {
          if (analyserRef.current) {
            const data = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += data[i];
            const avg = sum / data.length / 255;
            setUserVolume(avg);
          }
          animFrameRef.current = requestAnimationFrame(monitor);
        };
        animFrameRef.current = requestAnimationFrame(monitor);
      } catch (err) {
        console.warn("Could not access camera/mic:", err);
        // Try audio only if camera is blocked
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          if (active) {
            setUserStream(audioOnlyStream);
            setIsVideoOff(true);
          }
        } catch (e) {
          console.warn("Microphone also blocked or unavailable:", e);
        }
      }
    }

    initMedia();

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleToggleMic = () => {
    if (userStream) {
      userStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const handleToggleVideo = () => {
    if (userStream) {
      userStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    } else {
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleJoinMeeting = (config: InterviewConfig) => {
    setMeetingConfig(config);
  };

  const handleLeaveMeeting = () => {
    setMeetingConfig(null);
  };

  return (
    <div className="w-full h-screen bg-[#202124] text-[#e8eaed] overflow-hidden">
      {!meetingConfig ? (
        <Lobby
          onJoinMeeting={handleJoinMeeting}
          stream={userStream}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          userVolume={userVolume}
          onToggleMic={handleToggleMic}
          onToggleVideo={handleToggleVideo}
        />
      ) : (
        <MeetingRoom
          config={meetingConfig}
          userStream={userStream}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onToggleMic={handleToggleMic}
          onToggleVideo={handleToggleVideo}
          onLeaveMeeting={handleLeaveMeeting}
        />
      )}
    </div>
  );
}
