import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Upload,
  FileText,
  Building2,
  Briefcase,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Volume2,
  Cpu,
  Layers,
  Flame,
  Bot
} from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import { uploadInterviewResume, initInterviewSession } from '../../api/client';

export default function InterviewSetupModal({
  isOpen,
  onClose,
  opportunity,
  candidateName = 'Mohit Upraity',
  candidateId = 'candidate_mohit',
  onStartInterview,
}) {
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('Aoede');
  const [uploadedResume, setUploadedResume] = useState(null);
  const [uploadedResumeText, setUploadedResumeText] = useState('');
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [micVolume, setMicVolume] = useState(0);

  const videoPreviewRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  const company = opportunity?.company || opportunity?.company_name || 'Technology Enterprise';
  const role = opportunity?.title || opportunity?.opportunity_title || 'Senior Software Engineer';

  // Request camera and microphone for preview
  useEffect(() => {
    let stream = null;
    let isMounted = true;

    async function setupPreview() {
      if (!isOpen) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });
        if (!isMounted) return;
        mediaStreamRef.current = stream;

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }

        // Setup audio visualizer meter
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!isMounted) return;
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
          setMicVolume(Math.min(100, Math.round(avg * 2)));
          animFrameRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();

      } catch (err) {
        console.warn('[Camera/Mic Access Notice]', err);
      }
    }

    if (isOpen) {
      setupPreview();
    }

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
      }
    }
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micEnabled;
        setMicEnabled(!micEnabled);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingResume(true);
    try {
      const res = await uploadInterviewResume(file);
      setUploadedResume(file.name);
      setUploadedResumeText(res.text || '');
    } catch (err) {
      console.error(err);
      // Fallback plain read
      setUploadedResume(file.name);
      const txt = await file.text().catch(() => 'Uploaded candidate resume.');
      setUploadedResumeText(txt);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleLaunch = async () => {
    setIsInitializing(true);
    try {
      const sessionConfig = {
        candidate_id: candidateId,
        candidate_name: candidateName,
        opportunity_id: opportunity?.id,
        company_name: company,
        job_title: role,
        job_description: opportunity?.description || opportunity?.raw_jd || '',
        uploaded_resume_text: uploadedResumeText || '',
        voice_name: selectedVoice,
        target_role_level: 'Senior'
      };

      await initInterviewSession(sessionConfig);
      
      // Stop preview tracks before passing control to interview room
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      onClose();
      onStartInterview({
        ...sessionConfig,
        micEnabled,
        videoEnabled,
        companyIntel: opportunity?.intelligence || opportunity?.company_intel || null
      });
    } catch (err) {
      console.error('Session init error:', err);
      // Still proceed
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      onClose();
      onStartInterview({
        candidate_id: candidateId,
        candidate_name: candidateName,
        opportunity_id: opportunity?.id,
        company_name: company,
        job_title: role,
        uploaded_resume_text: uploadedResumeText,
        voice_name: selectedVoice,
        micEnabled,
        videoEnabled
      });
    } finally {
      setIsInitializing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Live AI Interview Room Lobby</h2>
                <Badge variant="cyan">Gemini Live Multimodal</Badge>
              </div>
              <p className="text-xs text-slate-400">
                Setup your camera, microphone, and submitted resume before entering.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Video & Audio Preview */}
            <div className="space-y-4">
              <div className="relative aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
                {videoEnabled ? (
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <VideoOff className="w-10 h-10" />
                    <span className="text-xs font-semibold">Camera is Turned Off</span>
                  </div>
                )}

                {/* Live Mic Meter Bar */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60">
                  {micEnabled ? (
                    <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <MicOff className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-75"
                      style={{ width: `${micEnabled ? micVolume : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 w-8 text-right">
                    {micEnabled ? `${micVolume}%` : 'MUTED'}
                  </span>
                </div>
              </div>

              {/* AV Toggles */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                    micEnabled
                      ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                      : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {micEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                  {micEnabled ? 'Mute Mic' : 'Unmute Mic'}
                </button>
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                    videoEnabled
                      ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                      : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {videoEnabled ? <Video className="w-4 h-4 text-cyan-400" /> : <VideoOff className="w-4 h-4" />}
                  {videoEnabled ? 'Turn Off Cam' : 'Turn On Cam'}
                </button>
              </div>
            </div>

            {/* Right: Target Role & Resume Submission Card */}
            <div className="space-y-4 flex flex-col justify-between">
              
              {/* Opportunity Target Card */}
              <div className="p-4 bg-slate-950/60 border border-cyan-500/30 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Target Role & Company</span>
                  <Badge variant="purple">AI Bar-Raiser</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-cyan-300 text-sm">
                    {company.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white leading-tight">{role}</h3>
                    <p className="text-xs text-slate-400 font-medium">{company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dr. Elena Vance (Lead Engineering Bar-Raiser)</span>
                </div>
              </div>

              {/* Specific Resume Selection / Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Interview Resume (Required)
                  </label>
                  <span className="text-[10px] text-slate-400">Evaluator strictly evaluates this</span>
                </div>

                <div className="relative border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-2xl p-3.5 text-center transition-all bg-slate-950/40">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {isUploadingResume ? (
                    <LoadingSpinner size="sm" text="Parsing candidate resume..." />
                  ) : uploadedResume ? (
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{uploadedResume}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-300">
                        Upload custom PDF/DOCX or click to browse
                      </span>
                      <span className="text-[10px] text-slate-500">Defaults to master candidate resume if omitted</span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Voice Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  Interviewer Persona Voice
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Aoede', name: 'Aoede', desc: 'Bar-Raiser (Female)' },
                    { id: 'Puck', name: 'Puck', desc: 'Technical (Male)' },
                    { id: 'Kore', name: 'Kore', desc: 'Executive (Female)' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVoice(v.id)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        selectedVoice === v.id
                          ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{v.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>ArmorIQ Multi-Agent Governed Session</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isInitializing}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isInitializing ? (
                <LoadingSpinner size="sm" text="Initializing Grounded Session..." />
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Join Live Interview Room
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
