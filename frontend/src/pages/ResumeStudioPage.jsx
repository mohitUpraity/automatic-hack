import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Download,
  Copy,
  Check,
  RotateCcw,
  Target,
  FileText,
  Briefcase,
  Trophy,
  Loader2,
  Wand2,
  Sliders,
  Send,
  Eye,
  Edit3,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PageShell from '../components/layout/PageShell';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import ScoreGauge from '../components/ui/ScoreGauge';
import AutoPilotModal from '../components/autopilot/AutoPilotModal';
import {
  fetchOpportunities,
  fetchProfiles,
  fetchDocuments,
  tailorResume,
  refineResume,
  downloadResumePdf,
  fetchTailoredResumes,
} from '../api/client';

const DEFAULT_RESUME_MARKDOWN = `# Alex Mercer
**Senior Full-Stack & AI Engineer** | San Francisco, CA | alex.mercer@email.com | (555) 234-5678 | [linkedin.com/in/alexmercer](https://linkedin.com) | [github.com/alexmercer](https://github.com)

---

## Professional Summary
High-impact Full-Stack and AI Systems Engineer with 4+ years of experience architecting distributed cloud platforms, multi-agent AI pipelines, and responsive frontend applications. Track record of scaling microservices to 500k+ active users and reducing inference latency by 45%. Passionate about AI safety, RAG systems, and developer tooling.

---

## Core Technical Competencies
- **Languages:** TypeScript, JavaScript, Python, Go, SQL, HTML5/CSS3
- **Frameworks & Libs:** React, Next.js, FastAPI, Node.js, Tailwind CSS, PyTorch, LangChain
- **Databases & Vector:** PostgreSQL (pgvector), SQLite, Redis, Supabase, Pinecone
- **DevOps & Cloud:** Docker, Kubernetes, AWS (Lambda, ECS, S3), GitHub Actions, CI/CD

---

## Professional Experience

### **Senior Software Engineer** | CloudScale Technologies
*Jan 2023 – Present | San Francisco, CA*
- Engineered high-throughput multi-agent orchestration pipeline processing 2.5M daily telemetry events with 99.98% uptime.
- Optimized pgvector semantic search retrieval latency by 38% through HNSW index tuning and hybrid lexical search ranking.
- Spearheaded migration to React 18 and Next.js App Router, boosting Core Web Vitals LCP by 1.2s across 12 enterprise applications.

### **Software Engineer** | DataVibe AI
*Jun 2021 – Dec 2022 | Remote*
- Built real-time collaborative document workspace using WebSockets and CRDTs supporting 50+ concurrent editors per room.
- Integrated automated ATS parsing engine with LLM-based feedback, improving candidate resume pass-through rates by 62%.
- Designed and documented 30+ REST and GraphQL endpoints with 100% test coverage and automated contract testing.

---

## Key Projects

### **CareerOS — Autonomous Career Intelligence Agent**
- Architected multi-agent system utilizing Google ADK and ArmorIQ cryptographic governance for autonomous job & hackathon discovery.
- Implemented real-time PDF generation via WeasyPrint and RAG vector similarity matching over candidate portfolios.

### **PromptArmor — LLM Security & Guardrail Framework**
- Created lightweight firewall intercepting prompt injection attacks and token scope violations with <15ms overhead.

---

## Education

**B.S. in Computer Science** | University of California, Berkeley
*Graduated: May 2021 | GPA: 3.85 / 4.0*
`;

