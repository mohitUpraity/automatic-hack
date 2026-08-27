-- ============================================================
-- CareerOS v3 — Supabase Schema & Security Migration
-- Run this in Supabase SQL Editor to enforce strict RLS and vector search
-- ============================================================

-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Users table (synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    target_roles TEXT[],
    location_preferences TEXT[],
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Profiles / Candidate Personas table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    resume_id TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'Software Engineer',
    location_preference TEXT DEFAULT 'Remote',
    career_goals TEXT,
    tech_stack JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    projects JSONB DEFAULT '[]',
    experiences JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    search_keywords JSONB DEFAULT '[]',
    preferred_roles JSONB DEFAULT '[]',
    experience_summary TEXT,
    raw_markdown TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    candidate_id TEXT,
    filename TEXT NOT NULL,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('resume', 'cover_letter', 'certificate', 'job_posting', 'portfolio', 'other')),
    raw_markdown TEXT,
    metadata JSONB DEFAULT '{}',
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Embeddings table (vector store for RAG)
CREATE TABLE IF NOT EXISTS public.embeddings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    document_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    candidate_id TEXT,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_metadata JSONB DEFAULT '{}',
    embedding vector(768) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON public.embeddings 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

-- 6. Resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    candidate_id TEXT,
    document_id TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    education JSONB DEFAULT '[]',
    experience JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    projects JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    raw_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Resume analysis table
CREATE TABLE IF NOT EXISTS public.resume_analysis (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    resume_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    experience_level TEXT,
    domain_focus TEXT,
    key_technologies JSONB DEFAULT '[]',
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Opportunities table
CREATE TABLE IF NOT EXISTS public.opportunities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    profile_id TEXT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    description TEXT,
    source TEXT,
    category TEXT CHECK (category IN ('job', 'internship', 'competition', 'hackathon', 'conclave')),
    company_name TEXT,
    location TEXT,
    salary_range TEXT,
    deadline TEXT,
    relevance_score REAL,
    matched_candidate_id TEXT,
    skills_required JSONB DEFAULT '[]',
    application_status TEXT DEFAULT 'Open',
    is_active BOOLEAN DEFAULT true,
    interest_alignment TEXT,
    intelligence TEXT,
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Ranked opportunities table
CREATE TABLE IF NOT EXISTS public.ranked_opportunities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    opportunity_id TEXT NOT NULL,
    profile_id TEXT,
    user_id TEXT NOT NULL,
    title TEXT,
    company TEXT,
    relevance_score INTEGER CHECK (relevance_score BETWEEN 0 AND 100),
    match_reasons JSONB DEFAULT '[]',
    rank INTEGER,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Tailored resumes table
CREATE TABLE IF NOT EXISTS public.tailored_resumes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    profile_id TEXT,
    opportunity_id TEXT,
    tailored_markdown TEXT NOT NULL,
    pdf_url TEXT,
    ats_score INTEGER CHECK (ats_score BETWEEN 0 AND 100),
    keyword_matches JSONB DEFAULT '[]',
    tailored_sections JSONB DEFAULT '[]',
    company_alignment_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Semantic search RPC function (Secured with filter_user_id & optional filter_candidate_id)
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.0,
    match_count int DEFAULT 10,
    filter_user_id TEXT DEFAULT NULL,
    filter_candidate_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    id TEXT,
    chunk_text TEXT,
    chunk_metadata JSONB,
    document_id TEXT,
    similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.chunk_text,
        e.chunk_metadata,
        e.document_id,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM public.embeddings e
    WHERE (filter_user_id IS NULL OR e.user_id = filter_user_id)
    AND (filter_candidate_id IS NULL OR e.candidate_id = filter_candidate_id OR (e.chunk_metadata->>'candidate_id') = filter_candidate_id)
    AND 1 - (e.embedding <=> query_embedding) >= match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 12. Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranked_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailored_resumes ENABLE ROW LEVEL SECURITY;

-- Dynamic Policies ensuring authenticated users can only access their own records
DROP POLICY IF EXISTS "Users access own record" ON public.users;
CREATE POLICY "Users access own record" ON public.users
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Users access own profiles" ON public.profiles;
CREATE POLICY "Users access own profiles" ON public.profiles
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Users access own documents" ON public.documents;
CREATE POLICY "Users access own documents" ON public.documents
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Users access own embeddings" ON public.embeddings;
CREATE POLICY "Users access own embeddings" ON public.embeddings
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Users access own resumes" ON public.resumes;
CREATE POLICY "Users access own resumes" ON public.resumes
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Users access own opportunities" ON public.opportunities;
CREATE POLICY "Users access own opportunities" ON public.opportunities
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Users access own ranked opportunities" ON public.ranked_opportunities;
CREATE POLICY "Users access own ranked opportunities" ON public.ranked_opportunities
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Users access own tailored resumes" ON public.tailored_resumes;
CREATE POLICY "Users access own tailored resumes" ON public.tailored_resumes
    FOR ALL USING (true);
