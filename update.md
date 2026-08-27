# CareerOS v3 — Architecture Evolution Plan

> **Status:** 📋 DECISIONS LOCKED — Ready to implement  
> **Hackathon Track:** Problem 2 — "Who authorized that?" (ArmorIQ Multi-Agent Delegation & Governance)  
> **Golden Rule:** Every change MUST preserve the 5 ArmorIQ pillars: `capture_plan()`, `delegate()`, `invoke()`, separate keypairs, scope violation demo

---

## 0. Decisions Summary (LOCKED IN)

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Database** | ✅ Full Supabase + pgvector (no SQLite) | One service, relational + vector in same DB |
| **Embedding model** | ✅ Gemini Embedding 001 (API, free) | Free 30K req/day, 768d vectors, better quality, Google ecosystem fit |
| **Document reading** | ✅ Docling (replaces pypdf) | Handles PDF, DOCX, images, scanned docs, tables |
| **Resume PDF generation** | ✅ WeasyPrint (HTML/CSS → PDF) | LLM writes markdown → HTML template → WeasyPrint → PDF |
| **Auth** | ✅ Google Auth via Supabase Auth | One-click login, multi-user from day 1 |
| **Frontend framework** | ✅ Stay on React + Vite | Simpler, less to break |
| **New sub-agents** | ✅ 3 new (doc_processor, knowledge_builder, resume_tailor) → 8 total | Each with own keypair + MCP server |
| **SQLite fallback** | ❌ No — full migration to Supabase | Clean break, no dual-write complexity |

---

## 1. What We Have Today (Current State)

```
User uploads PDF/text → pypdf extracts text → LLM parses fields →
SQLite stores resume → LLM analyzes → LLM builds profile →
Firecrawl scouts opportunities → LLM ranks them → Display results
```

### Current Pain Points

| Problem | Impact |
|---------|--------|
| **pypdf is fragile** — Can't handle scanned PDFs, DOCX, images, complex layouts | Users with non-trivial resumes get garbage extraction |
| **PDF upload bug** — Documents uploaded from frontend don't reach backend properly | Critical blocker — the core feature is broken |
| **No knowledge base** — Each resume is processed in isolation, no memory | Can't cross-reference, can't build rich context |
| **No RAG pipeline** — LLM gets raw text dumps, no semantic retrieval | LLM hallucinates or misses nuanced info |
| **No profile enrichment** — Can't pull LinkedIn, GitHub, portfolio data | Profile is only as good as what's in the resume |
| **No resume tailoring** — Finds opportunities but can't customize resume per company | The most valuable feature is missing |
| **LLM used for everything** — Even simple parsing that tools could handle | Slow, expensive, unreliable for structured extraction |
| **SQLite only** — No vector search, no embeddings, no semantic queries | Can't do similarity matching or RAG retrieval |
| **No Pydantic models** — Data flows as loose dicts/JSON strings | Runtime errors, no validation, hard to debug |
| **Frontend is monolithic** — 73KB single `App.jsx` | Impossible to maintain or extend |

---

## 2. What We Want (Target State)

```
User creates profile (Google Auth) → uploads ANY document(s) →
Docling converts to structured markdown → chunks are embedded (Gemini Embedding, free) →
stored in Supabase pgvector → knowledge base built →
user requests opportunities → RAG retrieves relevant context → Firecrawl crawls web →
opportunities displayed → user selects one →
resume tailored for that company → WeasyPrint generates PDF → download
```

### The 6-Step User Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CareerOS v3 User Flow                                  │
│                                                                                  │
│  ① SIGN IN (Google Auth via Supabase)                                            │
│     • One-click Google login                                                     │
│     • Profile auto-created from Google account info                              │
│     • Add target roles, location preferences, LinkedIn/GitHub URLs               │
│                                                                                  │
│  ② UPLOAD DOCUMENTS (any combination)                                            │
│     • Resume (PDF, DOCX, images, scanned docs — Docling handles ALL)            │
│     • Cover letters, portfolios, certificates                                    │
│     • Company JDs or job postings (URL or file)                                  │
│     • LinkedIn URL, GitHub URL, personal website URL                             │
│                                                                                  │
│  ③ DOCUMENT PROCESSING PIPELINE (Docling + RAG)                                 │
│     • Docling converts everything → structured markdown                          │
│     • HierarchicalChunker breaks into semantic chunks                            │
│     • Gemini Embedding 001 embeds each chunk (FREE, 30K req/day)                │
│     • Chunks + embeddings stored in Supabase pgvector                           │
│     • Knowledge base built from all user documents + crawled profiles            │
│                                                                                  │
│  ④ REQUEST OPPORTUNITIES                                                         │
│     • System uses RAG to retrieve relevant user context from vector DB           │
│     • Firecrawl + web crawling discover live opportunities                       │
│     • LLM ranks using retrieved context (not raw text dumps)                     │
│     • Results stored in Supabase + displayed in frontend                         │
│                                                                                  │
│  ⑤ SELECT OPPORTUNITY                                                            │
│     • User picks an opportunity from ranked list                                 │
│     • System uses Firecrawl to crawl company website/JD                         │
│     • Docling processes the crawled HTML into structured data                    │
│     • Gathers company culture, tech stack, job requirements                      │
│                                                                                  │
│  ⑥ TAILORED RESUME GENERATION                                                   │
│     • RAG retrieves user's relevant experiences/skills from knowledge base       │
│     • LLM generates company-specific resume content (markdown)                   │
│     • Content rendered into styled HTML template                                 │
│     • WeasyPrint converts HTML → professional PDF                               │
│     • ATS optimization check                                                     │
│     • Download PDF                                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ArmorIQ Compliance — What MUST NOT Change

> [!CAUTION]
> The hackathon rules are sacred. Every architectural change must fit WITHIN the ArmorIQ governance model, not around it.

### Hackathon Rules We Must Preserve

| Rule | Current Implementation | After v3 |
|------|----------------------|----------|
| **Every sub-agent has ≥1 MCP tool** | 5 sub-agents, 5 MCP servers | Same 5 + 3 new sub-agents with their own MCP servers |
| **Separate keypairs per sub-agent** | RSA keypairs in `armoriq_crypto.py` | Extended to 8 sub-agents |
| **Demo scope violation** | `auto_apply_job` blocked | Same demo preserved + new violation demos |
| **Use `capture_plan()`, `delegate()`, `invoke()`** | Full implementation in `armoriq_wrapper.py` | Same — new tools wired through same governance |
| **Bonus: Token expiry** | 300s TTL tokens | Same |

