import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Upload,
  Link as LinkIcon,
  FileText,
  User,
  ArrowRight,
  Briefcase,
  Trophy,
  Compass,
  FileCheck,
  Terminal,
  ShieldCheck,
  Download,
  ExternalLink,
  Cpu,
  Search,
} from 'lucide-react';
import {
  createAutoPilotWebSocket,
  fetchProfiles,
  fetchDocuments,
  downloadResumePdf,
} from '../../api/client';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';

const SAMPLE_RESUME_TEXT = `# Alex Mercer
Senior Full-Stack & AI Systems Engineer | San Francisco, CA | alex.mercer@email.com | (555) 234-5678

## Professional Summary
High-impact Full-Stack and AI Systems Engineer with 4+ years of experience architecting distributed cloud platforms, multi-agent AI pipelines, and responsive React web applications. Scaled microservices to 500k+ users and reduced query latency by 45%.

## Core Skills
- Languages: TypeScript, JavaScript, Python, Go, SQL
- Frameworks: React, Next.js, FastAPI, Node.js, Tailwind CSS, PyTorch
- Databases: PostgreSQL, SQLite, pgvector, Redis, Supabase
- AI & Cloud: LLM Agents, RAG pipelines, Docker, AWS (Lambda, ECS, S3)

## Experience
- Senior Software Engineer at CloudScale Technologies (2023 - Present)
  - Engineered high-throughput multi-agent orchestration pipeline processing 2.5M daily events.
  - Optimized vector search retrieval latency by 38% through hybrid search ranking.
- Software Engineer at DataVibe AI (2021 - 2022)
  - Built real-time collaborative workspace using WebSockets.
  - Implemented automated resume parsing and ATS evaluation pipeline.

## Education
B.S. Computer Science, University of California, Berkeley (GPA: 3.85/4.0)
`;

const AGENT_STAGES = [
  { id: 1, name: 'Ingestion & OCR', agent: 'document_processor', desc: 'Docling OCR parsing & 768-dim vector embeddings' },
  { id: 2, name: 'Resume Extraction', agent: 'resume_extractor', desc: 'Parsing candidate skills, experience, and contact' },
  { id: 3, name: 'Skill & Trajectory Analysis', agent: 'resume_analyzer', desc: 'Analyzing strengths, gaps, and domain focus' },
  { id: 4, name: 'Candidate Profiler', agent: 'profile_maker', desc: 'Synthesizing multi-domain search strategies' },
  { id: 5, name: 'Live Opportunity Scouting', agent: 'opportunity_scout', desc: 'Scouting live web & Firecrawl MCP across Jobs & Hackathons' },
  { id: 6, name: 'AI Fit & ATS Ranking', agent: 'opportunity_ranker', desc: 'Scoring 0-100% relevance & evaluating keywords' },
  { id: 7, name: 'Autonomous Resume Tailoring', agent: 'resume_tailor', desc: 'Generating tailored ATS resumes & PDFs' },
];

