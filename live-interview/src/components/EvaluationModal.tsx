import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Download,
  RotateCcw,
  Star,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { EvaluationReport } from "../types";

interface EvaluationModalProps {
  report: EvaluationReport | null;
  isLoading: boolean;
  onRetake: () => void;
  onClose: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  report,
  isLoading,
  onRetake,
  onClose,
}) => {
  useEffect(() => {
    if (report && (report.hiringDecision === "Strong Hire" || report.hiringDecision === "Hire" || report.overallScore >= 75)) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [report]);

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-evaluation-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#202124] border border-[#3c4043] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border-b border-[#3c4043] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                AI Interview Evaluation & Scorecard
              </h2>
              <p className="text-xs sm:text-sm text-gray-300">
                Comprehensive performance feedback from Google Meet AI Interviewer
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              disabled={isLoading || !report}
              className="p-2 bg-[#2d2f34] hover:bg-[#3c4043] text-gray-300 hover:text-white rounded-xl border border-[#3c4043] text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
              title="Download Evaluation Report"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onRetake}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Interview</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">
                  Synthesizing Deep Technical Scorecard...
                </h3>
                <p className="text-sm text-gray-400 max-w-sm mt-1">
                  Gemini is analyzing your live conversation, transcript, code quality, edge cases, and architectural trade-offs.
                </p>
              </div>
            </div>
          ) : report ? (
            <>
              {/* Score & Decision Hero Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Overall Score */}
                <div className="p-5 bg-[#2d2f34] rounded-2xl border border-[#3c4043] flex flex-col items-center justify-center text-center">
                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">
                    Overall Performance Score
                  </span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-5xl font-black text-white tracking-tight">
                      {report.overallScore}
                    </span>
                    <span className="text-gray-400 text-lg font-medium">/100</span>
                  </div>
                  <div className="w-full bg-[#1e1e24] h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                      style={{ width: `${report.overallScore}%` }}
                    />
                  </div>
                </div>

                {/* Hiring Decision */}
                <div className="p-5 bg-[#2d2f34] rounded-2xl border border-[#3c4043] flex flex-col items-center justify-center text-center">
                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1">
                    Hiring Committee Verdict
                  </span>
                  <div
                    className={`text-xl font-bold px-4 py-1.5 rounded-full border mt-1 ${
                      report.hiringDecision === "Strong Hire"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : report.hiringDecision === "Hire"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                        : report.hiringDecision === "Lean Hire"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-red-500/20 text-red-300 border-red-500/40"
                    }`}
                  >
                    {report.hiringDecision}
                  </div>
                  <span className="text-xs text-gray-400 mt-2 font-medium">
                    Evaluated against Google Staff Level benchmarks
                  </span>
                </div>

                {/* Executive Summary */}
                <div className="p-5 bg-[#2d2f34] rounded-2xl border border-[#3c4043] flex flex-col justify-center">
                  <span className="text-xs uppercase tracking-wider font-semibold text-blue-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Executive Summary
                  </span>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    {report.executiveSummary}
                  </p>
                </div>
              </div>

              {/* Category Breakdown Bars */}
              <div className="p-5 bg-[#2d2f34] rounded-2xl border border-[#3c4043] space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-400" />
                  Competency Score Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.metrics.map((metric) => (
                    <div key={metric.category} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-200">{metric.category}</span>
                        <span className="font-mono text-blue-400 font-bold">{metric.score}/100</span>
                      </div>
                      <div className="w-full bg-[#1e1e24] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${metric.score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 leading-tight">
                        {metric.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Strengths */}
                <div className="p-5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2.5">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Standout Strengths
                  </h3>
                  <ul className="space-y-1.5">
                    {report.topStrengths.map((s, i) => (
                      <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="p-5 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-2.5">
                  <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Growth & Improvement Areas
                  </h3>
                  <ul className="space-y-1.5">
                    {report.areasForImprovement.map((a, i) => (
                      <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Study Roadmap */}
              {report.actionableStudyRoadmap && report.actionableStudyRoadmap.length > 0 && (
                <div className="p-5 bg-[#2d2f34] rounded-2xl border border-[#3c4043] space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Recommended Preparation Roadmap
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {report.actionableStudyRoadmap.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#1e1e24] rounded-xl border border-[#3c4043] text-xs text-gray-300 flex items-start gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">
              No evaluation data available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1e1e24] border-t border-[#3c4043] flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Powered by Google Gemini 3.1 Multimodal Live & Gemini 3.7 Flash
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#3c4043] hover:bg-[#484c51] text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