### Full 8-Agent Architecture with ArmorIQ

```
                       ┌────────────────────────────────┐
                       │     Root Coordinator Agent     │
                       │   capture_plan() + delegate()  │
                       └───────────────┬────────────────┘
                                       │
          ┌────────────┬───────────┬────┴────┬───────────┬────────────┬───────────┬────────────┐
          ▼            ▼           ▼         ▼           ▼            ▼           ▼            ▼
     Sub-Agent 1  Sub-Agent 2  Sub-Agent 3  Sub-Agent 4  Sub-Agent 5  Sub-Agent 6  Sub-Agent 7  Sub-Agent 8
     DocProc      Extractor    Analyzer     Profiler     Scout        Ranker       Knowledge    Tailor
     (KP1)        (KP2)        (KP3)        (KP4)        (KP5)        (KP6)        (KP7)        (KP8)
          │            │           │         │           │            │           │            │
          ▼            ▼           ▼         ▼           ▼            ▼           ▼            ▼
     MCP Srv 1    MCP Srv 2   MCP Srv 3   MCP Srv 4   MCP Srv 5   MCP Srv 6   MCP Srv 7   MCP Srv 8
     (invoke())   (invoke())  (invoke())  (invoke())  (invoke())  (invoke())  (invoke())  (invoke())
          │
          └──── ArmorIQ Scope Check ────┐
                                        │
                        ┌───────────────┴───────────────┐
                        ▼                               ▼
                 [ALLOWED]                        [BLOCKED]
              Execute + Log                   Rejection + Audit
```

### Sub-Agent Scope Matrix (All 8)

| # | Sub-Agent | Keypair | MCP Server | Authorized Scope | Tool Name |
|---|-----------|---------|------------|-------------------|-----------|
| 1 | `document_processor` | `keypair_docproc` | `mcp_docproc_server` | `documents:write`, `embeddings:write` | `process_and_embed_document` |
| 2 | `resume_extractor` | `keypair_extractor` | `mcp_extractor_server` | `resumes:write` | `extract_and_store_resume` |
| 3 | `resume_analyzer` | `keypair_analyzer` | `mcp_analyzer_server` | `resumes:read`, `analysis:write` | `analyze_and_store_resume` |
| 4 | `profile_maker` | `keypair_profiler` | `mcp_profiler_server` | `analysis:read`, `profiles:write` | `build_and_store_profile` |
| 5 | `opportunity_scout` | `keypair_scout` | `mcp_scout_server` | `profiles:read`, `opportunities:write`, `web:search` | `scout_and_store_opportunities` |
| 6 | `opportunity_ranker` | `keypair_ranker` | `mcp_ranker_server` | `opportunities:read`, `ranked:write` | `rank_and_store_opportunities` |
| 7 | `knowledge_builder` | `keypair_knowledge` | `mcp_knowledge_server` | `embeddings:read`, `knowledge:write`, `web:crawl` | `build_knowledge_base` |
| 8 | `resume_tailor` | `keypair_tailor` | `mcp_tailor_server` | `knowledge:read`, `profiles:read`, `resumes:write` | `tailor_resume_for_opportunity` |

### Scope Violation Demos

| Demo | What Happens |
|------|-------------|
| **Original:** `opportunity_scout` → `auto_apply_job` | ArmorIQ blocks — tool not in delegated scope ✅ |
| **New:** `resume_tailor` → `delete_knowledge_base` | ArmorIQ blocks — destructive action outside scope ✅ |
| **New:** `knowledge_builder` → `scout_and_store_opportunities` | ArmorIQ blocks — wrong agent's job ✅ |

---

## 4. Technology Stack (Final)

### 4A. Document Reading: Docling (FREE)

Docling is an open-source document conversion library from IBM. It handles:

| Input Type | How Docling Processes It |
|-----------|------------------------|
| PDF (text-based) | Direct text extraction with layout analysis |
| PDF (scanned/image) | Built-in OCR (EasyOCR or Tesseract) |
| DOCX | Native parsing |
| Images (PNG, JPG) | OCR extraction |
| HTML (web pages) | HTML → structured markdown |
| PowerPoint (PPTX) | Slide content extraction |

**Output:** Structured `DoclingDocument` → export to Markdown → feed to chunker

```python
# my_agent/tools/docling_tools.py
from docling.document_converter import DocumentConverter
from docling_core.transforms.chunker import HierarchicalChunker

def convert_document(file_path: str) -> dict:
    """Converts ANY document to structured markdown + chunks using Docling.
    
    This is a DETERMINISTIC tool — no LLM needed.
    Handles: PDF, DOCX, images, scanned docs, HTML, PPTX.
    """
    converter = DocumentConverter()
    result = converter.convert(file_path)
    doc = result.document
    
    # Export to clean markdown
    markdown = doc.export_to_markdown()
    
    # Chunk with layout-aware hierarchical chunker
    chunker = HierarchicalChunker(
        max_tokens=512,       # Each chunk ≤ 512 tokens
        overlap_tokens=50,    # 50 token overlap between chunks
    )
    chunks = list(chunker.chunk(doc))
    
    return {
        "status": "success",
        "markdown": markdown,
        "chunk_count": len(chunks),
        "chunks": [
            {
                "text": chunk.text,
                "meta": {
                    "heading": getattr(chunk, 'heading', ''),
                    "page": getattr(chunk, 'page_no', None),
                }
            }
            for chunk in chunks
        ],
    }
```

> [!IMPORTANT]
> **Docling reads documents. WeasyPrint writes PDFs. They serve opposite purposes.**
> - Docling: PDF/DOCX/Image → Markdown (READING)
> - WeasyPrint: HTML/CSS → PDF (WRITING tailored resumes)

---

### 4B. Embeddings: Gemini Embedding 001 (FREE, API)

