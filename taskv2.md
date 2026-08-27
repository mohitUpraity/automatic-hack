# CareerOS v3 — Detailed Implementation Task Breakdown (taskv2.md)

> **Source Architecture Plan:** [update.md](file:///Users/mohitupraity/Documents/projects/automatic-hack/update.md)  
> **Status:** 🎉 100% Complete — All Tasks Implemented & Verified  
> **Governance Standard:** ArmorIQ 5 Pillars Preserved (capture_plan, delegate, invoke, keypairs, scope enforcement)

---

## Phase 1: Pydantic Data Models & Schemas

- [x] **Task 1.1: Create Pydantic Schema Definitions**
  - **File:** [my_agent/models/schemas.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/models/schemas.py)
  - **Details:** Defined strict Pydantic v2 data models for `User`, `Document`, `Chunk`, `Embedding`, `Resume`, `ResumeAnalysis`, `CandidateProfile`, `Opportunity`, `RankedOpportunity`, `TailoredResume`, and API request/response payloads.
  - **Acceptance Criteria:** `python3 tests/test_schemas.py` PASSED cleanly.

---

## Phase 2: Docling Multi-Format Document Processor

- [x] **Task 2.1: Implement Docling Document Processing Engine**
  - **File:** [my_agent/tools/docling_tools.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/tools/docling_tools.py)
  - **Details:** Implemented `convert_document(file_path)` using Docling's `DocumentConverter` and `HierarchicalChunker` (512 token max chunk size, 50 token overlap). Supports PDF, DOCX, PNG/JPG OCR, PPTX, and HTML.

---

## Phase 3: Gemini Embeddings Integration

- [x] **Task 3.1: Implement Gemini Embedding Tools**
  - **File:** [my_agent/tools/embedding_tools.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/tools/embedding_tools.py)
  - **Details:** Implemented `embed_text()`, `embed_query()`, and `embed_chunks()` using `models/gemini-embedding-001` (768 dimensions).

---

## Phase 4: Supabase Database Migration & Schema Setup

- [x] **Task 4.1: Verify & Document Supabase Schema SQL Migration**
  - **File:** [supabase_schema.sql](file:///Users/mohitupraity/Documents/projects/automatic-hack/supabase_schema.sql)
  - **Details:** Created SQL script enabling `pgvector`, creating `users`, `documents`, `embeddings` (768d vector index), `resumes`, `resume_analysis`, `profiles`, `opportunities`, `ranked_opportunities`, and `tailored_resumes` tables, `match_embeddings` RPC function, and Row Level Security (RLS) policies.

- [x] **Task 4.2: Environment Credentials Setup**
  - **File:** [.env](file:///Users/mohitupraity/Documents/projects/automatic-hack/.env)
  - **Details:** Updated environment variables.

---

## Phase 5: Supabase Database Client & Data Access Layer

- [x] **Task 5.1: Implement Supabase Client & CRUD Helpers**
  - **File:** [my_agent/tools/db_tools.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/tools/db_tools.py)
  - **Details:** Implemented Supabase client wrappers with fallback storage (`store_document`, `read_document`, `store_embeddings`, `store_resume`, `store_analysis`, `store_profile`, `store_opportunities`, `store_ranked_opportunities`, `store_tailored_resume`).

---

## Phase 6: Knowledge Base & RAG Retrieval Engine

- [x] **Task 6.1: Implement Vector Search & RAG Context Extractor**
  - **File:** [my_agent/tools/knowledge_tools.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/tools/knowledge_tools.py)
  - **Details:** Implemented `search_knowledge_base(query, user_id, top_k)` using Supabase `match_embeddings` RPC, and `get_rag_context(query, user_id)` for formatting context into LLM prompts.

---

## Phase 7: Document Upload Endpoint & PDF Bug Fix

- [x] **Task 7.1: Implement FastAPI Multi-Format Upload Endpoint**
  - **File:** [api.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/api.py)
  - **Details:** Added `POST /api/documents/upload` accepting multipart file form data. Docling converts, chunks, embeds with Gemini 001, and stores records in `documents` & `embeddings` tables. Resolves PDF upload bug.

---

## Phase 8: ArmorIQ 8 Sub-Agent Architecture & Keypair Expansion

- [x] **Task 8.1: Expand Cryptographic Keypair Matrix to 8 Agents**
  - **File:** [my_agent/armoriq_crypto.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/armoriq_crypto.py)
  - **Details:** Added RSA keypairs for `document_processor`, `knowledge_builder`, and `resume_tailor` (8 sub-agents total + root coordinator).

- [x] **Task 8.2: Implement 3 New MCP Servers**
  - **Files:** 
    - [my_agent/mcp_servers/mcp_docproc_server.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/mcp_servers/mcp_docproc_server.py)
    - [my_agent/mcp_servers/mcp_knowledge_server.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/mcp_servers/mcp_knowledge_server.py)
    - [my_agent/mcp_servers/mcp_tailor_server.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/mcp_servers/mcp_tailor_server.py)
  - **Details:** Wrapped tools for document processing, RAG building, and resume tailoring into individual FastMCP servers.

- [x] **Task 8.3: Update Root Agent Delegation & Governance Flow**
  - **File:** [my_agent/agent.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/agent.py)
  - **Details:** Wired 8-agent delegation pipeline with `capture_plan()`, `delegate()`, and `invoke()` using ArmorIQ wrapper.

---

## Phase 9: Refactor Existing Tools & MCP Servers

- [x] **Task 9.1: Refactor Extractor, Analyzer, Profiler, Scout, Ranker Servers**
  - **Files:** [my_agent/mcp_servers/](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/mcp_servers)

---

## Phase 10: Company Research & Web Scraping

- [x] **Task 10.1: Implement Enhanced Firecrawl Tools**
  - **File:** [my_agent/tools/search_tools.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/tools/search_tools.py)

---

## Phase 11: Resume Tailoring & WeasyPrint PDF Generation Engine

- [x] **Task 11.1: Implement Resume Tailoring & PDF Tool**
  - **File:** [my_agent/tools/tailor_tools.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/my_agent/tools/tailor_tools.py)
  - **Details:** Combined RAG candidate retrieval + job requirements → Groq LLM tailored markdown → HTML/CSS template → WeasyPrint PDF generation.

---

## Phase 12: Authentication & User Isolation Middleware

- [x] **Task 12.1: Supabase Auth Verification Middleware**
  - **File:** [api.py](file:///Users/mohitupraity/Documents/projects/automatic-hack/api.py)
  - **Details:** Implemented `get_current_user` dependency extracting and validating Supabase Bearer JWTs.

---

## Phase 13: Frontend Refactoring & Modular UI Component Architecture

- [x] **Task 13.1: Create Frontend Component Hierarchy**
  - **Files in** [frontend/src/components/](file:///Users/mohitupraity/Documents/projects/automatic-hack/frontend/src/components/):
    - `DocumentUploader.jsx`
    - `KnowledgeBase.jsx`
    - `ResumeTailor.jsx`
    - `ArmorIQConsole.jsx`
  - **Details:** Replaced monolithic `App.jsx` with modular React component composition. Vite build succeeded cleanly (`1808 modules transformed`).

---

## Phase 14: Test Suite & Verification Pipeline

- [x] **Task 14.1: Unit & End-to-End Test Suite**
  - **Files in** [tests/](file:///Users/mohitupraity/Documents/projects/automatic-hack/tests/):
    - `test_schemas.py` PASSED
    - `test_pipeline.py` PASSED
    - `test_tailor.py` PASSED
    - `test_armoriq.py` PASSED
    - `test_frontend_upload.sh` PASSED
