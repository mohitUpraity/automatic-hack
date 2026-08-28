import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Building2,
  Award,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  TrendingUp,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  User,
  Layers,
  ChevronRight
} from "lucide-react";
import { fetchInterviewHistory } from "../../api/client";
import InterviewDebriefModal from "./InterviewDebriefModal";

// Initial realistic benchmark history entries if user has no past sessions yet
const DEFAULT_SAMPLE_HISTORY = [
  {
    id: "hist_sample_google_01",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    durationMinutes: 14,
    company: "Google Cloud",
    role: "Senior Distributed Systems Engineer",
    seniority: "Senior",
    candidateName: "Mohit Upraity",
    interviewerName: "Sarah (SVP of Talent)",
    voice: "Zephyr",
    hiringDecision: "Strong Hire",
    readinessScore: 92,
    conductStatus: "Clean (0 Warnings)",
    conductWarningsCount: 0,
    dimensions: {
      technicalCompetence: 94,
      systemDesignRigor: 91,
      behavioralSTAR: 90,
      executivePresence: 93,
      communicationClarity: 92,
    },
    nonVerbal: {
      postureScore: 92,
      eyeContactScore: 95,
      composureScore: 94,
      observations: [
        "Maintained direct eye contact on the webcam during deep technical queries.",
        "Articulate, concise STAR responses on distributed consensus and high-load caching.",
        "Zero off-camera distractions or device checks."
      ]
    },
    executiveSummary: "Outstanding candidate with proven distributed systems leadership, crisp communication, and executive composure under challenging probing.",
  },
  {
    id: "hist_sample_stripe_02",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    durationMinutes: 11,
    company: "Stripe",
    role: "Staff Backend Infrastructure Engineer",
    seniority: "Staff",
    candidateName: "Mohit Upraity",
    interviewerName: "Marcus (Principal Architect)",
    voice: "Orion",
    hiringDecision: "Hire",
    readinessScore: 86,
    conductStatus: "Clean (0 Warnings)",
    conductWarningsCount: 0,
    dimensions: {
      technicalCompetence: 88,
      systemDesignRigor: 89,
      behavioralSTAR: 82,
      executivePresence: 85,
      communicationClarity: 86,
    },
    nonVerbal: {
      postureScore: 88,
      eyeContactScore: 84,
      composureScore: 86,
      observations: [
        "Strong explanations of idempotent transaction pipelines and partition tolerances.",
        "Occasional looking away when thinking through edge failure states.",
      ]
    },
    executiveSummary: "Strong technical caliber with deep knowledge of payment processing pipelines and high availability patterns.",
  }
];