export default function ResumeStudioPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOppId, setSelectedOppId] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  // Resume content state
  const [markdown, setMarkdown] = useState(DEFAULT_RESUME_MARKDOWN);
  const [originalMarkdown, setOriginalMarkdown] = useState(DEFAULT_RESUME_MARKDOWN);
  const [atsScore, setAtsScore] = useState(92);
  const [activeEngine, setActiveEngine] = useState('WeasyPrint');

  // UI state
  const [isAutoPilotOpen, setIsAutoPilotOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const oppsRes = await fetchOpportunities();
        const opps = oppsRes.opportunities || [];
        setOpportunities(opps);
        if (opps.length > 0) {
          setSelectedOppId(String(opps[0].id));
          setSelectedOpportunity(opps[0]);
        }

        // Check if there are documents or profiles to seed
        const docsRes = await fetchDocuments();
        const resumes = (docsRes.documents || []).filter((d) => d.doc_type === 'resume');
        if (resumes.length > 0 && resumes[0].raw_markdown) {
          setMarkdown(resumes[0].raw_markdown);
          setOriginalMarkdown(resumes[0].raw_markdown);
        }

        const tailoredRes = await fetchTailoredResumes();
        if (tailoredRes.tailored_resumes && tailoredRes.tailored_resumes.length > 0) {
          setHistory(tailoredRes.tailored_resumes);
        }
      } catch (err) {
        console.error('Failed to load studio context:', err);
      }
    }
    loadData();
  }, []);

  const handleOpportunityChange = (oppId) => {
    setSelectedOppId(oppId);
    const found = opportunities.find((o) => String(o.id) === String(oppId));
    setSelectedOpportunity(found || null);
  };

  // 1. AI Actions
  const handleAiAction = async (actionKey, promptDesc) => {
    setIsProcessing(true);
    setProcessingAction(promptDesc);
    try {
      let contextStr = '';
      if (selectedOpportunity) {
        contextStr = `Target Role: ${selectedOpportunity.title}\nCompany/Org: ${selectedOpportunity.company || selectedOpportunity.source}\nRequirements: ${selectedOpportunity.description || ''}`;
      }

      if (actionKey === 'tailor_for_opp' && selectedOpportunity) {
        const res = await tailorResume(
          selectedOpportunity.title || 'Software Engineer',
          selectedOpportunity.company || selectedOpportunity.source || 'Target Org',
          selectedOpportunity.description || 'Fullstack and AI engineering'
        );
        if (res.tailored_markdown) {
          setMarkdown(res.tailored_markdown);
          setAtsScore(res.ats_score || 95);
          setActiveEngine(res.engine || 'WeasyPrint');
        }
      } else {
        const res = await refineResume(markdown, actionKey, contextStr || customPrompt);
        if (res.refined_markdown) {
          setMarkdown(res.refined_markdown);
          setAtsScore(res.ats_score || 93);
          setActiveEngine(res.engine || 'WeasyPrint');
        }
      }
    } catch (err) {
      console.error('AI Refinement failed:', err);
      alert('AI Refinement error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
      setProcessingAction('');
    }
  };

  const handleCustomAiSubmit = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    handleAiAction('ats_optimize', `Custom Instruction: ${customPrompt}`);
    setCustomPrompt('');
  };

  // 2. Export Actions
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tailored_Resume_${selectedOpportunity?.company || 'Candidate'}.md`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const filename = `Tailored_Resume_${selectedOpportunity?.company || 'Candidate'}.pdf`;
      await downloadResumePdf(null, markdown, filename);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Failed to download PDF: ' + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <PageShell
      title="Autonomous Career & Resume Studio"
      subtitle="AI-powered resume editing, ATS keyword optimization & one-click PDF generation"
      icon={Wand2}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-4 rounded-2xl">
          {/* Target Opportunity Selector */}
          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Target className="w-4 h-4 text-indigo-400" />
              <span>Target Role:</span>
            </div>
            <div className="relative w-full sm:w-80">
              <select
                value={selectedOppId}
                onChange={(e) => handleOpportunityChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none pr-8 cursor-pointer font-medium"
              >
                {opportunities.length === 0 ? (
                  <option value="">No scouted opportunities yet</option>
                ) : (
                  opportunities.map((opp) => {
                    const title = opp.title || opp.company_name || 'Software Engineering Role';
                    const comp = opp.company || opp.company_name || opp.source || 'Industry Partner';
                    const cat = opp.category?.toUpperCase() || 'JOB';
                    return (
                      <option key={opp.id} value={opp.id}>
                        [{cat}] {title} ({comp})
                      </option>
                    );
                  })
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {selectedOpportunity && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    selectedOpportunity.category === 'hackathon' ||
                    selectedOpportunity.category === 'competition'
                      ? 'warning'
                      : 'accent'
                  }
                >
                  {selectedOpportunity.category?.toUpperCase() || 'OPPORTUNITY'}
                </Badge>
                <span className="text-xs font-bold text-emerald-400">
                  {selectedOpportunity.relevance_score || 94}% Fit
                </span>
              </div>
            )}
          </div>

          {/* Quick Launch Auto-Pilot Button */}
          <button
            onClick={() => setIsAutoPilotOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all flex-shrink-0"
          >
            <Zap className="w-4 h-4 animate-pulse" />
            <span>Launch Full Auto-Pilot</span>
          </button>
        </div>

        {/* AI Assistants Action Bar */}
        <GlassCard className="p-4 space-y-3" padding="md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Instant AI Actions
              </span>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-indigo-300 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{processingAction}...</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAiAction('tailor_for_opp', 'Tailoring for selected role')}
              disabled={isProcessing || !selectedOpportunity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Auto-Tailor for Role</span>
            </button>

            <button
              onClick={() => handleAiAction('ats_optimize', 'Optimizing ATS keywords & syntax')}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            >
              <Target className="w-3.5 h-3.5" />
              <span>🎯 Boost ATS Score</span>
            </button>

            <button
              onClick={() => handleAiAction('quantify_metrics', 'Quantifying impact with metrics')}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>📈 Quantify Impact & Metrics</span>
            </button>

            <button
              onClick={() => handleAiAction('hackathon_pitch', 'Restructuring for Competition / Hackathon')}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>🏆 Hackathon Submission Mode</span>
            </button>

            <button
              onClick={() => handleAiAction('polish_summary', 'Writing Executive Summary')}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>✨ Executive Summary Polish</span>
            </button>

            <button
              onClick={() => handleAiAction('fix_grammar', 'Fixing grammar & active voice')}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>📝 Polish Active Voice</span>
            </button>
          </div>

          {/* Custom Instruction Box */}
          <form onSubmit={handleCustomAiSubmit} className="flex gap-2 pt-1">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ask AI to refine anything (e.g. 'Add bullet point about my Kubernetes migration', 'Make it concise for a 1-page format')..."
              className="flex-1 bg-slate-950/80 border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isProcessing || !customPrompt.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          </form>
        </GlassCard>

        {/* Main Split Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Pane: Markdown Editor */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Resume Markdown Editor
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMarkdown(originalMarkdown)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                  title="Revert to original"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Revert</span>
                </button>
                <span className="text-[11px] text-slate-500">
                  {markdown.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>

            <div className="relative flex-1 min-h-[560px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner flex flex-col">
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="w-full flex-1 bg-transparent p-5 text-xs text-slate-200 font-mono leading-relaxed resize-none focus:outline-none scrollbar-thin"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Right Pane: Live Visual Preview & Export */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Live Document Preview
                  </span>
                </div>
                <Badge variant="accent">ATS Score {atsScore}%</Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                  title="Copy raw markdown"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                  title="Download .md file"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>.MD</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  title="Download Styled PDF"
                >
                  {downloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Rendered Document Sheet */}
            <div className="relative flex-1 min-h-[560px] bg-slate-900/90 border border-slate-800 rounded-2xl p-8 overflow-y-auto shadow-2xl space-y-4">
              <div className="prose prose-invert prose-xs max-w-none prose-headings:text-slate-100 prose-h1:text-xl prose-h1:border-b prose-h1:border-indigo-500/40 prose-h1:pb-2 prose-h2:text-sm prose-h2:text-indigo-300 prose-h2:uppercase prose-h2:tracking-wider prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-1 prose-h2:mt-4 prose-h3:text-xs prose-h3:text-slate-200 prose-p:text-xs prose-p:text-slate-300 prose-li:text-xs prose-li:text-slate-300 prose-ul:my-2 prose-li:my-0.5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Pilot Modal */}
        <AutoPilotModal
          isOpen={isAutoPilotOpen}
          onClose={() => setIsAutoPilotOpen(false)}
          onComplete={(res) => {
            if (res.tailored_resumes && res.tailored_resumes.length > 0) {
              setMarkdown(res.tailored_resumes[0].tailored_markdown);
              setAtsScore(res.tailored_resumes[0].ats_score || 95);
            }
          }}
        />
      </div>
    </PageShell>
  );
}