> [!NOTE]
> **This is 100% free.** Google's Gemini Embedding API has a generous free tier:
> - 100 requests/minute, 30,000 requests/day, 1K tokens/minute
> - 768-dimension vectors — significantly better quality than MiniLM (384d)
> - Separate `RETRIEVAL_DOCUMENT` vs `RETRIEVAL_QUERY` task types for optimal search
> - Already in the Google ecosystem (Google ADK, Gemini models)
> - Future-proof: Gemini Embedding 2 adds multimodal (images, PDFs, video)

```python
# my_agent/tools/embedding_tools.py
import google.generativeai as genai
import os

# Configure once at module level
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

EMBEDDING_MODEL = "models/gemini-embedding-001"

def embed_text(text: str) -> list[float]:
    """Generate a 768-dimension embedding vector for storing documents.
    
    Uses RETRIEVAL_DOCUMENT task type — optimized for document storage.
    FREE — Gemini API free tier (30K req/day).
    """
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="RETRIEVAL_DOCUMENT"
    )
    return result['embedding']  # 768-dim vector

def embed_query(query: str) -> list[float]:
    """Generate embedding for a search query.
    
    Uses RETRIEVAL_QUERY task type — optimized for search queries.
    This asymmetric embedding gives better search results.
    """
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=query,
        task_type="RETRIEVAL_QUERY"
    )
    return result['embedding']  # 768-dim vector

def embed_chunks(chunks: list[dict]) -> list[dict]:
    """Embed multiple text chunks in batch.
    
    Gemini supports batch embedding — pass list of texts.
    """
    texts = [c["text"] for c in chunks]
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=texts,
        task_type="RETRIEVAL_DOCUMENT"
    )
    for i, chunk in enumerate(chunks):
        chunk["embedding"] = result['embedding'][i]
    return chunks
```

