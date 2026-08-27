"""Pydantic schemas and data models for CareerOS v3."""

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