export default function InterviewHistoryView({ onLaunchInterview }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("all"); // "all" | "Strong Hire" | "Hire" | "Disqualified"
  const [selectedDebriefSession, setSelectedDebriefSession] = useState(null);

  // Load history from localStorage + API
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let stored = [];
        try {
          const raw = localStorage.getItem("careeros_interview_history");
          if (raw) stored = JSON.parse(raw);
        } catch (e) {}

        const apiRes = await fetchInterviewHistory().catch(() => ({ history: [] }));
        const apiHistory = apiRes?.history || [];

        const combined = [...stored, ...apiHistory];
        
        // Deduplicate by id or timestamp
        const deduped = [];
        const seen = new Set();
        for (const item of combined) {
          const key = item.id || `${item.company}_${item.role}_${item.date}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(item);
          }
        }

        if (deduped.length === 0) {
          setHistory(DEFAULT_SAMPLE_HISTORY);
        } else {
          setHistory(deduped);
        }
      } catch (err) {
        console.warn("[Interview History Load Error]", err);
        setHistory(DEFAULT_SAMPLE_HISTORY);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.interviewerName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchVerdict =
        verdictFilter === "all" ||
        item.hiringDecision?.toLowerCase() === verdictFilter.toLowerCase() ||
        (verdictFilter === "Hire" && (item.hiringDecision === "Hire" || item.hiringDecision === "Strong Hire"));

      return matchSearch && matchVerdict;
    });
  }, [history, searchQuery, verdictFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    if (!history.length) {
      return { total: 0, avgScore: 0, passRate: 0, avgNonVerbal: 0, cleanRatio: 100 };
    }
    const total = history.length;
    const sumScore = history.reduce((acc, h) => acc + (h.readinessScore || 80), 0);
    const passes = history.filter((h) =>
      ["Strong Hire", "Hire", "Lean Hire"].includes(h.hiringDecision)
    ).length;
    const cleanSessions = history.filter(
      (h) => !h.conductWarningsCount || h.conductWarningsCount === 0
    ).length;

    const sumEyeContact = history.reduce(
      (acc, h) => acc + (h.nonVerbal?.eyeContactScore || h.readinessScore || 85),
      0
    );

    return {
      total,
      avgScore: Math.round(sumScore / total),
      passRate: Math.round((passes / total) * 100),
      avgNonVerbal: Math.round(sumEyeContact / total),
      cleanRatio: Math.round((cleanSessions / total) * 100),
    };
  }, [history]);

  const getVerdictBadge = (decision) => {
    switch (decision) {
      case "Strong Hire":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 flex items-center gap-1.5 shadow-sm shadow-emerald-950">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Strong Hire
          </span>
        );
      case "Hire":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 flex items-center gap-1.5 shadow-sm shadow-cyan-950">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            Hire
          </span>
        );
      case "Lean Hire":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-950/80 border border-blue-500/50 text-blue-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            Lean Hire
          </span>
        );
      case "Disqualified":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 border border-rose-500/50 text-rose-400 flex items-center gap-1.5 shadow-sm shadow-rose-950">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Disqualified
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 border border-amber-500/50 text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            {decision || "In Review"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Mock Calls</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.total}</div>
          <p className="text-[10px] text-slate-400">Full Duplex Simulations</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Readiness</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400">{metrics.avgScore}<span className="text-sm font-normal text-slate-400">/100</span></div>
          <p className="text-[10px] text-slate-400">High-Bar Benchmark</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pass Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{metrics.passRate}%</div>
          <p className="text-[10px] text-slate-400">Strong Hire / Hire ratio</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Eye & Posture</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{metrics.avgNonVerbal}%</div>
          <p className="text-[10px] text-slate-400">Executive Presence Score</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Conduct Integrity</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-400">{metrics.cleanRatio}%</div>
          <p className="text-[10px] text-slate-400">Zero-Warning Sessions</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, role, or interviewer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["all", "Strong Hire", "Hire", "Disqualified"].map((filter) => (
            <button
              key={filter}
              onClick={() => setVerdictFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                verdictFilter === filter
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {filter === "all" ? "All Sessions" : filter}
            </button>
          ))}
        </div>
      </div>

      {/* History Session Cards Feed */}
      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/20 border border-slate-800/60 rounded-3xl space-y-3">
          <Award className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Interview Records Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You haven't conducted a mock interview matching this filter. Start a live bar-raiser session to generate real-time evaluations!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredHistory.map((item) => {
            const dateStr = item.date
              ? new Date(item.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recent";

            return (
              <div
                key={item.id}
                className="p-5 bg-slate-900/50 border border-slate-800/90 hover:border-slate-700 rounded-2xl transition-all space-y-4 hover:shadow-xl hover:shadow-cyan-950/20"
              >
                {/* Header: Company & Verdict */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-cyan-950">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-white truncate">
                          {item.company}
                        </h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {item.seniority || "Senior"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate font-medium">
                        {item.role}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {dateStr}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {item.durationMinutes || 12} mins
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          {item.interviewerName || "Sarah (HR Panel)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-semibold text-slate-400">Score</div>
                      <div className="text-lg font-black text-white">{item.readinessScore || 85}<span className="text-xs font-normal text-slate-400">/100</span></div>
                    </div>
                    {getVerdictBadge(item.hiringDecision)}
                  </div>
                </div>

                {/* Performance Pill Indicators */}
                {item.dimensions && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Technical Depth</span>
                      <div className="text-xs font-bold text-cyan-400">{item.dimensions.technicalCompetence || 85}%</div>
                    </div>
                    <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400">System Design</span>
                      <div className="text-xs font-bold text-blue-400">{item.dimensions.systemDesignRigor || 85}%</div>
                    </div>
                    <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Behavioral STAR</span>
                      <div className="text-xs font-bold text-indigo-400">{item.dimensions.behavioralSTAR || 85}%</div>
                    </div>
                    <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Executive Presence</span>
                      <div className="text-xs font-bold text-teal-400">{item.dimensions.executivePresence || 85}%</div>
                    </div>
                    <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-0.5 col-span-2 sm:col-span-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Communication</span>
                      <div className="text-xs font-bold text-emerald-400">{item.dimensions.communicationClarity || 85}%</div>
                    </div>
                  </div>
                )}

                {/* Summary Snippet */}
                {item.executiveSummary && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                    <span className="font-semibold text-slate-300">Executive Feedback: </span>
                    {item.executiveSummary}
                  </p>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs">
                    {item.conductWarningsCount > 0 ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {item.conductWarningsCount} Conduct Warning(s)
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Clean Conduct Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDebriefSession(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>View Full Scorecard</span>
                    </button>

                    {onLaunchInterview && (
                      <button
                        onClick={() => onLaunchInterview(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake Session</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Debrief Modal Replay */}
      {selectedDebriefSession && (
        <InterviewDebriefModal
          isOpen={Boolean(selectedDebriefSession)}
          onClose={() => setSelectedDebriefSession(null)}
          data={selectedDebriefSession}
          meetingConfig={{
            company: selectedDebriefSession.company,
            role: selectedDebriefSession.role,
            candidateName: selectedDebriefSession.candidateName,
          }}
        />
      )}
    </div>
  );
}
