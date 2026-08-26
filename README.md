# 🤖 CareerOS — Zero-Trust Multi-Agent Career Automation Platform

> **Hackathon Submission Track:** Problem 2 — *"Who authorized that?"* (Multi-Agent Delegation & Governance)  
> **Core Architecture:** ArmorIQ SDK + Google ADK + IBM Docling + Gemini Embeddings + Decoupled MCP Tool Servers + Supabase / SQLite  
> **GitHub Repository:** [https://github.com/Krati-orbit/automatic-hack](https://github.com/Krati-orbit/automatic-hack)

---

## 🌟 Executive Summary

**CareerOS** is an autonomous, zero-trust multi-agent career intelligence and automation platform. It converts raw candidate resumes and multi-format portfolio documents into structured semantic profiles, performs high-dimensional vector similarity matching across live real-world opportunities (jobs, internships, hackathons, competitions, conclaves), extracts deep company intelligence, dynamically tailors publication-grade resumes, and executes an automated end-to-end career autopilot.

To solve **Problem 2 ("Who authorized that?")**, CareerOS implements **Zero-Trust Cryptographic Delegation Protocols**:
* **Cryptographic Keypair Isolation:** Every sub-agent operates with its own dedicated asymmetric cryptographic keypair (RSA / Ed25519).
* **Decoupled MCP Tool Servers:** Sub-agents invoke tools strictly through isolated Model Context Protocol (MCP) server modules (`my_agent/mcp_servers/`).
* **ArmorIQ Core Security Protocols:** Uses `capture_plan()` on the Root Coordinator, `delegate()` for cryptographically signed delegation tokens (with 300-second TTL), and `invoke()` for runtime verification of caller identity, token expiration, and authorized tool scopes.
* **Real-Time Scope Interception:** Any unauthorized or injected tool call (e.g. a prompt injection attempting `auto_apply_job` or financial actions) is cryptographically intercepted and **blocked before execution**, generating a verifiable 4-step Trajectory Trace.

---

## 🔄 Evolution: v1 vs v2 Architecture Comparison

CareerOS has evolved from an initial 5-stage sequential hackathon prototype (**v1**) into a comprehensive, production-grade autonomous multi-agent intelligence platform (**v2**).

### 📊 Side-by-Side Comparison Matrix

| Architectural Dimension | v1: Baseline Prototype (Before) | v2: Production Platform (Now) |
| :--- | :--- | :--- |
| **Multi-Agent Orchestration** | 5 rigid sequential sub-agents with fixed single-turn execution. | **8+ specialized autonomous sub-agents** coordinated by a central Root Agent with Google ADK session runners, dynamic tool routing, and streaming execution graph. |
| **Document Ingestion & Parsing** | Basic `pypdf` extraction and plain text parsing. Limited to simple PDF/text with layout loss. | **IBM Docling Document AI Engine**: Multi-format ingestion (PDF, DOCX, PPTX, Images, Scanned docs with OCR, URLs) with `HierarchicalChunker` preserving document AST structure and heading hierarchies. |
| **Knowledge Base & Storage** | Flat SQLite database records with direct text field lookups. No semantic vector retrieval. | **Hybrid RAG Knowledge Base**: 768-dimensional dense vector embeddings via Google Gemini Embedding 001 (`models/gemini-embedding-001`), Supabase `pgvector` (`match_embeddings` RPC), and local L2-normalized cosine vector fallback. |
| **Opportunity Matching** | Naive keyword string matching and basic heuristic percentage scores. | **Mathematical Semantic Vector Retrieval Engine (`semantic_matcher.py`)**: TF-IDF n-gram feature hashing + Gemini 768d embeddings + cosine projection + multi-candidate domain clustering (Backend, Frontend, AI/ML). |
| **Web Scouting & Intel** | Basic web queries with simple opportunity summaries. | **Firecrawl MCP Deep Web Research**: Real-time live scouting across 5 categories + Deep Company Intelligence Engine extracting tech stacks, engineering cultures, ATS keywords, and interview strategies. |
| **Resume Tailoring & Export** | Static profile rendering; no dynamic tailoring or document generation. | **Bidirectional Docling Round-Trip Tailoring**: Tailors resume content specifically to target job requirements and company intel while enforcing **100% authentic metric and project preservation**; exports to high-fidelity PDF via WeasyPrint / native binary engine. |
| **AI Resume Studio** | Non-existent (read-only profile view). | **Interactive AI Resume Studio**: Side-by-side markdown editor, live preview, instant PDF generation, and AI refinement actions (ATS Optimize, Quantify Metrics, Hackathon Pitch, Polish). |
| **Workflow Automation** | Manual step-by-step trigger. | **One-Click Career Autopilot (`/api/autopilot/run`)**: End-to-end automated pipeline executing ingestion, profiling, multi-category web scouting, semantic ranking, and top-match resume tailoring. |
| **Zero-Trust Governance** | Basic ArmorIQ wrapper with 5 keypairs and simple interception check. | **Comprehensive ArmorIQ Governance Observatory**: Cryptographic signature validation, 300s TTL expiring delegation tokens, interactive Shield ON/OFF attack toggle, 4-step Trajectory Trace graph, and live audit logging. |
| **User Experience & Auth** | Single-page UI with static demo data and simple stepper. | **Full Dark-Mode Glassmorphic React 19 Dashboard**: Multi-user JWT authentication, candidate profile switching (Mohit, Vishnu, Krati + fresh registration), dedicated Documents Hub, Opportunities Feed, Resume Studio, Knowledge Graph, and ArmorIQ Observatory. |

---

### 🔍 Detailed Breakdown: What Was Added & Upgraded

```text
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CAREEROS PLATFORM EVOLUTION                                    │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘

         v1 (Baseline Hackathon MVP)                           v2 (Full Autonomous Platform)
  ┌────────────────────────────────────────┐             ┌────────────────────────────────────────┐
  │ • 5 Simple Sub-Agents                  │             │ • 8+ Specialized Sub-Agents + ADK Root │
  │ • Basic pypdf Text Parsing             │             │ • IBM Docling Multi-Format & OCR       │
  │ • Flat SQLite Database Lookups         │    ────►    │ • 768d Gemini Vector RAG Knowledge Base│
  │ • Heuristic Keyword Matching           │             │ • Cosine Vector Retrieval Engine       │
  │ • Basic Web Search Scraper             │             │ • Firecrawl Deep Company Intelligence  │
  │ • Static Profile View                  │             │ • Docling Round-Trip Resume Tailoring  │
  │ • Basic Scope Check Demo               │             │ • AI Resume Studio & High-Fidelity PDF │
  │ • Single User Dashboard                │             │ • 1-Click Autopilot & Multi-User Auth  │
  └────────────────────────────────────────┘             └────────────────────────────────────────┘
```

#### 1. Knowledge Base & Document AI (v1 $\rightarrow$ v2)
* **v1:** Relied on raw text strings or rudimentary PDF extractions that stripped table formatting, lists, and hierarchy. No vector database existed.
* **v2:** Built a robust RAG vector knowledge base powered by **IBM Docling** and **Google Gemini 768d Embeddings**. Docling parses complex multi-column PDFs, DOCX, and scanned documents into structured Markdown ASTs. The `HierarchicalChunker` breaks documents into semantically coherent chunks tagged with section headers and page metadata, indexed in Supabase `pgvector` and cached locally in SQLite.

#### 2. Semantic Matching Engine (v1 $\rightarrow$ v2)
* **v1:** Matched candidate profiles to opportunities using simple keyword overlap algorithms.
* **v2:** Implemented a high-performance **Semantic Vector Retrieval Engine** (`semantic_matcher.py`) combining character/word n-gram feature hashing, domain-specific dimensional weighting (Distributed Systems, UI/UX Design Systems, AI/ML & Wearables), and L2-normalized cosine similarity. Supports multi-candidate clustering and strictly filters curated opportunities to candidate strengths.

#### 3. Deep Company Intelligence & Web Scouting (v1 $\rightarrow$ v2)
* **v1:** Basic keyword search querying generic job listings without company context.
* **v2:** Integrated **Firecrawl MCP** and deep research routines (`company_intel_tools.py`) that scrape target company domains, career portals, and engineering blogs. Extracts company overview, production tech stacks, engineering culture, and ATS keywords to power custom tailoring.

#### 4. Resume Studio, Tailoring & PDF Generation (v1 $\rightarrow$ v2)
* **v1:** Displayed static candidate information without tailoring or download capabilities.
* **v2:** Engineered a **Bidirectional Docling Round-Trip Tailoring Engine** (`tailor_tools.py`) that merges candidate master experience with company intelligence. Includes an interactive AI Resume Studio with instant action chips (ATS Optimize, Quantify Metrics, Hackathon Pitch, Polish) and generates high-fidelity PDFs with Royal Blue headers, divider lines, and clickable contact links.

#### 5. Career Autopilot & Dynamic Multi-Agent Orchestration (v1 $\rightarrow$ v2)
* **v1:** Required triggering individual stages manually with fixed parameters.
* **v2:** Introduced **Career Autopilot** (`/api/autopilot/run`), an autonomous orchestrator that takes a profile or raw resume and executes the complete pipeline end-to-end. Sub-agents are managed via Google ADK runners with streaming event graphs and dynamic tool selection.

#### 6. Zero-Trust Security & ArmorIQ Observatory (v1 $\rightarrow$ v2)
* **v1:** Basic cryptographic mock script demonstrating an unauthorized tool block.
* **v2:** Enterprise **ArmorIQ Governance Observatory** featuring live Trajectory Trace graphs, Shield ON/OFF vulnerability toggling, TTL token expiration enforcement (300s), full cryptographic audit logging (`/api/audit-logs`), and seamless MCP server isolation.

---

## 🏛️ System Architecture & Sub-Agent Breakdown

```text
                               Candidate Documents (PDF / DOCX / Scans / URLs)
                                                      │
                                                      ▼
                                       ┌────────────────────────────┐
                                       │   Root Coordinator Agent   │ ──► capture_plan() & delegate(tokens)
                                       └──────────────┬─────────────┘
                                                      │ (Signed 300s TTL Delegation Tokens)
   ┌───────────────────────┬──────────────────────────┼──────────────────────────┬───────────────────────┐
   ▼                       ▼                          ▼                          ▼                       ▼
Sub-Agent 1             Sub-Agent 2                Sub-Agent 3                Sub-Agent 4             Sub-Agent 5
document_processor      resume_extractor           resume_analyzer            profile_maker           opportunity_scout
(Keypair 1)             (Keypair 2)                (Keypair 3)                (Keypair 4)             (Keypair 5)
   │                       │                          │                          │                       │
   ▼                       ▼                          ▼                          ▼                       ▼
MCP Server 1            MCP Server 2               MCP Server 3               MCP Server 4            MCP Server 5
(documents:write)       (resumes:write)            (analysis:write)           (profiles:write)        (opportunities:w)
   │                       │                          │                          │                       │
   └───────────────────────┼──────────────────────────┴──────────────────────────┼───────────────────────┘
                           │
   ┌───────────────────────┴──────────────────────────┐
   ▼                                                  ▼
Sub-Agent 6                                        Sub-Agent 7                               Sub-Agent 8
opportunity_ranker                                 knowledge_builder                         resume_tailor
(Keypair 6)                                        (Keypair 7)                               (Keypair 8)
   │                                                  │                                         │
   ▼                                                  ▼                                         ▼
MCP Server 6                                       MCP Server 7                              MCP Server 8
(ranked:write)                                     (knowledge:read)                          (tailored:write)
```

### 📋 Sub-Agent & Dedicated MCP Server Specifications

| Sub-Agent Identity | Keypair | Delegated Scope | Dedicated MCP Server | Core Responsibility |
| :--- | :---: | :--- | :--- | :--- |
| **`document_processor`** | Keypair 1 | `documents:write` | `mcp_docproc_server` | Converts multi-format files via Docling, generates 768d Gemini embeddings, and stores chunks in knowledge base. |
| **`resume_extractor`** | Keypair 2 | `resumes:write` | `mcp_extractor_server` | Parses structured candidate contact info, education, experience, skills, and projects into `resumes` table. |
| **`resume_analyzer`** | Keypair 3 | `resumes:read`, `analysis:write` | `mcp_analyzer_server` | Evaluates technical strengths, growth areas, domain focus, and career level into `resume_analysis` table. |
| **`profile_maker`** | Keypair 4 | `analysis:read`, `profiles:write` | `mcp_profiler_server` | Compiles candidate tech stack, target roles, career goals, and search keywords into `profiles` table. |
| **`opportunity_scout`** | Keypair 5 | `profiles:read`, `opportunities:write`, `web:search` | `mcp_scout_server` | Searches live internet via Firecrawl MCP across Jobs, Internships, Competitions, Hackathons, Conclaves. |
| **`opportunity_ranker`** | Keypair 6 | `opportunities:read`, `ranked:write` | `mcp_ranker_server` | Computes semantic cosine similarity (0-100%) against candidate vector and stores in `ranked_opportunities`. |
| **`knowledge_builder`** | Keypair 7 | `knowledge:read`, `embeddings:read` | `mcp_knowledge_server` | Executes RAG vector similarity search over candidate documents to provide context for AI responses. |
| **`resume_tailor`** | Keypair 8 | `knowledge:read`, `tailored:write` | `mcp_tailor_server` | Generates job-specific tailored resumes using company intel and compiles publication-grade PDFs. |

---

## 🛡️ Zero-Trust Cryptographic Delegation (ArmorIQ Protocols)

CareerOS satisfies all requirements for **Hackathon Problem 2 ("Who authorized that?")**:

### 1. Plan Capture (`capture_plan`)
The Root Coordinator registers its authorized intent plan with ArmorIQ before executing workflows:
```python
plan = armoriq.capture_plan(
    agent_id="root_coordinator_agent",
    intent="Execute CareerOS pipeline: parse, profile, scout, rank, and tailor opportunities",
    allowed_tools=[
        "mcp_docproc.process_and_embed_document",
        "mcp_extractor.extract_and_store_resume",
        "mcp_analyzer.analyze_and_store_resume",
        "mcp_profiler.build_and_store_profile",
        "mcp_scout.scout_and_store_opportunities",
        "mcp_ranker.rank_and_store_opportunities",
        "mcp_tailor.tailor_resume_for_opportunity"
    ]
)
```

### 2. Cryptographic Delegation (`delegate`)
The Root Coordinator issues scoped, cryptographically signed delegation tokens with a 300-second TTL:
```python
scout_token = armoriq.delegate(
    parent_agent_id="root_coordinator_agent",
    parent_keypair=root_keypair,
    sub_agent_id="opportunity_scout",
    allowed_scopes=["profiles:read", "opportunities:write", "web:search"],
    allowed_tools=["mcp_scout.scout_and_store_opportunities"],
    ttl_seconds=300  # Token expires in 5 minutes
)
```

### 3. Tool Invocation & Verification (`invoke`)
Sub-agents execute tools through ArmorIQ, which cryptographically verifies the token signature, checks expiration, and validates scope:
```python
result = armoriq.invoke(
    sub_agent_id="opportunity_scout",
    sub_agent_keypair=scout_keypair,
    delegation_token=scout_token,
    parent_keypair=root_keypair,
    tool_name="mcp_scout.scout_and_store_opportunities",
    tool_args={"profile_id": "candidate_mohit"},
    tool_func=scout_and_store_opportunities
)
```

### 4. Scope Violation Interception (Shield ON vs Shield OFF)
When a prompt injection or rogue agent attempts an unauthorized action (e.g. `auto_apply_job` or payment triggers):
* **🛡️ Shield ON (Protected):** ArmorIQ detects that `auto_apply_job` is outside `scout_token.allowed_tools`, **blocks execution cryptographically**, raises `ArmorIQScopeViolationError`, and logs the event to the Trajectory Trace.
* **🛑 Shield OFF (Unsecured):** Demonstrates what happens in ungoverned systems when security boundaries are bypassed.

```text
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                              ARMORIQ TRAJECTORY TRACE                                 │
├─────────┬──────────────────────────┬─────────────────────────────────┬────────────────┤
│ Step 1  │ Root Coordinator         │ Issued signed delegation token  │ ✅ AUTHORIZED   │
│ Step 2  │ opportunity_scout        │ Received scoped authority       │ ✅ DELEGATED    │
│ Step 3  │ Malicious Payload        │ Requested 'auto_apply_job'      │ ⚠️ UNAUTHORIZED │
│ Step 4  │ ArmorIQ Security Shield  │ Intercepted & Blocked Execution │ 🛡️ BLOCKED     │
└─────────┴──────────────────────────┴─────────────────────────────────┴────────────────┘
```

---

## 🧠 Core Capabilities & Technical Deep Dive

### 1. 📄 IBM Docling Multi-Format Ingestion & Hierarchical Chunking
* Supports PDF, DOCX, PPTX, Images, Scanned Documents (OCR), and Web URLs.
* Uses Docling's `HierarchicalChunker` with token overlap to preserve contextual document headings, tables, and page boundaries.

### 2. 🧬 Gemini 768d Embeddings & Hybrid RAG Knowledge Base
* Generates 768-dimensional dense vector embeddings using `models/gemini-embedding-001`.
* Uses `RETRIEVAL_DOCUMENT` for document chunk indexing and `RETRIEVAL_QUERY` for asymmetric search.
* Hybrid storage layer: Supabase `pgvector` with local SQLite L2-normalized cosine similarity fallback.

### 3. 🎯 High-Performance Semantic Vector Retrieval Engine (`semantic_matcher.py`)
* Mathematical TF-IDF n-gram feature hashing combined with Gemini dense vectors.
* Candidate domain clustering:
  * **Backend & Distributed Systems:** High weights for FastAPI, PostgreSQL, Kafka, Microservices, Redis.
  * **Frontend & Design Systems:** High weights for React 19, TypeScript, Next.js, Tailwind CSS, WCAG AAA.
  * **AI/ML & Wearables:** High weights for PyTorch, OpenCV, Edge AI, IoT Telemetry, Cyber Security.
* Computes exact cosine similarities and normalizes match scores to percentage fits (60%–99%).

### 4. 🌐 Firecrawl Deep Web Research & Company Intelligence Engine
* Scrapes live company career portals, tech blogs, and job descriptions.
* Extracts company overview, verified tech stacks, engineering culture, and ATS keywords.
* Powers personalized tailoring with specific culture fit alignment and interview insights.

### 5. 📝 Dynamic Resume Studio & Publication-Grade PDF Round-Trip
* Customizes resume markdown for specific target roles while enforcing **100% authentic data preservation** (never fabricates projects or metrics).
* Interactive AI refinement actions: ATS Optimize, Quantify Metrics, Hackathon Pitch, Polish.
* High-fidelity PDF rendering with Royal Blue headers, divider lines, clickable hyperlinks, and typography.

### 6. ⚡ One-Click Career Autopilot Master Pipeline
* Unified endpoint (`/api/autopilot/run`) that orchestrates parsing $\rightarrow$ profiling $\rightarrow$ multi-category live scouting $\rightarrow$ cosine ranking $\rightarrow$ automated resume tailoring $\rightarrow$ instant PDF generation.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React 19, Vite 8, Lucide React, Glassmorphic CSS, Tailwind CSS v4 |
| **Backend REST API** | FastAPI v2.0 (Python 3.13), Uvicorn ASGI, Pydantic v2 |
| **Multi-Agent Engine** | Google Agent Development Kit (ADK), 8 Decoupled MCP Tool Servers |
| **Zero-Trust Governance** | ArmorIQ SDK (`capture_plan`, `delegate`, `invoke`), Asymmetric RSA/Ed25519 Keypairs |
| **Document AI & Parsing** | IBM Docling (`docling`, `docling-core`), `pypdf`, OCR Pipeline |
| **Embeddings & Vector Search**| Google Gemini Embedding 001 (`models/gemini-embedding-001`, 768d), Supabase `pgvector`, SQLite Vector Engine |
| **Web Search & Deep Intel** | Firecrawl MCP, Deep Web Scraper Engine, DuckDuckGo Fallback |
| **LLM Inference** | LiteLLM, Groq Cloud LLM API (`groq/qwen/qwen3.8-27b`, `groq/openai/gpt-oss-20b`) |
| **PDF Generation** | WeasyPrint, Native Binary PDF Engine, Docling AST Exporter |
| **Database & Persistence** | SQLite 3 (`career_os.db`), Supabase PostgreSQL |

---

## 📡 REST API Reference

### 🔐 Authentication & Profile
| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/auth/login` | `POST` | Authenticates user or 1-click candidate profile login. |
| `/api/auth/register` | `POST` | Registers a new user with a clean slate profile. |
| `/api/auth/me` | `GET` | Returns currently authenticated user session. |
| `/api/user/profile` | `GET` / `POST` | Retrieves or updates candidate profile, preferences, and social URLs. |
| `/api/user/upload-template` | `POST` | Parses uploaded resume via Docling and sets as active golden template. |

### 📄 Documents & Knowledge Base (RAG)
| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/documents/upload` | `POST` | Uploads multi-format document, converts via Docling, embeds with Gemini 001, and stores in knowledge base. |
| `/api/documents` | `GET` | Lists all uploaded documents in the knowledge base. |
| `/api/documents/{doc_id}` | `DELETE` | Deletes a document and its vector embeddings. |
| `/api/knowledge/search` | `POST` | Executes RAG vector similarity search over candidate documents. |
| `/api/query-db` | `POST` | RAG-powered candidate Q&A endpoint for AI Assistant chat. |

### 🎯 Opportunities & Company Intelligence
| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/opportunities` | `GET` | Lists all scouted and semantically ranked opportunities. |
| `/api/opportunities/custom-search` | `POST` | Searches live opportunities with custom query and category. |
| `/api/company/deep-research` | `POST` | Executes Firecrawl deep research over company domain and tech culture. |
| `/api/opportunities/{id}/deep-research`| `POST` | Fetches target opportunity and performs deep company research. |

### 📝 Resume Studio & Tailoring
| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/tailor` | `POST` | Generates company-specific tailored resume using Docling and company intel. |
| `/api/resume/refine` | `POST` | Refines resume markdown (ATS optimize, quantify metrics, pitch, polish). |
| `/api/resume/download-pdf` | `GET` / `POST` | Compiles and downloads publication-grade tailored PDF. |
| `/api/tailored-resumes` | `GET` | Lists all generated tailored resumes. |

### 🤖 Multi-Agent Pipelines & Governance
| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/autopilot/run` | `POST` | Executes one-click end-to-end Career Autopilot master pipeline. |
| `/api/process-resume` | `POST` | Executes full 8-stage ArmorIQ governed pipeline on resume text. |
| `/api/adk/graph` | `GET` | Proxies Google ADK multi-agent execution graph topology. |
| `/api/root-agent` | `POST` | Direct interactive endpoint for the Google ADK Root Coordinator Agent. |
| `/api/audit-logs` | `GET` | Fetches live ArmorIQ cryptographic governance audit trail logs. |
| `/api/demo/trigger-attack` | `POST` | Simulates prompt attack with ArmorIQ Shield ON/OFF toggle. |
| `/api/database/reset` | `POST` | Resets database and re-seeds clean candidate knowledge bases. |

---

## 🚀 Installation & Running Guide

### Prerequisites
* Python 3.10+ (tested on Python 3.13)
* Node.js 18+ & npm
* Groq Cloud API Key (and optional Gemini / Firecrawl / Supabase API keys)

---

### Step 1: Clone & Configure Environment
```bash
git clone https://github.com/Krati-orbit/automatic-hack.git
cd automatic-hack
```

Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=groq/qwen/qwen3.8-27b
GEMINI_API_KEY=your_gemini_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
```

---

### Step 2: Install Dependencies

**Python Backend Dependencies:**
```bash
pip install fastapi uvicorn pydantic python-dotenv litellm google-adk google-generativeai docling docling-core pypdf weasyprint httpx
```

**Frontend Dependencies:**
```bash
cd frontend
npm install
cd ..
```

---

### Step 3: Run Backend API Server (FastAPI)
In your main terminal:
```bash
python -m uvicorn api:app --reload --port 8000
```
* **API Base:** [http://localhost:8000](http://localhost:8000)
* **Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Step 4: Run Frontend Dashboard (React + Vite)
In a second terminal:
```bash
cd frontend
npm run dev
```
* **Web Dashboard:** [http://localhost:5173](http://localhost:5173)

---

### Step 5: Run Google ADK Web UI (Optional Agent Dev UI)
In a third terminal:
```bash
adk web --port 8080 my_agent
```
* **ADK Dashboard:** [http://localhost:8080](http://localhost:8080)

---

## 🧪 Live Demo & Verification Walkthrough

1. **Candidate Profile & Authentication:**
   * Open [http://localhost:5173](http://localhost:5173) and log in as **Mohit** (AI/ML), **Vishnu** (Backend), or **Krati** (Frontend), or register a fresh account.
2. **Documents & Knowledge Base:**
   * Navigate to **📄 Documents** to upload resumes (PDF, DOCX, Images).
   * Observe Docling converting documents into semantic chunks and Gemini generating 768d vector embeddings.
3. **Opportunities & Deep Company Intel:**
   * Navigate to **🎯 Opportunities** to view live scouted roles ranked by semantic cosine similarity.
   * Click **Company Intel** on any card to inspect Firecrawl research (tech stacks, culture, ATS keywords).
4. **Interactive Resume Studio:**
   * Click **Tailor Resume** on any opportunity.
   * Use AI Refinement chips (ATS Optimize, Quantify Metrics, Hackathon Pitch, Polish) and click **Download PDF** to export publication-grade resumes.
5. **ArmorIQ Governance & Attack Interception:**
   * Navigate to **🛡️ ArmorIQ Observatory**.
   * With **Shield ON (Green)**, click **Simulate Prompt Attack** $\rightarrow$ verifies cryptographic interception of `auto_apply_job` with a 4-step Trajectory Trace.
   * Toggle **Shield OFF (Red)** and click **Simulate Prompt Attack** $\rightarrow$ verifies demonstration of an unmitigated scope breach.

---

## 📜 Hackathon Compliance & Alignment Matrix

| Hackathon Rule (Problem 2) | CareerOS Implementation Verification |
| :--- | :--- |
| **1. Every sub-agent must have $\ge 1$ MCP tool** | All 8 sub-agents have dedicated MCP servers and executable tools (no decorative/pure-prompt agents). |
| **2. Sub-agents must run with separate keypairs** | Each sub-agent runs with an isolated RSA / Ed25519 cryptographic keypair generated in `armoriq_crypto.py`. |
| **3. Demo at least one scope violation** | Interactive attack simulator triggers unauthorized tool `auto_apply_job`; ArmorIQ catches and blocks before execution. |
| **4. Use ArmorIQ SDK core methods** | Implements `capture_plan()` on Root, `delegate()` for signed delegation tokens, and `invoke()` for verification. |
| **5. Bonus: Delegated Token Expiry** | Root issues short-lived delegation tokens (TTL = 300s). Expired token tool invocation is rejected by ArmorIQ. |

---

## 👥 Contributors & Acknowledgments

* **Hackathon Submission Track:** Problem 2 — *"Who authorized that?"*
* **Core Technologies:** ArmorIQ SDK, Google Agent Development Kit (ADK), IBM Docling, Google Gemini Embedding 001, LiteLLM, Groq Cloud AI, Firecrawl MCP, FastAPI, React 19, Tailwind CSS.
