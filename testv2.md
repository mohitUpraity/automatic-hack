# CareerOS v3 — Test Manifest & Pipeline Verification (testv2.md)

> **Purpose:** Ensure every pipeline stage, document conversion, RAG vector retrieval, resume tailoring engine, and ArmorIQ governance scope check functions flawlessly.

---

## Test Execution Matrix

| Test ID | Test Category | Target File | Execution Command | Status |
|---------|---------------|-------------|-------------------|--------|
| `T-01`  | Data Models | `my_agent/models/schemas.py` | `pytest tests/test_schemas.py -v` | ⏸️ Pending |
| `T-02`  | Docling Parsing | `my_agent/tools/docling_tools.py` | `pytest tests/test_docling.py -v` | ⏸️ Pending |
| `T-03`  | Gemini Embeddings | `my_agent/tools/embedding_tools.py` | `pytest tests/test_embeddings.py -v` | ⏸️ Pending |
| `T-04`  | Supabase DB & Vector | `my_agent/tools/db_tools.py` | `pytest tests/test_supabase.py -v` | ⏸️ Pending |
| `T-05`  | RAG Retrieval | `my_agent/tools/knowledge_tools.py` | `pytest tests/test_rag.py -v` | ⏸️ Pending |
| `T-06`  | End-to-End Pipeline | Upload → Docling → RAG | `pytest tests/test_pipeline.py -v` | ⏸️ Pending |
| `T-07`  | Resume Tailor & PDF | `my_agent/tools/tailor_tools.py` | `pytest tests/test_tailor.py -v` | ⏸️ Pending |
| `T-08`  | ArmorIQ Governance | 8 Sub-Agents & Scope Check | `pytest tests/test_armoriq.py -v` | ⏸️ Pending |
| `T-09`  | Frontend Upload API | `POST /api/documents/upload` | `bash tests/test_frontend_upload.sh` | ⏸️ Pending |

---

## Detailed Test Definitions

### T-01: Pydantic Data Models Validation
- **Objective:** Verify schemas validate correct input and reject invalid types.
- **Verification:** Import models, instantiate sample payloads, check field validation.

### T-02: Docling Multi-Format Document Conversion
- **Objective:** Convert PDF, DOCX, and image files to structured Markdown and semantic chunks.
- **Verification:** Assert markdown length > 100 chars, chunk count > 0, chunk text present.

### T-03: Gemini Embeddings Generation
- **Objective:** Generate 768-dimensional embedding vectors for text and queries using Gemini API.
- **Verification:** Assert vector length == 768, batch embeddings match chunk count, similarity of related queries > unrelated queries.

### T-04: Supabase Database CRUD & Vector Index
- **Objective:** Test database client connection, user record creation, document storing, and pgvector cosine search.
- **Verification:** Execute insert and read back record; execute `match_embeddings` RPC.

### T-05: RAG Knowledge Base Retrieval
- **Objective:** Search candidate knowledge base for queries and generate prompt context.
- **Verification:** Assert returned chunks have similarity scores > 0.5 and format context cleanly.

### T-06: End-to-End Ingestion Pipeline
- **Objective:** Fix PDF upload bug by testing full sequence: Upload → Docling Markdown → Hierarchical Chunks → Gemini Embeddings → Supabase Storage & DB → RAG Query.
- **Verification:** Assert smooth execution through all 5 steps without error.

### T-07: Tailored Resume & WeasyPrint PDF Generation
- **Objective:** Retrieve RAG context, run LLM tailoring, inject into HTML/CSS template, and produce PDF.
- **Verification:** Assert output PDF file exists on filesystem and size > 0 bytes.

### T-08: ArmorIQ Governance & Scope Interception
- **Objective:** Test delegation to all 8 sub-agents and verify scope violation blocks unauthorized tool calls (e.g. `opportunity_scout` attempting `auto_apply_job` or `resume_tailor` attempting `delete_knowledge_base`).
- **Verification:** Catch `ArmorIQScopeViolationError` for prohibited tool calls.

### T-09: Frontend Upload Endpoint Integration
- **Objective:** Verify FastAPI endpoint accepts multipart form uploads without `Content-Type: application/json` conflicts.
- **Verification:** `curl` POST multipart upload returns 200 OK with `document_id`.
