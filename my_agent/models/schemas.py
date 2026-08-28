import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel, Field, HttpUrl


class UserSchema(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    target_roles: List[str] = Field(default_factory=list)
    location_preferences: List[str] = Field(default_factory=list)
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DocumentChunkSchema(BaseModel):
    text: str
    chunk_index: int
    meta: Dict[str, Any] = Field(default_factory=dict)
    embedding: Optional[List[float]] = None


class DocumentSchema(BaseModel):
    id: Optional[str] = None
    user_id: str
    filename: str
    doc_type: Literal['resume', 'cover_letter', 'certificate', 'job_posting', 'portfolio', 'other'] = 'resume'
    raw_markdown: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    file_url: Optional[str] = None
    created_at: Optional[datetime] = None


class EmbeddingRecordSchema(BaseModel):
    id: Optional[str] = None
    document_id: str
    user_id: str
    chunk_text: str
    chunk_index: int
    chunk_metadata: Dict[str, Any] = Field(default_factory=dict)
    embedding: List[float]  # 768-dim Gemini vector
    similarity: Optional[float] = None
    created_at: Optional[datetime] = None


class ResumeSchema(BaseModel):
    id: Optional[str] = None
    user_id: str
    document_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education: List[Dict[str, Any]] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    raw_text: Optional[str] = None
    created_at: Optional[datetime] = None


class ResumeAnalysisSchema(BaseModel):
    id: Optional[str] = None
    resume_id: str
    user_id: str
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    experience_level: Optional[str] = None
    domain_focus: Optional[str] = None
    key_technologies: List[str] = Field(default_factory=list)
    summary: Optional[str] = None
    created_at: Optional[datetime] = None


class CandidateProfileSchema(BaseModel):
    id: Optional[str] = None
    user_id: str
    resume_id: Optional[str] = None
    tech_stack: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    career_goals: Optional[str] = None
    preferred_roles: List[str] = Field(default_factory=list)
    experience_summary: Optional[str] = None
    location_preference: Optional[str] = None
    search_keywords: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None


class OpportunitySchema(BaseModel):
    id: Optional[str] = None
    profile_id: Optional[str] = None
    user_id: str
    title: str
    url: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None
    category: Literal['job', 'internship', 'competition', 'hackathon', 'conclave'] = 'job'
    company_name: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    deadline: Optional[str] = None
    raw_data: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None


class RankedOpportunitySchema(BaseModel):
    id: Optional[str] = None
    opportunity_id: str
    profile_id: str
    user_id: str
    relevance_score: int = Field(ge=0, le=100)
    match_reasons: List[str] = Field(default_factory=list)
    rank: int
    category: Optional[str] = None
    created_at: Optional[datetime] = None


class TailoredResumeSchema(BaseModel):
    id: Optional[str] = None
    user_id: str
    profile_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    tailored_markdown: str
    pdf_url: Optional[str] = None
    ats_score: Optional[int] = Field(default=None, ge=0, le=100)
    keyword_matches: List[str] = Field(default_factory=list)
    tailored_sections: List[Dict[str, Any]] = Field(default_factory=list)
    company_alignment_notes: Optional[str] = None
    created_at: Optional[datetime] = None


# API Payload Schemas
class KnowledgeSearchRequest(BaseModel):
    query: str
    top_k: int = 10
    match_threshold: float = 0.5


class DocumentUploadResponse(BaseModel):
    status: str
    document_id: str
    filename: str
    doc_type: str
    chunk_count: int
    markdown_preview: str


class TailorResumeRequest(BaseModel):
    opportunity_id: str
    target_company: Optional[str] = None
    job_description: Optional[str] = None
    custom_instructions: Optional[str] = None


# ── ATS 90+ Autonomous Goal & Deep HR Intelligence Schemas ───────────────────

class ATSScoreRubricSchema(BaseModel):
    overall_score: int = Field(ge=0, le=100, description="Overall ATS Score (0-100)")
    keyword_score: int = Field(default=0, ge=0, le=25, description="Keyword & Tech Overlap Score (0-25)")
    role_relevance_score: int = Field(default=0, ge=0, le=20, description="Role Scope & Alignment Score (0-20)")
    impact_metrics_score: int = Field(default=0, ge=0, le=20, description="Quantified Impact & Numbers Score (0-20)")
    formatting_compatibility_score: int = Field(default=0, ge=0, le=15, description="ATS Parsing & Section Header Score (0-15)")
    culture_fit_score: int = Field(default=0, ge=0, le=10, description="Company Mission & Engineering Culture Score (0-10)")
    action_verbs_score: int = Field(default=0, ge=0, le=10, description="Strong Action Verbs & Precision Score (0-10)")
    matched_keywords: List[str] = Field(default_factory=list)
    missing_critical_keywords: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    critical_gaps: List[str] = Field(default_factory=list)
    actionable_critique: str = Field(default="", description="Precise critique instructions fed forward into next iteration")
    goal_met: bool = Field(default=False, description="True if overall_score >= 90")


class DeepCompanyJobIntelSchema(BaseModel):
    company_name: str
    job_title: str = "Software Engineer"
    industry: str = "Technology & Software"
    company_overview: str = Field(description="Comprehensive executive company background and market positioning")
    business_model_and_products: str = Field(default="", description="Core product lines, customers, and business model")
    engineering_tech_stack: List[str] = Field(default_factory=list, description="Primary languages, frameworks, cloud, databases, tools")
    engineering_culture_and_values: str = Field(default="", description="Core engineering values, shipping speed, code review ethos")
    key_values: List[str] = Field(default_factory=list)
    role_scope_and_responsibilities: List[str] = Field(default_factory=list, description="Detailed day-to-day scope and deliverables")
    required_qualifications: List[str] = Field(default_factory=list)
    preferred_qualifications: List[str] = Field(default_factory=list)
    seniority_level: str = Field(default="Mid-Senior", description="e.g. Intern, Junior, Mid, Senior, Lead, Staff")
    salary_or_level_range: Optional[str] = None
    recruiter_evaluation_criteria: List[str] = Field(default_factory=list, description="What recruiters specifically look for in applicants")
    common_interview_questions: List[str] = Field(default_factory=list, description="Top behavioral and technical interview questions")
    ats_priority_keywords: List[str] = Field(default_factory=list, description="Crucial terms to inject into resume tailoring")
    why_work_here: str = Field(default="")
    raw_sources_count: int = Field(default=1)
    status: str = "success"


class ATSIterationStepSchema(BaseModel):
    iteration: int
    ats_score: int
    score_breakdown: ATSScoreRubricSchema
    critique_fed_forward: str
    tailored_markdown: str
    changes_made: List[str] = Field(default_factory=list)
    duration_ms: int = 0


class ATSGoalPipelineResponseSchema(BaseModel):
    status: str = "success"  # success | max_iterations_reached | error
    goal_achieved: bool = False
    target_company: str
    opportunity_title: str
    initial_ats_score: int
    final_ats_score: int
    total_iterations: int
    company_job_intel: DeepCompanyJobIntelSchema
    final_tailored_markdown: str
    pdf_path: Optional[str] = None
    pdf_url: Optional[str] = None
    iteration_trace: List[ATSIterationStepSchema] = Field(default_factory=list)
    final_score_breakdown: ATSScoreRubricSchema
    boundary_conditions_met: Dict[str, Any] = Field(default_factory=dict)
    armoriq_audit_trail_count: int = 0


class ATSGoalPipelineRequestSchema(BaseModel):
    candidate_id: Optional[str] = "candidate_mohit"
    opportunity_id: Optional[str] = None
    company_name: str
    opportunity_title: str
    job_description: Optional[str] = None
    job_url: Optional[str] = None
    target_score: int = 90
    max_iterations: int = 4
    custom_instructions: Optional[str] = None


# ── AI Live Interview & Multi-Panel Schemas ──────────────────────────────────

class InterviewObservationSchema(BaseModel):
    """Real-time observational note recorded by the panel observer agent."""
    timestamp_sec: float = Field(default=0.0)
    observation_type: str = Field(description="posture | gesture | technical | behavioral | communication | eye_contact")
    observation: str = Field(description="Detailed note on what the candidate did or said")
    sentiment: str = Field(default="positive", description="positive | neutral | negative")
    impact_score: int = Field(default=0, description="Score delta from -5 to +5")


class InterviewQuestionReviewSchema(BaseModel):
    """Question-by-question review and benchmark comparison."""
    question_index: int = Field(default=1)
    question_text: str = Field(description="The question asked by the interviewer")
    interviewer_persona: str = Field(default="Lead Technical Bar-Raiser", description="Which panel member asked the question")
    candidate_answer_summary: str = Field(description="Summary of candidate's response")
    technical_accuracy_score: int = Field(default=7, description="Score 1-10 on technical accuracy")
    communication_clarity_score: int = Field(default=7, description="Score 1-10 on clarity & structure")
    strengths_in_answer: List[str] = Field(default_factory=list, description="What the candidate did well")
    critical_gaps_or_flaws: List[str] = Field(default_factory=list, description="What was missed, inaccurate, or hand-wavy")
    ideal_model_answer: str = Field(description="Comprehensive benchmark answer demonstrating 10/10 mastery")


class InterviewPanelFeedbackSchema(BaseModel):
    """Specific feedback from an individual HR panel member."""
    panel_role: str = Field(description="e.g. Lead Technical Bar-Raiser, Senior HR Director, Culture & Values Specialist")
    member_name: str = Field(default="Dr. Elena Vance")
    score: int = Field(description="Score /100 assigned by this panel member")
    verdict: str = Field(description="Strong Hire | Hire | Leaning Hire | Leaning No Hire | Strong No Hire")
    detailed_comments: str = Field(description="In-depth remarks on candidate's performance")
    key_strengths: List[str] = Field(default_factory=list)
    areas_for_growth: List[str] = Field(default_factory=list)


class InterviewDebriefSchema(BaseModel):
    """Comprehensive post-interview scorecard generated by multi-agent panel synthesis."""
    session_id: str
    candidate_id: str
    company_name: str
    job_title: str
    overall_score: int = Field(description="0-100 overall composite interview score")
    hiring_verdict: str = Field(description="Strong Hire | Hire | Leaning Hire | Leaning No Hire | Strong No Hire")
    
    # 4-Pillar Dimensional Scores
    technical_score: int = Field(description="0-30 points")
    communication_score: int = Field(description="0-25 points")
    problem_solving_score: int = Field(description="0-25 points")
    culture_fit_score: int = Field(description="0-20 points")
    
    summary_verdict: str = Field(description="Executive summary of the candidate's performance")
    top_strengths: List[str] = Field(default_factory=list)
    top_weaknesses: List[str] = Field(default_factory=list)
    body_language_and_pacing_notes: str = Field(default="", description="Observations on posture, eye contact, pacing, and tone")
    
    panel_feedback: List[InterviewPanelFeedbackSchema] = Field(default_factory=list)
    question_breakdown: List[InterviewQuestionReviewSchema] = Field(default_factory=list)
    observations_timeline: List[InterviewObservationSchema] = Field(default_factory=list)
    actionable_study_roadmap: List[str] = Field(default_factory=list)
    
    armoriq_governance_verified: bool = True
    armoriq_audit_trail_count: int = 0
    duration_seconds: int = 0
    created_at: float = Field(default_factory=time.time)


class InterviewSessionConfigSchema(BaseModel):
    """Configuration for starting a new live interview session."""
    candidate_id: str = "candidate_mohit"
    candidate_name: str = "Mohit Upraity"
    opportunity_id: Optional[str] = None
    company_name: str
    job_title: str
    job_description: Optional[str] = None
    uploaded_resume_text: Optional[str] = None
    voice_name: str = "Aoede"  # Aoede, Puck, Charon, Kore, Fenrir
    target_role_level: str = "Senior"


class InterviewDebriefRequestSchema(BaseModel):
    session_id: Optional[str] = None
    candidate_id: str = "candidate_mohit"
    company_name: str
    job_title: str
    raw_transcript: str
    uploaded_resume_text: Optional[str] = None
    observations: List[Dict[str, Any]] = Field(default_factory=list)
    duration_seconds: int = 0


