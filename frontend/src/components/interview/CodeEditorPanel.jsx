import React, { useState } from "react";
import { Play, RotateCcw, Share2, Code2, CheckCircle2, AlertCircle, Copy, Check, Terminal } from "lucide-react";
import { DEFAULT_CODING_CHALLENGES } from "./interviewData";

export default function CodeEditorPanel({ onSyncCodeWithAi }) {
  const [selectedChallengeIndex, setSelectedChallengeIndex] = useState(0);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(DEFAULT_CODING_CHALLENGES[0].starterCode);
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  const currentChallenge = DEFAULT_CODING_CHALLENGES[selectedChallengeIndex] || DEFAULT_CODING_CHALLENGES[0];

  const handleChallengeChange = (idx) => {
    setSelectedChallengeIndex(idx);
    setCode(DEFAULT_CODING_CHALLENGES[idx].starterCode);
    setOutput(null);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("Executing test cases in sandbox...");
    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      setOutput(data.output || (data.success ? "Code executed with no output." : "Execution Error"));
    } catch (err) {
      setOutput(`Failed to execute: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSync = () => {
    if (onSyncCodeWithAi) {
      onSyncCodeWithAi(code, language);
    }
    setHasSynced(true);
    setTimeout(() => setHasSynced(false), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/95 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Header Controls */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Code2 className="w-4 h-4" />
          </div>
          <select
            value={selectedChallengeIndex}
            onChange={(e) => handleChallengeChange(Number(e.target.value))}
            className="bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500 font-medium"
          >
            {DEFAULT_CODING_CHALLENGES.map((ch, i) => (
              <option key={ch.id} value={i}>
                {ch.title} ({ch.difficulty})
              </option>
            ))}
          </select>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python 3</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs flex items-center gap-1 transition-colors"
            title="Copy code"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={() => {
              setCode(currentChallenge.starterCode);
              setOutput(null);
            }}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs flex items-center gap-1 transition-colors"
            title="Reset code template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleSync}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              hasSynced
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
            }`}
            title="Explain/Share your latest code with the AI Interviewer"
          >
            {hasSynced ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{hasSynced ? "Synced with AI" : "Share with AI"}</span>
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? "Running..." : "Run Code"}</span>
          </button>
        </div>
      </div>

      {/* Problem Prompt Snippet */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 text-xs text-slate-300 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">{currentChallenge.title}: </span>
          <span>{currentChallenge.description}</span>
        </div>
      </div>

      {/* Code Textarea with line numbers */}
      <div className="flex-1 relative flex overflow-hidden font-mono text-sm bg-slate-950/80">
        {/* Line numbers gutter */}
        <div className="w-10 bg-slate-900/60 text-slate-500 py-3 text-right pr-2.5 select-none text-xs border-r border-slate-800 leading-6 font-mono">
          {code.split("\n").map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Editor Area */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full h-full p-3 bg-transparent text-slate-100 resize-none focus:outline-none leading-6 font-mono text-xs sm:text-sm selection:bg-cyan-600/40"
          placeholder="// Write your solution here..."
        />
      </div>

      {/* Output Console Drawer */}
      <div className="h-32 sm:h-36 bg-slate-950 border-t border-slate-800 flex flex-col">
        <div className="px-4 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Execution Output / Sandbox Console</span>
          </div>
          {output && (
            <button
              onClick={() => setOutput(null)}
              className="text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-emerald-400 whitespace-pre-wrap selection:bg-emerald-900/50">
          {output ? (
            output
          ) : (
            <span className="text-slate-500 italic">
              Click &quot;Run Code&quot; to execute and verify test cases...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