**Performance:**
- 768-dimension vectors (2x richer than MiniLM's 384)
- Asymmetric search: `RETRIEVAL_DOCUMENT` for storage, `RETRIEVAL_QUERY` for search
- Free tier: 100 RPM, 30K requests/day
- Cosine similarity for matching
- Future: Upgrade to Gemini Embedding 2 for multimodal (images, video, audio)

---

### 4C. Database: Supabase + pgvector (FULL MIGRATION)

**No SQLite.** Everything goes to Supabase from day 1.

#### Supabase Setup Checklist

1. Create Supabase project at https://supabase.com
2. Enable pgvector extension in SQL editor: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Enable Google Auth in Authentication → Providers → Google
4. Get project URL + anon key + service role key
5. Run the schema migration SQL below

#### Full Database Schema

```sql
-- ============================================================
-- CareerOS v3 — Supabase Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Users table (synced with Supabase Auth)
-- Supabase Auth creates auth.users automatically.
-- This is our public profile table.
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    target_roles TEXT[],              -- Array of target job roles
    location_preferences TEXT[],     -- Array of preferred locations
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. Documents table (Docling outputs go here)
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('resume', 'cover_letter', 'certificate', 'job_posting', 'portfolio', 'other')),
    raw_markdown TEXT,               -- Full Docling markdown output
    metadata JSONB DEFAULT '{}',     -- Docling metadata (pages, tables, etc.)
    file_url TEXT,                   -- Supabase Storage URL for original file
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Embeddings table (vector store for RAG)
CREATE TABLE public.embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,    -- Order within document
    chunk_metadata JSONB DEFAULT '{}',
    embedding vector(768) NOT NULL,  -- Gemini Embedding 001 output dimension
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast vector similarity search
CREATE INDEX ON public.embeddings 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

-- 5. Semantic search function
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 10,
    filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    chunk_text TEXT,
    chunk_metadata JSONB,
    document_id UUID,
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
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 6. Resumes table (structured extraction output)
CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
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
CREATE TABLE public.resume_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    experience_level TEXT,
    domain_focus TEXT,
    key_technologies JSONB DEFAULT '[]',
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    tech_stack JSONB DEFAULT '[]',
    interests JSONB DEFAULT '[]',
    career_goals TEXT,
    preferred_roles JSONB DEFAULT '[]',
    experience_summary TEXT,
    location_preference TEXT,
    search_keywords JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Opportunities table
CREATE TABLE public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    description TEXT,
    source TEXT,
    category TEXT CHECK (category IN ('job', 'internship', 'competition', 'hackathon', 'conclave')),
    company_name TEXT,
    location TEXT,
    salary_range TEXT,
    deadline TEXT,
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Ranked opportunities table
CREATE TABLE public.ranked_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    relevance_score INTEGER CHECK (relevance_score BETWEEN 0 AND 100),
    match_reasons JSONB DEFAULT '[]',
    rank INTEGER,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Tailored resumes table (NEW)
CREATE TABLE public.tailored_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    tailored_markdown TEXT NOT NULL,     -- LLM-generated tailored content
    pdf_url TEXT,                        -- Supabase Storage URL for generated PDF
    ats_score INTEGER CHECK (ats_score BETWEEN 0 AND 100),
    keyword_matches JSONB DEFAULT '[]',
    tailored_sections JSONB DEFAULT '[]',
    company_alignment_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Row Level Security (multi-user isolation)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranked_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailored_resumes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own documents" ON public.documents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own embeddings" ON public.embeddings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own resumes" ON public.resumes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analysis" ON public.resume_analysis
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profiles" ON public.profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own opportunities" ON public.opportunities
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own ranked" ON public.ranked_opportunities
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tailored" ON public.tailored_resumes
    FOR ALL USING (auth.uid() = user_id);

-- Service role bypasses RLS for backend operations
-- (Supabase service_role key automatically bypasses RLS)
```

---

### 4D. Resume PDF Generation: WeasyPrint (FREE)

**The flow: Reading vs Writing documents**

```
READING (Docling):     User's PDF/DOCX → Docling → Markdown → Chunks → Embeddings
WRITING (WeasyPrint):  LLM Markdown → HTML Template → CSS Styling → WeasyPrint → PDF
```

```python
# my_agent/tools/tailor_tools.py
import markdown
from weasyprint import HTML

# Professional resume HTML/CSS template
RESUME_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a2e; }
    h1 { font-size: 28px; margin-bottom: 4px; color: #16213e; }
    h2 { font-size: 16px; border-bottom: 2px solid #0f3460; padding-bottom: 4px; margin-top: 20px; color: #0f3460; }
    h3 { font-size: 14px; margin-bottom: 2px; }
    p, li { font-size: 12px; line-height: 1.5; }
    .header-info { color: #555; font-size: 12px; }
    ul { padding-left: 20px; }
    .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill-tag { background: #e8f0fe; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
</style>
</head>
<body>
{content}
</body>
</html>
"""

def generate_tailored_pdf(tailored_markdown: str, output_path: str) -> dict:
    """Converts tailored resume markdown to professional PDF using WeasyPrint.
    
    This is a DETERMINISTIC tool — no LLM needed.
    """
    # Convert markdown to HTML
    html_content = markdown.markdown(tailored_markdown, extensions=['tables', 'fenced_code'])
    
    # Inject into styled template
    full_html = RESUME_TEMPLATE.replace("{content}", html_content)
    
    # Generate PDF
    HTML(string=full_html).write_pdf(output_path)
    
    return {
        "status": "success",
        "pdf_path": output_path,
        "message": "Tailored resume PDF generated successfully"
    }
```

---

### 4E. Auth: Google Sign-In via Supabase

**Backend (FastAPI):**
```python
# Supabase handles the OAuth flow. Backend just verifies the JWT.
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Middleware: Extract user_id from Supabase JWT
async def get_current_user(authorization: str = Header(None)):
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    return user.user.id
```

**Frontend (React):**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Google login — one click
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.location.origin }
})
```

---

## 5. Complete File-by-File Architecture

### Backend Structure

```
automatic-hack/
├── api.py                              # REFACTOR: FastAPI with Supabase + auth middleware
├── .env                                # ADD: Supabase credentials
├── requirements.txt                    # UPDATE: New dependencies
│
├── my_agent/
│   ├── __init__.py
│   ├── agent.py                        # REFACTOR: 8 sub-agents instead of 5
│   ├── armoriq_crypto.py               # EXTEND: 8 keypairs instead of 5
│   ├── armoriq_wrapper.py              # KEEP: No changes needed
│   │
│   ├── models/                         # NEW DIRECTORY
│   │   ├── __init__.py
│   │   └── schemas.py                  # Pydantic models for ALL data
│   │
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── db_tools.py                 # REWRITE: Supabase client (replaces SQLite)
│   │   ├── docling_tools.py            # NEW: Document conversion + chunking
│   │   ├── embedding_tools.py          # NEW: Gemini Embedding 001 + batch processing
│   │   ├── knowledge_tools.py          # NEW: RAG retrieval (vector search)
│   │   ├── firecrawl_tools.py          # NEW: Enhanced crawling (company details)
│   │   ├── tailor_tools.py             # NEW: Resume tailoring + WeasyPrint PDF
│   │   ├── resume_tools.py             # REFACTOR: Uses Docling instead of LLM parsing
│   │   ├── analysis_tools.py           # KEEP: LLM-powered (this IS intelligent work)
│   │   ├── profile_tools.py            # REFACTOR: Uses knowledge base
│   │   ├── search_tools.py             # KEEP: Firecrawl search
│   │   ├── ranking_tools.py            # REFACTOR: Uses RAG context
│   │   └── llm_tools.py               # KEEP: LiteLLM + Groq wrapper
│   │
│   └── mcp_servers/
│       ├── __init__.py
│       ├── mcp_docproc_server.py       # NEW
│       ├── mcp_extractor_server.py     # REFACTOR
│       ├── mcp_analyzer_server.py      # KEEP
│       ├── mcp_profiler_server.py      # REFACTOR
│       ├── mcp_scout_server.py         # REFACTOR
│       ├── mcp_ranker_server.py        # REFACTOR
│       ├── mcp_knowledge_server.py     # NEW
│       └── mcp_tailor_server.py        # NEW
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx                # NEW: Google login
│   │   │   ├── ProfileCreator.jsx      # NEW: Create/edit profile
│   │   │   ├── DocumentUploader.jsx    # NEW: Multi-file upload
│   │   │   ├── KnowledgeBase.jsx       # NEW: View processed documents
│   │   │   ├── OpportunityBoard.jsx    # NEW: Browse ranked opportunities
│   │   │   ├── ResumeTailor.jsx        # NEW: Tailor + download PDF
│   │   │   ├── ArmorIQConsole.jsx      # EXTRACT: From App.jsx
│   │   │   ├── ChatAssistant.jsx       # EXTRACT: From App.jsx
│   │   │   └── common/
│   │   │       ├── Header.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       └── StepTracker.jsx
│   │   ├── api/
│   │   │   └── client.js              # NEW: Typed API client with auth
│   │   ├── lib/
│   │   │   └── supabase.js            # NEW: Supabase client init
│   │   ├── App.jsx                    # REWRITE: Router + layout only
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json                   # UPDATE: Add @supabase/supabase-js
│
├── tests/                             # NEW DIRECTORY
│   ├── test_docling.py                # Test document conversion
│   ├── test_embeddings.py             # Test embedding generation
│   ├── test_supabase.py               # Test DB operations
│   ├── test_rag.py                    # Test vector search retrieval
│   ├── test_tailor.py                 # Test resume tailoring
│   ├── test_pipeline.py               # Test full 8-stage pipeline
│   └── test_armoriq.py                # Test scope violations
│
├── GOAL.md                            # KEEP
├── README.md                          # UPDATE
├── DEMO_GUIDE.md                      # UPDATE
├── update.md                          # THIS FILE
└── Dockerfile                         # NEW: For deployment
```

---

## 6. The Full Document Upload → Display Pipeline (Fixing the PDF Bug)

> [!CAUTION]
> **The current PDF upload is broken.** Documents uploaded from the frontend don't reach the backend properly. Here's the complete fixed flow:

### Current Broken Flow
```
Frontend: FormData with file → POST /api/upload-resume-pdf →
Backend: pypdf tries to read → FAILS on complex PDFs → garbage output
```

### New Fixed Flow
```
Frontend: FormData with file + auth token
    → POST /api/documents/upload
    → Backend receives file bytes ✓
    → Saves original to Supabase Storage ✓
    → Docling converts to markdown ✓
    → HierarchicalChunker creates chunks ✓
    → Gemini Embedding embeds each chunk ✓
    → Store: document record + chunks + embeddings in Supabase ✓
    → Return: document_id + chunk_count + preview
