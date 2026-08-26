import React, { useState } from 'react';
import { FileText, Download, Sparkles, Loader2, Building, Award } from 'lucide-react';

export default function ResumeTailor({ apiBaseUrl = "http://localhost:8000" }) {
  const [companyName, setCompanyName] = useState('');
  const [opportunityTitle, setOpportunityTitle] = useState('');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTailor = async (e) => {
    e.preventDefault();
    if (!companyName || !opportunityTitle) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/tailor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          opportunity_title: opportunityTitle,
          requirements: requirements,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Tailoring failed");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-6 h-6 text-amber-400" />
        <h2 className="text-xl font-bold text-white">Company-Specific Resume Tailor</h2>
      </div>

      <p className="text-slate-400 text-sm mb-6">
        RAG retrieves relevant candidate experiences → Groq LLM tailors resume → WeasyPrint generates ATS-ready PDF.
      </p>

      <form onSubmit={handleTailor} className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Target Company Name
            </label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google, Stripe, Razorpay"
                className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Target Role / Opportunity
            </label>
            <div className="relative">
              <Award className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={opportunityTitle}
                onChange={(e) => setOpportunityTitle(e.target.value)}
                placeholder="e.g. Senior Fullstack Engineer"
                className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Job Requirements / Key Skills
          </label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Paste key requirements from job description (e.g. React, Node.js, Distributed Systems, Python)..."
            rows={3}
            className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !companyName || !opportunityTitle}
          className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Tailoring Resume & Rendering WeasyPrint PDF...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Tailored Resume PDF
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-lg text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-950/40 border border-amber-800/50 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-400 block uppercase">ATS Score Match</span>
              <span className="text-2xl font-bold text-amber-200">{result.ats_score}%</span>
            </div>
            <a
              href={`${apiBaseUrl}${result.pdf_download_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Tailored PDF
            </a>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 max-h-80 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Tailored Resume Markdown:</h4>
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
              {result.tailored_markdown}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