export default function AutoPilotModal({ isOpen, onClose, onComplete, initialProfileId = null }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('profile'); // 'profile', 'text', 'file', 'url'
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(initialProfileId || '');
  const [textInput, setTextInput] = useState(SAMPLE_RESUME_TEXT);
  const [urlInput, setUrlInput] = useState('');
  const [file, setFile] = useState(null);

  const [categories, setCategories] = useState(['job', 'internship', 'competition', 'hackathon']);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [liveLogs, setLiveLogs] = useState([]);
  const [discoveredItems, setDiscoveredItems] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const terminalBottomRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    async function checkExistingData() {
      try {
        const profRes = await fetchProfiles();
        const profs = profRes.profiles || [];
        setAvailableProfiles(profs);

        if (profs.length > 0) {
          setSelectedProfileId(initialProfileId || profs[0].id);
          setMode('profile');
        } else {
          const docsRes = await fetchDocuments();
          const resumes = (docsRes.documents || []).filter((d) => d.doc_type === 'resume');
          if (resumes.length > 0 && resumes[0].raw_markdown) {
            setTextInput(resumes[0].raw_markdown);
            setMode('text');
          } else {
            setTextInput(SAMPLE_RESUME_TEXT);
            setMode('text');
          }
        }
      } catch (err) {
        console.error('Failed to check profiles:', err);
        setMode('text');
      }
    }

    checkExistingData();
  }, [isOpen, initialProfileId]);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveLogs, discoveredItems]);

  // Cleanup WebSocket on unmount or close
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  if (!isOpen) return null;

  const toggleCategory = (cat) => {
    if (categories.includes(cat)) {
      if (categories.length > 1) {
        setCategories(categories.filter((c) => c !== cat));
      }
    } else {
      setCategories([...categories, cat]);
    }
  };

  const addLog = (agent, message, status = 'info') => {
    const timeStr = new Date().toLocaleTimeString();
    setLiveLogs((prev) => [...prev, { time: timeStr, agent, message, status }]);
  };

  const handleStartAutoPilot = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    setLiveLogs([]);
    setDiscoveredItems([]);
    setCurrentStage(1);

    addLog('system', 'Establishing secure WebSocket handshake to Career Auto-Pilot Engine...', 'info');

    try {
      let inputType = 'profile_id';
      let inputValue = selectedProfileId || initialProfileId || '';

      if (mode === 'file' && file) {
        // Read as Base64 for real-time Docling streaming
        inputType = 'file_base64';
        inputValue = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else if (mode === 'text') {
        inputType = 'text';
        inputValue = textInput.trim() || SAMPLE_RESUME_TEXT;
      } else if (mode === 'url') {
        if (!urlInput.trim()) {
          throw new Error('Please enter a target URL or portfolio.');
        }
        inputType = 'url';
        inputValue = urlInput.trim();
      } else if (mode === 'profile') {
        inputType = 'profile_id';
        inputValue = selectedProfileId || (availableProfiles[0] ? availableProfiles[0].id : '');
      }

      const sessionId = 'ap_' + Date.now();
      const ws = createAutoPilotWebSocket(sessionId);
      socketRef.current = ws;

      ws.onopen = () => {
        addLog('system', `WebSocket connection established [Session: ${sessionId}]`, 'success');
        addLog('system', `Initiating 7-stage multi-agent orchestration across ${categories.join(', ')}...`, 'info');

        ws.send(
          JSON.stringify({
            user_id: 'default-user',
            input_type: inputType,
            input_value: inputValue,
            filename: file ? file.name : 'resume.pdf',
            categories: categories,
            profile_id: mode === 'profile' ? inputValue : null,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.stage) {
            setCurrentStage(msg.stage);
          }

          if (msg.status === 'item_discovered' && msg.item) {
            setDiscoveredItems((prev) => [msg.item, ...prev]);
            addLog(msg.agent || 'scout', msg.message || `Found opportunity: ${msg.item.title}`, 'item');
          } else if (msg.message) {
            addLog(msg.agent || 'agent', msg.message, msg.status || 'info');
          }

          if (msg.status === 'pipeline_complete') {
            setIsRunning(false);
            setResult(msg);
            addLog('system', 'Career Auto-Pilot completed successfully!', 'success');
            if (onComplete) onComplete(msg);
          } else if (msg.status === 'blocked') {
            setIsRunning(false);
            setError(`ArmorIQ Shield Blocked Request: ${msg.violation?.message || 'Unauthorized tool invocation'}`);
            addLog('armoriq_shield', `BLOCKED: ${msg.violation?.requested_tool}`, 'error');
          } else if (msg.status === 'error') {
            setIsRunning(false);
            setError(msg.message || 'Pipeline execution failed');
            addLog('system', `Error: ${msg.message}`, 'error');
          }
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error. Please ensure backend is running.');
        setIsRunning(false);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
      };
    } catch (err) {
      setError(err.message || 'Failed to start Auto-Pilot');
      setIsRunning(false);
    }
  };

  const handleDownloadPdf = async (pdfPath, title) => {
    try {
      await downloadResumePdf(pdfPath, null, `${title.replace(/\s+/g, '_')}_Resume.pdf`);
    } catch (err) {
      alert('Failed to download PDF: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <GlassCard className="w-full max-w-4xl max-h-[92vh] flex flex-col p-6 overflow-hidden border-indigo-500/40 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Autonomous Career Auto-Pilot
                </h2>
                <Badge variant="primary" size="sm">
                  REAL-TIME WEBSOCKET STREAM
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Autonomous multi-agent pipeline: Ingestion → Profiling → Live Scouting → ATS Ranking → PDF Tailoring
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {!isRunning && !result && (
            <>
              {/* Input Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Input Source
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setMode('profile')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      mode === 'profile'
                        ? 'bg-indigo-950/60 border-indigo-500/80 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <User className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Saved Profile</div>
                      <div className="text-[10px] text-slate-500">From database</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setMode('file')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      mode === 'file'
                        ? 'bg-indigo-950/60 border-indigo-500/80 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-violet-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Upload Resume</div>
                      <div className="text-[10px] text-slate-500">PDF or DOCX (Docling)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setMode('text')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      mode === 'text'
                        ? 'bg-indigo-950/60 border-indigo-500/80 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Paste Resume Text</div>
                      <div className="text-[10px] text-slate-500">Raw text / Markdown</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setMode('url')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      mode === 'url'
                        ? 'bg-indigo-950/60 border-indigo-500/80 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Scrape URL</div>
                      <div className="text-[10px] text-slate-500">LinkedIn / Portfolio</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mode Input Controls */}
              <div className="space-y-3">
                {mode === 'profile' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">
                      Choose Candidate Profile
                    </label>
                    {availableProfiles.length > 0 ? (
                      <select
                        value={selectedProfileId}
                        onChange={(e) => setSelectedProfileId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {availableProfiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            Profile #{p.id.slice(0, 8)} — {p.career_goals || 'Senior Engineer'} ({typeof p.tech_stack === 'string' ? p.tech_stack.slice(0, 40) : 'Full Stack'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                        <span>No saved profile found. Auto-Pilot will use the candidate sample profile.</span>
                        <button
                          onClick={() => setMode('text')}
                          className="underline hover:text-white font-semibold ml-2 shrink-0"
                        >
                          Switch to Text
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {mode === 'file' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">Upload PDF Resume</label>
                    <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-xl p-6 text-center transition-all bg-slate-900/40">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt,.md"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="hidden"
                        id="modal-resume-file"
                      />
                      <label htmlFor="modal-resume-file" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-indigo-400" />
                        <span className="text-xs font-semibold text-slate-200">
                          {file ? file.name : 'Click to browse or drop resume file here'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Supports PDF, DOCX, TXT, MD (Powered by Docling OCR & Gemini Embeddings)
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {mode === 'text' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300">
                        Paste Resume / Markdown Text
                      </label>
                      <button
                        onClick={() => setTextInput(SAMPLE_RESUME_TEXT)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Reset to Sample Resume
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste your full resume markdown or plain text..."
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {mode === 'url' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">
                      Target Profile / Portfolio / Job URL
                    </label>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://linkedin.com/in/... or https://portfolio.dev"
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Target Discovery Categories */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Target Opportunity Categories (Multi-Domain Scouting)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'job', label: 'Tech Jobs', icon: Briefcase, color: 'text-indigo-400' },
                    { id: 'internship', label: 'Internships', icon: Compass, color: 'text-cyan-400' },
                    { id: 'hackathon', label: 'Hackathons', icon: Zap, color: 'text-amber-400' },
                    { id: 'competition', label: 'AI Competitions', icon: Trophy, color: 'text-pink-400' },
                  ].map((cat) => {
                    const active = categories.includes(cat.id);
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                          active
                            ? 'bg-slate-900 text-white border-indigo-500/70 shadow-sm'
                            : 'bg-slate-950/40 text-slate-500 border-slate-900 opacity-60'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${active ? cat.color : 'text-slate-500'}`} />
                        <span>{cat.label}</span>
                        {active && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Real-time WebSocket Execution Live Dashboard */}
          {(isRunning || result) && (
            <div className="space-y-5 animate-fade-in">
              {/* Agent Pipeline Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400 animate-spin" />
                    Multi-Agent Pipeline Progression
                  </span>
                  <span className="font-mono text-indigo-400 font-bold">
                    Stage {currentStage} of {AGENT_STAGES.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {AGENT_STAGES.map((s) => {
                    const isDone = currentStage > s.id || result;
                    const isCurrent = currentStage === s.id && isRunning;
                    return (
                      <div
                        key={s.id}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isDone
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                            : isCurrent
                            ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400'
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : isCurrent ? (
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-700 text-[10px] flex items-center justify-center font-mono">
                              {s.id}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-bold truncate">{s.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono truncate">{s.agent}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Discovered Opportunities Stream */}
              {discoveredItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-amber-400" />
                      Live Discovered Listings ({discoveredItems.length})
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">Streaming over WebSocket</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {discoveredItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="shrink-0 w-64 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-2 animate-scale-in"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800/60 text-amber-300 font-mono">
                              {item.category}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                              {item.source}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white mt-1.5 line-clamp-1">{item.title}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Live Agent Terminal Console */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Live Sub-Agent Telemetry Stream
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">ArmorIQ Governance Active</span>
                </div>
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-3.5 font-mono text-xs max-h-52 overflow-y-auto space-y-1.5 shadow-inner">
                  {liveLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-600 text-[10px] shrink-0 font-mono">{log.time}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded shrink-0 font-bold ${
                          log.agent === 'armoriq_shield'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : log.agent === 'opportunity_scout'
                            ? 'bg-amber-950 text-amber-300'
                            : log.agent === 'resume_tailor'
                            ? 'bg-violet-950 text-violet-300'
                            : 'bg-indigo-950 text-indigo-300'
                        }`}
                      >
                        {log.agent}
                      </span>
                      <span
                        className={`${
                          log.status === 'error'
                            ? 'text-rose-400'
                            : log.status === 'success'
                            ? 'text-emerald-300 font-semibold'
                            : log.status === 'item'
                            ? 'text-amber-200'
                            : 'text-slate-300'
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={terminalBottomRef} />
                </div>
              </div>

              {/* Final Result Cards */}
              {result && (
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-indigo-950/40 border border-emerald-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white">Auto-Pilot Completed Successfully</h4>
                        <p className="text-xs text-slate-300">
                          Scouted {result.total_scouted || 12} opportunities & generated tailored resumes.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/studio');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Open in AI Resume Studio
                    </button>
                  </div>

                  {/* Tailored Resumes List */}
                  {result.tailored_resumes && result.tailored_resumes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.tailored_resumes.map((tr, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <Badge variant="primary" size="sm">
                                {tr.category === 'competition' ? '🏆 HACKATHON PITCH' : '💼 JOB RESUME'}
                              </Badge>
                              {tr.ats_score && (
                                <span className="text-xs font-mono text-emerald-400 font-bold">
                                  {tr.ats_score}% ATS Fit
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-white mt-2">{tr.opportunity_title}</h4>
                            <p className="text-[11px] text-slate-400">{tr.company_name}</p>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                            {tr.pdf_url && (
                              <button
                                onClick={() => handleDownloadPdf(tr.pdf_url, tr.opportunity_title)}
                                className="flex-1 py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download PDF
                              </button>
                            )}
                            <button
                              onClick={() => {
                                onClose();
                                navigate('/studio');
                              }}
                              className="flex-1 py-1.5 px-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              Edit in Studio
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Auto-Pilot Interrupted: </span>
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>ArmorIQ Cryptographic Multi-Agent Sub-agent Delegation</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isRunning}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              {result ? 'Close' : 'Cancel'}
            </button>

            {!result && (
              <button
                onClick={handleStartAutoPilot}
                disabled={isRunning}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Executing Auto-Pilot...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Launch Career Auto-Pilot
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
