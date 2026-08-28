export type SeniorityLevel = "Junior" | "Mid-Level" | "Senior" | "Staff / Principal" | "Engineering Lead";

export type InterviewFormat =
  | "Full Technical & Coding"
  | "System Design & Architecture"
  | "Behavioral & Leadership (STAR)"
  | "Frontend & Web Engineering"
  | "Backend & Distributed Systems"
  | "Machine Learning & AI Engineering"
  | "Product Management & Execution";

export type InterviewerVoice = "Zephyr" | "Kore" | "Aoede" | "Puck" | "Fenrir" | "Charon";

export interface InterviewerProfile {
  name: string;
  role: string;
  company: string;
  avatarUrl: string;
  voice: InterviewerVoice;
  personality: string;
  accentColor: string;
}

export interface InterviewConfig {
  candidateName: string;
  role: string;
  seniority: SeniorityLevel;
  format: InterviewFormat;
  interviewerProfile: InterviewerProfile;
  resumeText: string;
  jobDescription: string;
  customRequirements: string;
  durationMinutes: number;
}

export interface TranscriptItem {
  id: string;
  speaker: "ai" | "user" | "system";
  speakerName: string;
  text: string;
  timestamp: string;
  isFinal: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "ai" | "user" | "system";
  senderName: string;
  text: string;
  timestamp: string;
  isCodeSnippet?: boolean;
}

export interface EvaluationMetric {
  category: string;
  score: number;
  feedback: string;
}

export interface QuestionBreakdown {
  topic: string;
  candidateResponseQuality: "Exceptional" | "Solid" | "Adequate" | "Needs Improvement";
  interviewerNotes: string;
}

export interface EvaluationReport {
  overallScore: number;
  hiringDecision: "Strong Hire" | "Hire" | "Lean Hire" | "Lean No Hire" | "No Hire";
  executiveSummary: string;
  metrics: EvaluationMetric[];
  topStrengths: string[];
  areasForImprovement: string[];
  questionBreakdown: QuestionBreakdown[];
  actionableStudyRoadmap: string[];
}

export type MeetingLayout = "split" | "interviewer_focus" | "candidate_focus" | "code_split" | "whiteboard_split";

export interface RubricStage {
  id: string;
  title: string;
  targetMinutes: number;
  description: string;
  completed: boolean;
}

export interface LiveAnalytics {
  userSpeakingSeconds: number;
  aiSpeakingSeconds: number;
  interruptionCount: number;
  turnCount: number;
  paceWpm: number;
}
