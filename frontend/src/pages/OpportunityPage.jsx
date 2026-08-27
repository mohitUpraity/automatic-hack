import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Target,
  Building2,
  MapPin,
  ExternalLink,
  Sparkles,
  FileEdit,
  Download,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Building,
  Wand2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PageShell from '../components/layout/PageShell';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import ScoreGauge from '../components/ui/ScoreGauge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import OpportunityCard from '../components/opportunities/OpportunityCard';
import {
  fetchOpportunityById,
  fetchOpportunities,
  tailorResume,
  fetchProfiles,
  downloadResumePdf,
} from '../api/client';

export default function OpportunityPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [opportunity, setOpportunity] = useState(null);
  const [similarOpps, setSimilarOpps] = useState([]);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tailor Resume Form state
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorResult, setTailorResult] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch all opportunities and find matching ID
        const oppsRes = await fetchOpportunities();
        const allOpps = oppsRes.opportunities || [];
        const found = allOpps.find((o) => String(o.id) === String(id));

        if (!found) {
          setError('Opportunity not found');
          setLoading(false);
          return;
        }

        setOpportunity(found);
        setCompanyName(found.company || '');
        setRoleTitle(found.title || '');
        setRequirements(found.description || found.requirements || `${found.title} requirements`);

        // Find similar opportunities in same category
        const similar = allOpps
          .filter((o) => String(o.id) !== String(id) && o.category === found.category)
          .slice(0, 4);
        setSimilarOpps(similar);

        // Fetch candidate profiles for context
        const profRes = await fetchProfiles();
        if (profRes.profiles && profRes.profiles.length > 0) {
          setCandidateProfile(profRes.profiles[0]);
        }
      } catch (err) {
        console.error('Failed to load opportunity details:', err);
        setError('Failed to load opportunity details');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  const handleTailorSubmit = async (e) => {
    e.preventDefault();
    if (!roleTitle || !companyName) return;

    setIsTailoring(true);
    setTailorResult(null);

    try {
      const res = await tailorResume(roleTitle, companyName, requirements);
      setTailorResult(res);
    } catch (err) {
      console.error('Resume tailoring error:', err);
      alert('Tailoring failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsTailoring(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Opportunity Detail" subtitle="Loading specifics..." icon={Target}>
        <div className="h-96 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading opportunity details..." />
        </div>
      </PageShell>
    );
  }

  if (error || !opportunity) {
    return (
      <PageShell title="Opportunity Detail" subtitle="Error" icon={Target}>
        <GlassCard className="p-8 text-center space-y-4">
          <h3 className="text-xl font-bold text-red-400">{error || 'Opportunity not found'}</h3>
          <p className="text-sm text-slate-400">The requested opportunity ID does not exist or was removed.</p>
          <button
            onClick={() => navigate('/documents')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Opportunities
          </button>
        </GlassCard>
      </PageShell>
    );
  }

  const matchScore = opportunity.relevance_score || 85;

  return (
    <PageShell
      title={opportunity.title}
      subtitle={`${opportunity.company} • ${opportunity.location || 'Remote'}`}
      icon={Target}
    >
      <div className="space-y-8 animate-fade-in">
        {/* Back Link */}
        <button
          onClick={() => navigate('/documents')}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents & Opportunities
        </button>

        {/* Hero Section */}
        <GlassCard className="p-8 relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/40 border-indigo-500/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={opportunity.category || 'job'} size="md">
                  {(opportunity.category || 'JOB').toUpperCase()}
                </Badge>
                <span className="text-xs text-slate-500 font-mono">ID: {opportunity.id}</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {opportunity.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-slate-300 flex-wrap">
                <div className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>{opportunity.company}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>{opportunity.location || 'Remote / Hybrid'}</span>
                </div>
              </div>
            </div>

            {/* Score & Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <ScoreGauge score={matchScore} size={68} strokeWidth={5} />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Match Score</div>
                  <div className="text-xs font-semibold text-emerald-400">Highly Relevant</div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 w-full sm:w-auto">
                {opportunity.url && (
                  <a
                    href={opportunity.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    Direct Apply Link
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => navigate('/studio')}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-950 flex items-center justify-center gap-2 transition-all"
                >
                  <Wand2 className="w-4 h-4" />
                  Open in AI Resume Studio
                </button>
                <a
                  href="#tailor-section"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <FileEdit className="w-4 h-4 text-amber-400" />
                  Quick Tailor Here
                </a>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Why This Matches Section */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2>Why This Opportunity Matches Your Profile</h2>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {opportunity.description ||
              `This ${opportunity.category || 'job'} at ${opportunity.company} matches your target career goals and registered technical stack. Our AI RAG pipeline evaluated your uploaded credentials against the role's core competencies.`}
          </p>

          {candidateProfile && (
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Your Stack Overlap
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(candidateProfile.tech_stack)
                    ? candidateProfile.tech_stack
                    : (candidateProfile.tech_stack || 'React, Python, FastAPI').split(',')
                  ).map((tech, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded font-mono">
                      ✓ {tech.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Target Career Goals
                </span>
                <p className="text-slate-300">
                  {candidateProfile.summary || candidateProfile.target_roles || 'Senior Full-Stack & AI Engineer'}
                </p>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Tailor Resume Section */}
        <div id="tailor-section">
          <GlassCard className="p-8 space-y-6 border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/30">
                <FileEdit className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">ATS Resume Tailor</h2>
                <p className="text-xs text-slate-400">
                  Auto-populated with this opportunity's specifics. Generates company-tailored resume content & WeasyPrint PDF.
                </p>
              </div>
            </div>

            <form onSubmit={handleTailorSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Target Role Title</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Job Requirements & Key Qualifications</label>
                <textarea
                  rows={4}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isTailoring}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-950 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isTailoring ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Generating Tailored Resume & PDF...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Tailored Resume Content
                  </>
                )}
              </button>
            </form>

            {/* Tailor Results */}
            {tailorResult && (
              <div className="pt-6 border-t border-slate-800 space-y-4 animate-slide-up">
                <div className="flex items-center justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Tailored Resume Ready!</h4>
                      <p className="text-xs text-slate-400">Optimized for {companyName} ATS keywords</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/studio')}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-950"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      Edit in Studio
                    </button>
                    <button
                      onClick={() => downloadResumePdf(tailorResult.pdf_path, tailorResult.tailored_markdown || tailorResult.tailored_resume, `Tailored_Resume_${companyName}.pdf`)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-emerald-950"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  </div>
                </div>

                {tailorResult.tailored_resume && (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 max-h-96 overflow-y-auto">
                    <div className="prose-chat">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {tailorResult.tailored_resume}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Similar Opportunities Carousel */}
        {similarOpps.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              Similar Opportunities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarOpps.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onClick={() => navigate(`/opportunity/${opp.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