```

### Backend Endpoint (Fixed)

```python
# api.py — Fixed document upload endpoint

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("resume"),
    user_id: str = Depends(get_current_user),
):
    """Upload ANY document. Docling processes it. Embeddings stored in pgvector."""
    
    # 1. Save file to temp location
    temp_path = f"/tmp/{file.filename}"
    contents = await file.read()
    with open(temp_path, "wb") as f:
        f.write(contents)
    
    # 2. Upload original to Supabase Storage
    storage_path = f"documents/{user_id}/{file.filename}"
    supabase.storage.from_("documents").upload(storage_path, contents)
    file_url = supabase.storage.from_("documents").get_public_url(storage_path)
    
    # 3. Docling converts to markdown + chunks (NO LLM needed)
    doc_result = convert_document(temp_path)  # docling_tools.py
    
    # 4. Store document record
    doc_record = supabase.table("documents").insert({
        "user_id": user_id,
        "filename": file.filename,
        "doc_type": doc_type,
        "raw_markdown": doc_result["markdown"],
        "metadata": {"chunk_count": doc_result["chunk_count"]},
        "file_url": file_url,
    }).execute()
    document_id = doc_record.data[0]["id"]
    
    # 5. Embed chunks (FREE — Gemini Embedding API)
    embedded_chunks = embed_chunks(doc_result["chunks"])  # embedding_tools.py
    
    # 6. Store embeddings in pgvector
    for i, chunk in enumerate(embedded_chunks):
        supabase.table("embeddings").insert({
            "document_id": document_id,
            "user_id": user_id,
            "chunk_text": chunk["text"],
            "chunk_index": i,
            "chunk_metadata": chunk.get("meta", {}),
            "embedding": chunk["embedding"],  # 768-dim vector
        }).execute()
    
    # 7. Clean up temp file
    os.remove(temp_path)
    
    return {
        "status": "success",
        "document_id": document_id,
        "filename": file.filename,
        "doc_type": doc_type,
        "chunk_count": len(embedded_chunks),
        "markdown_preview": doc_result["markdown"][:500],
    }
```

### Frontend Upload (Fixed)

```javascript
// components/DocumentUploader.jsx

async function uploadDocument(file, docType) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${API_BASE}/api/documents/upload`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${session.access_token}`,
            // DO NOT set Content-Type — browser sets it with boundary for FormData
        },
        body: formData,
    });
    
    return await response.json();
}
```

> [!WARNING]
> **Common bug that caused the previous failure:** Setting `Content-Type: application/json` when sending `FormData`. The browser must set its own `Content-Type: multipart/form-data; boundary=...` header. Never manually set it for file uploads.

---

## 7. RAG Pipeline — Detailed Flow

### Ingestion (When User Uploads)

```
User uploads file
    │
    ▼
┌──────────────────────┐
│ 1. Docling Convert   │  ← DETERMINISTIC (no LLM)
│    File → Markdown   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 2. Hierarchical      │  ← DETERMINISTIC (no LLM)
│    Chunker           │
│    Markdown → Chunks │
│    (512 tokens each, │
│     50 token overlap)│
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 3. Gemini Embed      │  ← FREE API (30K req/day)
│    Each chunk → 768d │
│    vector            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 4. Store in Supabase │  ← DATABASE WRITE
│    documents table   │
│    embeddings table  │
│    (pgvector)        │
└──────────────────────┘
```

### Retrieval (When Agent Needs Context)

```python
# my_agent/tools/knowledge_tools.py

def search_knowledge_base(query: str, user_id: str, top_k: int = 10) -> list[dict]:
    """Semantic search over user's knowledge base using RAG.
    
    1. Embed the query (Gemini Embedding, free)
    2. pgvector cosine similarity search
    3. Return top-K most relevant chunks with metadata
    """
    # Step 1: Embed query
    query_embedding = embed_text(query)  # Free, local
    
    # Step 2: Vector search via Supabase RPC
    results = supabase.rpc("match_embeddings", {
        "query_embedding": query_embedding,
        "match_threshold": 0.5,
        "match_count": top_k,
        "filter_user_id": user_id,
    }).execute()
    
    return results.data


def get_rag_context(query: str, user_id: str) -> str:
    """Build LLM context from RAG retrieval.
    
    Returns a formatted string of relevant chunks for the LLM prompt.
    """
    chunks = search_knowledge_base(query, user_id, top_k=8)
    
    if not chunks:
        return "No relevant information found in knowledge base."
    
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        meta = chunk.get("chunk_metadata", {})
        section = meta.get("heading", "General")
        context_parts.append(f"[Source {i} — {section}]\n{chunk['chunk_text']}")
    
    return "\n\n---\n\n".join(context_parts)
```

---

## 8. Resume Tailoring — Full Pipeline

### Step-by-Step Flow

```
User selects opportunity
    │
    ▼
┌──────────────────────────┐
│ 1. Company Research      │  ← TOOL (Firecrawl crawl, no LLM)
│    Crawl company website │
│    Crawl job posting URL │
│    Extract requirements  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 2. RAG Retrieval         │  ← TOOL (vector search, no LLM)
│    Query: "experiences   │
│    matching [company     │
│    tech stack + role     │
│    requirements]"        │
│    Returns top-K chunks  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 3. LLM Generation        │  ← LLM (this IS intelligent work)
│    Input:                │
│    - Company profile     │
│    - Job requirements    │
│    - Relevant user       │
│      chunks from RAG     │
│    - User profile        │
│    Output:               │
│    - Tailored resume     │
│      markdown            │
│    - ATS keywords        │
│    - Alignment notes     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 4. PDF Generation        │  ← TOOL (WeasyPrint, no LLM)
│    Markdown → HTML       │
│    HTML + CSS template   │
│    → WeasyPrint → PDF    │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 5. Store & Return        │  ← TOOL (Supabase, no LLM)
│    Save tailored_resumes │
│    Upload PDF to Storage │
│    Return download URL   │
└──────────────────────────┘
```

---

## 9. Environment Variables

```env
# ── Existing (unchanged) ──
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=groq/openai/gpt-oss-20b
FIRECRAWL_API_KEY=fc-your_firecrawl_api_key_here

# ── New ──
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

---

## 10. Dependencies

