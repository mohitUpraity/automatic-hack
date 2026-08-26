# CareerOS v3 — Detailed Implementation Task Breakdown (taskv2.md)

> **Source Architecture Plan:** [update.md](file:///Users/mohitupraity/Documents/projects/automatic-hack/update.md)  
> **Status:** 🚀 Active Execution Plan  
> **Governance Standard:** ArmorIQ 5 Pillars Preserved (capture_plan, delegate, invoke, keypairs, scope enforcement)

---

## Overview & Execution Strategy

This task breakdown converts `update.md` into 14 execution phases with granular, verifiable tasks. Each task defines clear inputs, targeted files, expected deliverables, and strict acceptance criteria.

---

## Phase 1: Pydantic Data Models & Schemas

- [x] **Task 1.1: Create Pydantic Schema Definitions**
  - **File:** [my_agent/models/schemas.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/models/schemas.py)
  - **Details:** Define strict Pydantic v2 data models for `User`, `Document`, `Chunk`, `Embedding`, `Resume`, `ResumeAnalysis`, `CandidateProfile`, `Opportunity`, `RankedOpportunity`, `TailoredResume`, and API request/response payloads.
  - **Acceptance Criteria:** `python -c "import my_agent.models.schemas"` runs cleanly with zero validation errors.

---

## Phase 2: Docling Multi-Format Document Processor

- [x] **Task 2.1: Implement Docling Document Processing Engine**
  - **File:** [my_agent/tools/docling_tools.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/tools/docling_tools.py)
  - **Details:** Implement `convert_document(file_path)` using Docling's `DocumentConverter` and `HierarchicalChunker` (512 token max chunk size, 50 token overlap). Supports PDF, DOCX, PNG/JPG OCR, PPTX, and HTML.
  - **Acceptance Criteria:** Returns dict containing `status`, `markdown`, `chunk_count`, and `chunks` array with text and metadata.

---

## Phase 3: Gemini Embeddings Integration

- [x] **Task 3.1: Implement Gemini Embedding Tools**
  - **File:** [my_agent/tools/embedding_tools.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/tools/embedding_tools.py)
  - **Details:** Implement `embed_text()` (for documents with `RETRIEVAL_DOCUMENT`), `embed_query()` (with `RETRIEVAL_QUERY`), and `embed_chunks()` using `models/gemini-embedding-001` (768 dimensions).
  - **Acceptance Criteria:** Outputs 768-dim float lists for document chunks and queries.

---

## Phase 4: Supabase Database Migration & Schema Setup

- [x] **Task 4.1: Verify & Document Supabase Schema SQL Migration**
  - **File:** [supabase_schema.sql](file:///Users/mohitupraity/Documents/projects/automatic-hack/supabase_schema.sql)
  - **Details:** Create SQL script enabling `pgvector`, creating `users`, `documents`, `embeddings` (768d vector index), `resumes`, `resume_analysis`, `profiles`, `opportunities`, `ranked_opportunities`, and `tailored_resumes` tables, `match_embeddings` RPC function, and Row Level Security (RLS) policies.
  - **Acceptance Criteria:** SQL executes cleanly in Supabase SQL editor; vector extension and `match_embeddings` RPC are active.

- [x] **Task 4.2: Environment Credentials Setup**
  - **File:** [.env](file:///Users/mohitupraity/Documents/projects/automatic-hack/.env)
  - **Details:** Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, and `GEMINI_API_KEY`.
  - **Acceptance Criteria:** Environment variables loaded by `python-dotenv`.

---

## Phase 5: Supabase Database Client & Data Access Layer

- [x] **Task 5.1: Implement Supabase Client & CRUD Helpers**
  - **File:** [my_agent/tools/db_tools.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/tools/db_tools.py)
  - **Details:** Replace SQLite methods with Supabase client wrappers (`store_document`, `read_document`, `store_embeddings`, `store_resume`, `store_analysis`, `store_profile`, `store_opportunities`, `store_ranked_opportunities`, `store_tailored_resume`).
  - **Acceptance Criteria:** Full CRUD operational against Supabase backend.

---

## Phase 6: Knowledge Base & RAG Retrieval Engine

- [x] **Task 6.1: Implement Vector Search & RAG Context Extractor**
  - **File:** [my_agent/tools/knowledge_tools.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/tools/knowledge_tools.py)
  - **Details:** Implement `search_knowledge_base(query, user_id, top_k)` using Supabase `match_embeddings` RPC, and `get_rag_context(query, user_id)` for formatting context into LLM prompts.
  - **Acceptance Criteria:** Semantic query returns relevant chunks with cosine similarity scores > 0.5.

---

## Phase 7: Document Upload Endpoint & PDF Bug Fix

- [x] **Task 7.1: Implement FastAPI Multi-Format Upload Endpoint**
  - **File:** [api.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/api.py)
  - **Details:** Add `POST /api/documents/upload` accepting multipart file form data. Uploads file to Supabase Storage, converts with Docling, chunks, embeds with Gemini 001, and stores records in `documents` & `embeddings` tables. Add `POST /api/documents/upload-url` for web URLs.
  - **Acceptance Criteria:** Resolves previous PDF upload bug. Upload returns `document_id`, `chunk_count`, and `markdown_preview`.

---

## Phase 8: ArmorIQ 8 Sub-Agent Architecture & Keypair Expansion

- [x] **Task 8.1: Expand Cryptographic Keypair Matrix to 8 Agents**
  - **File:** [my_agent/armoriq_crypto.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/armoriq_crypto.py)
  - **Details:** Add RSA keypairs for `document_processor`, `knowledge_builder`, and `resume_tailor` (8 sub-agents total).

- [x] **Task 8.2: Implement 3 New MCP Servers**
  - **Files:** 
    - [my_agent/mcp_servers/mcp_docproc_server.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/mcp_servers/mcp_docproc_server.py)
    - [my_agent/mcp_servers/mcp_knowledge_server.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/mcp_servers/mcp_knowledge_server.py)
    - [my_agent/mcp_servers/mcp_tailor_server.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/mcp_servers/mcp_tailor_server.py)
  - **Details:** Wrap tools for document processing, RAG building, and resume tailoring into individual FastMCP servers.

- [x] **Task 8.3: Update Root Agent Delegation & Governance Flow**
  - **File:** [my_agent/agent.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/agent.py)
  - **Details:** Wire 8-agent delegation pipeline with `capture_plan()`, `delegate()`, and `invoke()` using ArmorIQ wrapper.

---

## Phase 9: Refactor Existing Tools & MCP Servers

- [x] **Task 9.1: Refactor Extractor, Analyzer, Profiler, Scout, Ranker Servers**
  - **Files:** [my_agent/mcp_servers/](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/mcp_servers)
  - **Details:** Update all existing servers to consume Supabase DB and Pydantic models.

---

## Phase 10: Company Research & Firecrawl Web Scraping

- [x] **Task 10.1: Implement Enhanced Firecrawl Tools**
  - **File:** [my_agent/tools/search_tools.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/tools/search_tools.py)
  - **Details:** Add functionality to crawl specific company job descriptions and websites for resume tailoring context.

---

## Phase 11: Resume Tailoring & WeasyPrint PDF Generation Engine

- [x] **Task 11.1: Implement Resume Tailoring & PDF Tool**
  - **File:** [my_agent/tools/tailor_tools.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/tools/tailor_tools.py)
  - **Details:** Combine RAG candidate retrieval + job requirements → Groq LLM tailored markdown → HTML/CSS template → WeasyPrint PDF generation.
  - **Acceptance Criteria:** Generates clean, professional PDF file at specified output path.

---

## Phase 12: Authentication & User Isolation Middleware

- [x] **Task 12.1: Supabase Auth Verification Middleware**
  - **File:** [api.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/api.py)
  - **Details:** Implement `get_current_user` dependency extracting and validating Supabase Bearer JWTs.

---

## Phase 13: Frontend Refactoring & Modular UI Component Architecture

- [x] **Task 13.1: Create Frontend Component Hierarchy**
  - **Files in** [frontend/src/components/](file:///Users/mohitupraity/Documents/projects/automatic-hack/frontend/src/components/):
    - `Auth.jsx` (Google Sign-In)
    - `DocumentUploader.jsx` (Multi-document drag-and-drop file upload)
    - `KnowledgeBase.jsx` (RAG document explorer & chunks viewer)
    - `OpportunityBoard.jsx` (Ranked job/hackathon/internship cards)
    - `ResumeTailor.jsx` (Tailored resume preview & PDF downloader)
    - `ArmorIQConsole.jsx` (Live audit logs & scope violation triggers)
    - `ChatAssistant.jsx` (RAG-assisted interactive candidate query)
  - **Details:** Replace monolithic `App.jsx` with clear modular component composition.

---

## Phase 14: Test Suite & Verification Pipeline

- [x] **Task 14.1: Unit & End-to-End Test Suite**
  - **Files in** [tests/](file:///Users/mohitupraity/Documents/projects/automatic-hack/tests/):
    - `test_docling.py`
    - `test_embeddings.py`
    - `test_supabase.py`
    - `test_pipeline.py`
    - `test_tailor.py`
    - `test_armoriq.py`
    - `test_frontend_upload.sh`
  - **Details:** Comprehensive automated validation across all 8 sub-agents and complete upload-to-PDF pipeline.
