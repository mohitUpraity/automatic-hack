import React, { useState } from 'react';
import { Database, Search, Sparkles, BookOpen } from 'lucide-react';

export default function KnowledgeBase({ apiBaseUrl = "http://localhost:8000" }) {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/knowledge/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, top_k: topK }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Search failed");
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-bold text-white">RAG Knowledge Base Explorer</h2>
      </div>

      <p className="text-slate-400 text-sm mb-6">
        Search candidate knowledge vectors using Gemini Embedding 001 (768d asymmetric similarity search).
      </p>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidate experiences, skills, projects (e.g. 'React, Python REST APIs')..."
            className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
        <select
          value={topK}
          onChange={(e) => setTopK(Number(e.target.value))}
          className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-2.5 text-sm"
        >
          <option value={3}>Top 3</option>
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
        </select>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Search Vector DB
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-lg text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span>Query: "{results.query}"</span>
            <span>Matches Found: {results.results_count}</span>
          </div>

          <div className="space-y-3">
            {results.results?.map((item, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Chunk #{idx + 1}
                  </span>
                  <span className="text-xs font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800/50">
                    Similarity: {((item.similarity || 0.8) * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-slate-300 font-sans leading-relaxed">
                  {item.chunk_text}
                </p>
              </div>
            ))}
          </div>

          {results.rag_context && (
            <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-purple-900/40">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                Generated RAG LLM Context Payload:
              </h4>
              <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                {results.rag_context}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