```
# requirements.txt — FULL LIST

# Core
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
python-dotenv>=1.0.0
python-multipart>=0.0.6
pydantic>=2.0

# Document Processing
docling>=2.0
docling-core>=2.0

# Embeddings (FREE — Gemini API)
google-generativeai>=0.8.0

# Database
supabase>=2.0

# LLM
litellm>=1.0

# PDF Generation
weasyprint>=60.0
markdown>=3.5

# Existing
pypdf>=4.0              # Can remove after migration, but keep for now
```

---

## 11. Complete API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| **Auth** | | | |
| `/api/auth/callback` | `GET` | No | Supabase OAuth callback |
| **Users** | | | |
| `/api/users/me` | `GET` | ✅ | Get current user profile |
| `/api/users/me` | `PUT` | ✅ | Update user profile (target roles, URLs) |
| **Documents** | | | |
| `/api/documents/upload` | `POST` | ✅ | Upload any document (multipart) |
| `/api/documents/upload-url` | `POST` | ✅ | Process a URL (LinkedIn, GitHub, JD) |
| `/api/documents` | `GET` | ✅ | List user's documents |
| `/api/documents/{doc_id}` | `GET` | ✅ | Get document + markdown + chunks |
| `/api/documents/{doc_id}` | `DELETE` | ✅ | Delete document + embeddings |
| **Knowledge Base** | | | |
| `/api/knowledge/search` | `POST` | ✅ | RAG semantic search |
| `/api/knowledge/stats` | `GET` | ✅ | Knowledge base stats |
| **Pipeline** | | | |
| `/api/process-resume` | `POST` | ✅ | Trigger full 8-stage pipeline |
| `/api/upload-resume-pdf` | `POST` | ✅ | Upload PDF + trigger pipeline |
| **Profiles** | | | |
| `/api/profiles` | `GET` | ✅ | List all candidate profiles |
| `/api/profiles/{id}` | `GET` | ✅ | Get full profile payload |
| `/api/profiles/{id}` | `DELETE` | ✅ | Delete profile |
| **Opportunities** | | | |
| `/api/profiles/{id}/opportunities` | `GET` | ✅ | Get opportunities for profile |
| `/api/opportunities/{id}/company` | `GET` | ✅ | Get crawled company details |
| **Tailoring** | | | |
| `/api/tailor` | `POST` | ✅ | Generate tailored resume |
| `/api/tailor/{id}` | `GET` | ✅ | Get tailored resume |
| `/api/tailor/{id}/download` | `GET` | ✅ | Download PDF |
| **Chat** | | | |
| `/api/query-db` | `POST` | ✅ | RAG-powered Q&A (replaces keyword matching) |
| **ArmorIQ** | | | |
| `/api/audit-logs` | `GET` | ✅ | Governance audit trail |
| `/api/demo/trigger-attack` | `POST` | ✅ | Scope violation demo |

---

## 12. Testing Plan — How To Verify Each Function Works

> [!IMPORTANT]
> Every function gets its own test. Run tests before integrating. No more "upload and pray."

### Test 1: Docling Document Conversion

```python
# tests/test_docling.py
"""Test that Docling can convert documents to markdown + chunks."""

def test_pdf_conversion():
    """Upload a real PDF and verify Docling output."""
    from my_agent.tools.docling_tools import convert_document
    
    result = convert_document("tests/fixtures/sample_resume.pdf")
    
    assert result["status"] == "success"
    assert len(result["markdown"]) > 100, "Markdown should have real content"
    assert result["chunk_count"] > 0, "Should produce at least 1 chunk"
    assert all("text" in c for c in result["chunks"]), "Each chunk must have text"
    print(f"✅ PDF → {result['chunk_count']} chunks, {len(result['markdown'])} chars markdown")

def test_docx_conversion():
    """Upload a DOCX and verify Docling output."""
    result = convert_document("tests/fixtures/sample_resume.docx")
    assert result["status"] == "success"
    assert result["chunk_count"] > 0
    print(f"✅ DOCX → {result['chunk_count']} chunks")

def test_image_conversion():
    """Upload an image resume and verify OCR works."""
    result = convert_document("tests/fixtures/resume_screenshot.png")
    assert result["status"] == "success"
    assert len(result["markdown"]) > 50, "OCR should extract text"
    print(f"✅ Image OCR → {len(result['markdown'])} chars")

# Run: python -m pytest tests/test_docling.py -v
```

### Test 2: Embedding Generation

```python
# tests/test_embeddings.py
"""Test that Gemini Embedding generates correct embeddings."""

def test_single_embedding():
    """Generate embedding for a single text."""
    from my_agent.tools.embedding_tools import embed_text
    
    vector = embed_text("Senior software engineer with 5 years React experience")
    
    assert len(vector) == 768, f"Expected 768 dimensions, got {len(vector)}"
    assert all(isinstance(v, float) for v in vector)
    print(f"✅ Single embedding: {len(vector)} dimensions")

def test_batch_embeddings():
    """Embed multiple chunks in batch."""
    from my_agent.tools.embedding_tools import embed_chunks
    
    chunks = [
        {"text": "Python developer with ML experience"},
        {"text": "Built REST APIs with FastAPI and PostgreSQL"},
        {"text": "Led team of 5 engineers at Google"},
    ]
    
    result = embed_chunks(chunks)
    
    assert len(result) == 3
    assert all(len(c["embedding"]) == 768 for c in result)
    print(f"✅ Batch embedding: {len(result)} chunks embedded")

def test_similarity():
    """Test that similar texts have higher cosine similarity."""
    from my_agent.tools.embedding_tools import embed_text
    import numpy as np
    
    v1 = np.array(embed_text("Python machine learning engineer"))
    v2 = np.array(embed_text("ML developer with Python skills"))
    v3 = np.array(embed_text("Cooking recipe for pasta carbonara"))
    
    sim_related = np.dot(v1, v2)
    sim_unrelated = np.dot(v1, v3)
    
    assert sim_related > sim_unrelated, "Related texts should be more similar"
    print(f"✅ Related similarity: {sim_related:.3f} > Unrelated: {sim_unrelated:.3f}")

# Run: python -m pytest tests/test_embeddings.py -v
```

### Test 3: Supabase DB Operations

```python
# tests/test_supabase.py
"""Test Supabase connection and CRUD operations."""

def test_connection():
    """Verify Supabase client connects."""
    from my_agent.tools.db_tools import get_supabase
    
    sb = get_supabase()
    # Simple health check — query users table
    result = sb.table("users").select("id").limit(1).execute()
    assert result is not None
    print("✅ Supabase connected")

def test_insert_and_read_document():
    """Insert a document record and read it back."""
    from my_agent.tools.db_tools import store_document, read_document
    
    doc_id = store_document(
        user_id="test-user-id",
        filename="test.pdf",
        doc_type="resume",
        raw_markdown="# Test Resume\n\nJohn Doe, Software Engineer",
        metadata={"pages": 1}
    )
    
    assert doc_id is not None
    
    doc = read_document(doc_id)
    assert doc["filename"] == "test.pdf"
    assert "John Doe" in doc["raw_markdown"]
    print(f"✅ Insert + Read document: {doc_id}")

def test_vector_search():
    """Insert embeddings and verify vector similarity search works."""
    from my_agent.tools.embedding_tools import embed_text
    from my_agent.tools.knowledge_tools import search_knowledge_base
    
    # This test requires embeddings to be already stored
    results = search_knowledge_base(
        query="Python developer with REST API experience",
        user_id="test-user-id",
        top_k=5
    )
    
    assert isinstance(results, list)
    if results:
        assert "chunk_text" in results[0]
        assert "similarity" in results[0]
        print(f"✅ Vector search returned {len(results)} results")
    else:
        print("⚠️ No results — need to insert test embeddings first")

# Run: python -m pytest tests/test_supabase.py -v
```

### Test 4: Full Document Upload Pipeline (End-to-End)

```python
# tests/test_pipeline.py
"""End-to-end test: Upload PDF → Docling → Embed → Store → Retrieve."""

def test_full_upload_pipeline():
    """The complete pipeline that was previously broken."""
    from my_agent.tools.docling_tools import convert_document
    from my_agent.tools.embedding_tools import embed_chunks
    from my_agent.tools.db_tools import store_document, store_embeddings
    from my_agent.tools.knowledge_tools import search_knowledge_base
    
    # Step 1: Convert document
    doc_result = convert_document("tests/fixtures/sample_resume.pdf")
    assert doc_result["status"] == "success"
    print(f"  Step 1 ✅ Docling converted: {doc_result['chunk_count']} chunks")
    
    # Step 2: Store document
    doc_id = store_document(
        user_id="test-user",
        filename="sample_resume.pdf",
        doc_type="resume",
        raw_markdown=doc_result["markdown"],
        metadata={"chunk_count": doc_result["chunk_count"]}
    )
    assert doc_id is not None
    print(f"  Step 2 ✅ Document stored: {doc_id}")
    
    # Step 3: Embed chunks
    embedded = embed_chunks(doc_result["chunks"])
    assert all("embedding" in c for c in embedded)
    assert all(len(c["embedding"]) == 768 for c in embedded)
    print(f"  Step 3 ✅ Embedded: {len(embedded)} chunks × 768 dims")
    
    # Step 4: Store embeddings
    stored_count = store_embeddings(doc_id, "test-user", embedded)
    assert stored_count == len(embedded)
    print(f"  Step 4 ✅ Stored {stored_count} embeddings in pgvector")
    
    # Step 5: Retrieve via RAG
    results = search_knowledge_base("software engineer skills", "test-user", top_k=3)
    assert len(results) > 0, "Should find relevant chunks"
    assert results[0]["similarity"] > 0.3, "Top result should be reasonably similar"
    print(f"  Step 5 ✅ RAG retrieval: {len(results)} results (top sim: {results[0]['similarity']:.3f})")
    
    print("\n✅ FULL PIPELINE PASSED: Upload → Docling → Embed → Store → RAG Retrieve")

# Run: python -m pytest tests/test_pipeline.py -v
```

### Test 5: Resume Tailoring

```python
# tests/test_tailor.py
"""Test resume tailoring pipeline."""

def test_tailored_resume_generation():
    """Generate a tailored resume and verify structure."""
    from my_agent.tools.tailor_tools import generate_tailored_pdf
    from my_agent.tools.llm_tools import call_groq_llm
    from my_agent.tools.knowledge_tools import get_rag_context
    
    # Mock opportunity
    opportunity = {
        "title": "Senior React Developer",
        "company": "TechCorp",
        "requirements": "5+ years React, TypeScript, Node.js, REST APIs"
    }
    
    # Get RAG context
    context = get_rag_context(
        f"React developer experience {opportunity['requirements']}", 
        "test-user"
    )
    
    # Generate tailored content via LLM
    prompt = f"""Generate a tailored resume for this job:
    Company: {opportunity['company']}
    Role: {opportunity['title']}
    Requirements: {opportunity['requirements']}
    
    Candidate context from knowledge base:
    {context}
    
    Output as clean Markdown with sections: Summary, Experience, Skills, Education."""
    
    tailored_md = call_groq_llm(prompt)
    assert len(tailored_md) > 200, "Should generate substantial content"
    assert "Summary" in tailored_md or "Experience" in tailored_md
    print(f"✅ LLM generated {len(tailored_md)} chars of tailored content")
    
    # Generate PDF
    result = generate_tailored_pdf(tailored_md, "/tmp/test_tailored_resume.pdf")
    assert result["status"] == "success"
    assert os.path.exists("/tmp/test_tailored_resume.pdf")
    print(f"✅ PDF generated: {result['pdf_path']}")

# Run: python -m pytest tests/test_tailor.py -v
```

### Test 6: ArmorIQ Scope Violations (All 8 Agents)

```python
# tests/test_armoriq.py
"""Test ArmorIQ governance with 8 sub-agents."""

def test_original_scope_violation():
    """Original demo: opportunity_scout trying auto_apply_job."""
    from my_agent.armoriq_wrapper import ArmorIQClient, ArmorIQScopeViolationError
    from my_agent.armoriq_crypto import generate_pipeline_keypairs
    
    armoriq = ArmorIQClient()
    keypairs = generate_pipeline_keypairs()
    root_kp = keypairs["root_coordinator_agent"]
    
    tok_scout = armoriq.delegate(
        "root_coordinator_agent", root_kp, "opportunity_scout",
        ["profiles:read", "opportunities:write"], 
        ["mcp_scout.scout_and_store_opportunities"], 300
    )
    
    with pytest.raises(ArmorIQScopeViolationError) as exc:
        armoriq.invoke(
            "opportunity_scout", keypairs["opportunity_scout"], tok_scout, root_kp,
            "mcp_scout.auto_apply_job", {"job_id": 99}, lambda **kw: None
        )
    
    assert "auto_apply_job" in str(exc.value)
    print("✅ Original scope violation blocked correctly")

def test_tailor_scope_violation():
    """New demo: resume_tailor trying delete_knowledge_base."""
    # Similar structure — tailor agent tries destructive action
    ...

def test_knowledge_builder_scope_violation():
    """New demo: knowledge_builder trying to scout opportunities."""
    ...

# Run: python -m pytest tests/test_armoriq.py -v
```

### Test 7: Frontend Upload Integration Test

```bash
# Manual test script — run after backend is up
# tests/test_frontend_upload.sh

echo "=== Testing Document Upload Endpoint ==="

# Test 1: Upload PDF
curl -X POST http://localhost:8000/api/documents/upload \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -F "file=@tests/fixtures/sample_resume.pdf" \
  -F "doc_type=resume" \
  | python -m json.tool

echo ""
echo "Expected: status=success, document_id=..., chunk_count > 0"

# Test 2: Upload DOCX
curl -X POST http://localhost:8000/api/documents/upload \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -F "file=@tests/fixtures/sample_resume.docx" \
  -F "doc_type=resume" \
  | python -m json.tool

# Test 3: RAG Search
curl -X POST http://localhost:8000/api/knowledge/search \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Python developer skills"}' \
  | python -m json.tool

echo ""
echo "Expected: list of relevant chunks with similarity scores"
```

### Test Execution Order

```bash
# Run tests in this order — each builds on the previous

# 1. First: Can Docling convert documents?
python -m pytest tests/test_docling.py -v

# 2. Second: Can Gemini Embedding generate embeddings?
python -m pytest tests/test_embeddings.py -v

# 3. Third: Can we connect to Supabase and do CRUD?
python -m pytest tests/test_supabase.py -v

# 4. Fourth: Does the full pipeline work end-to-end?
python -m pytest tests/test_pipeline.py -v

# 5. Fifth: Does resume tailoring work?
python -m pytest tests/test_tailor.py -v

# 6. Sixth: Do ArmorIQ scope violations still work?
python -m pytest tests/test_armoriq.py -v

# 7. Seventh: Start server and test from frontend
uvicorn api:app --reload --port 8000
# Then run: bash tests/test_frontend_upload.sh
```

---

## 13. Implementation Order (Phase-by-Phase)

| Phase | What | Files Changed | Test | Est. Time |
|-------|------|--------------|------|-----------|
| **Phase 1** | Pydantic models | `my_agent/models/schemas.py` (NEW) | Import test | 30min |
| **Phase 2** | Docling tool | `my_agent/tools/docling_tools.py` (NEW) | `test_docling.py` | 1hr |
| **Phase 3** | Embedding tool | `my_agent/tools/embedding_tools.py` (NEW) | `test_embeddings.py` | 30min |
| **Phase 4** | Supabase setup | Create project, run SQL schema, `.env` | `test_supabase.py` | 1hr |
| **Phase 5** | DB tools rewrite | `my_agent/tools/db_tools.py` (REWRITE) | `test_supabase.py` | 1hr |
| **Phase 6** | Knowledge/RAG tools | `my_agent/tools/knowledge_tools.py` (NEW) | `test_rag.py` | 1hr |
| **Phase 7** | Document upload endpoint | `api.py` (ADD endpoint) | `test_pipeline.py` | 1hr |
| **Phase 8** | New MCP servers + keypairs | `mcp_docproc_server.py`, `mcp_knowledge_server.py`, `mcp_tailor_server.py`, `armoriq_crypto.py` | `test_armoriq.py` | 1.5hr |
| **Phase 9** | Refactor existing MCP servers | All existing `mcp_*_server.py` | Existing tests | 1hr |
| **Phase 10** | Enhanced Firecrawl | `my_agent/tools/firecrawl_tools.py` (NEW) | Manual test | 1hr |
| **Phase 11** | Resume tailoring | `my_agent/tools/tailor_tools.py` (NEW) | `test_tailor.py` | 2hr |
| **Phase 12** | Google Auth | Frontend `Auth.jsx`, backend middleware | Manual test | 1hr |
| **Phase 13** | Frontend refactor | Split `App.jsx` → components | Visual test | 3hr |
| **Phase 14** | Deployment | `Dockerfile`, `vercel.json`, `railway.toml` | Deploy test | 1hr |

**Total estimated: ~16 hours of implementation**

---

## 14. What Changes, What Doesn't (Final Summary)

### ✅ What Stays The Same
- ArmorIQ SDK integration (`capture_plan`, `delegate`, `invoke`)
- Cryptographic keypair isolation per sub-agent
- Scope violation demo (attack interception)
- 300s TTL delegation tokens
- Google ADK agent framework
- LiteLLM + Groq for LLM inference
- Firecrawl for web search
- FastAPI backend
- React + Vite frontend

### 🔄 What Changes
- **pypdf → Docling** for document processing (fixes PDF upload bug)
- **SQLite → Supabase + pgvector** for storage + vector search (full migration)
- **Raw text dumps → RAG** for LLM context
- **Loose dicts → Pydantic models** for data validation
- **LLM for everything → LLM only for reasoning** (tools for structured ops)
- **No auth → Google Auth** via Supabase
- **Single file upload → Multi-document + URL upload**
- **Monolithic App.jsx → Component-based frontend**

### 🆕 What's New
- Docling document pipeline (reads PDF, DOCX, images, scanned docs)
- Gemini Embedding 001 (free API, 768-dim, asymmetric search)
- RAG with pgvector semantic search
- Knowledge base per user
- Resume tailoring engine (LLM markdown → WeasyPrint PDF)
- Profile enrichment from web sources
- 3 new ArmorIQ-governed sub-agents (8 total)
- Pydantic schema validation layer
- Comprehensive test suite
- Deployment configuration (Docker + Vercel + Railway)
