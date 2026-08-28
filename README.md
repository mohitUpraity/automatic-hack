# 🤖 CareerOS v3 — Zero-Trust Multi-Agent Career Intelligence & Real-Time AI Interview Platform

> **Hackathon Submission Track:** Problem 2 — *"Who authorized that?"* (Multi-Agent Delegation & Governance) + Problem 1 (*Human-in-the-Loop High-Stakes Action Governance*)  
> **Core Architecture:** ArmorIQ SDK + Google ADK + Gemini Multimodal Live API + IBM Docling + Gemini 768d Embeddings + Decoupled MCP Tool Servers + Supabase / SQLite + ZopDay Cloud Deployment  
> **GitHub Repository:** [https://github.com/Krati-orbit/automatic-hack](https://github.com/Krati-orbit/automatic-hack)

---

## 🌟 Executive Summary

**CareerOS v3** is a production-grade, zero-trust autonomous multi-agent career intelligence and real-time interview acceleration platform. It ingests multi-format candidate resumes and portfolio documents, constructs a dense vector knowledge base using IBM Docling and Google Gemini 768d embeddings, performs domain-clustered cosine semantic matching across live opportunities (Jobs, Internships, Competitions, Hackathons, Conclaves), extracts deep company tech stack and culture intelligence, dynamically tailors publication-grade resumes, executes an autonomous one-click career autopilot, and conducts **real-time multimodal AI video & voice mock interviews with live bar-raiser debriefs**.

To solve **Problem 2 ("Who authorized that?")** and **Problem 1 ("High-Stakes Autonomous Action Hold")**, CareerOS enforces **Zero-Trust Cryptographic Delegation Protocols**:
* **Cryptographic Keypair Isolation:** Every sub-agent operates with its own isolated asymmetric cryptographic keypair (RSA / Ed25519) generated in `armoriq_crypto.py`.
* **Decoupled MCP Tool Servers:** Sub-agents invoke tools strictly through isolated Model Context Protocol (MCP) server modules (`my_agent/mcp_servers/`).
* **ArmorIQ Core Security Protocols:** Uses `capture_plan()` on the Root Coordinator, `delegate()` for cryptographically signed delegation tokens (with 300s TTL), and `invoke()` for runtime verification of caller identity, token expiration, and authorized tool scopes.
* **Multi-Scenario Threat Interception:** Any unauthorized or injected tool call (e.g. prompt injections attempting `auto_apply_job`, destructive database operations, or stale token replay attacks) is cryptographically intercepted and **blocked before execution**, rendering a real-time 4-step Trajectory Trace.
* **Human-in-the-Loop High-Stakes Action Holding (Problem 1):** Irreversible high-stakes commitments (such as binding job offers or automated contract acceptances) are placed in a secure HOLD state until validated by a human supervisor signature.

---

## 🔄 Platform Evolution: v1 vs v2 vs v3 Architecture Matrix

| Architectural Dimension | v1: Baseline Prototype | v2: Autonomous Multi-Agent | v3: Full Enterprise Platform (Current) |
| :--- | :--- | :--- | :--- |
| **Multi-Agent Orchestration** | 5 rigid sequential sub-agents with fixed single-turn execution. | 8 specialized autonomous sub-agents coordinated by Google ADK Root Agent. | **10+ specialized autonomous sub-agents** (including Bar-Raiser Interview Panel, Behavioral Observers, ATS 90+ Goal Optimizers) with dynamic routing and event streaming. |
| **Document AI & Ingestion** | Basic `pypdf` extraction; layout and hierarchy lost. | IBM Docling Engine with `HierarchicalChunker` (PDF, DOCX, Images, OCR, URLs). | **IBM Docling Document AI + URL Scraping**: Multi-column AST preservation, section hierarchy tagging, and golden template master synchronization. |
| **Knowledge Base & RAG** | Flat SQLite database records with direct text field queries. | Hybrid RAG with 768d Gemini Embedding 001 and Supabase `pgvector`. | **Asymmetric Hybrid RAG (`RETRIEVAL_DOCUMENT` / `RETRIEVAL_QUERY`)**: Sub-second semantic search, candidate persona separation, and SQLite vector fallback. |
| **Opportunity Matching** | Naive keyword string matching. | Mathematical Semantic Vector Engine (`semantic_matcher.py`) with cosine projection. | **Domain-Weighted Semantic Clustering**: Multi-candidate specialization (Backend, Frontend, AI/ML, Wearables) with exact % fit calculation and curated feeds. |
| **Deep Web & Company Intel** | Basic web search summary. | Firecrawl MCP live scouting across 5 opportunity categories. | **HR-Grade Deep Company & JD Intelligence Engine**: Live domain research extracting production tech stacks, core values, ATS keywords, interview questions, and recruiter scoring criteria. |
| **Resume Tailoring & Studio** | Static profile rendering; no tailoring. | Interactive AI Resume Studio with WeasyPrint high-fidelity PDF export. | **Bidirectional Docling Round-Trip Tailoring**: Tailors markdown to company tech stack while guaranteeing **100% authentic metric preservation**; exports ATS-compliant PDFs with custom typography and divider styling. |
| **ATS Score Optimization** | Basic keyword count. | Standard ATS checklist. | **ATS 90+ Goal Optimizer Pipeline (`ats_goal_pipeline.py`)**: Computes exact keyword density, quantifies accomplishments, highlights gaps, and benchmarks against elite industry rubrics. |
| **AI Mock Interview Room** | Not available. | Not available. | **Real-Time Multimodal Video & Voice Interview Room (MeetAI)**: Powered by Gemini Multimodal Live API with Google Meet-style UI, real-time non-verbal telemetry (posture, eye contact, pacing), and ArmorIQ-governed 4-pillar debrief scorecard. |
| **Zero-Trust Governance** | Basic mock script with 1 scope check. | Comprehensive ArmorIQ Observatory with Shield ON/OFF and 300s TTL tokens. | **Multi-Scenario ArmorIQ Defense System**: Cross-agent privilege breach interception, stale token replay attack prevention, and Problem 1 human supervisor hold-and-approval workflow. |
| **Deployment & Cloud** | Local script only. | Local dev servers (`uvicorn` + `vite`). | **Cloud-Native ZopDay / Docker Architecture**: Multi-stage `Dockerfile`, `zopday.yaml` manifest, container health probes (`/api/health`), and ZopDay MCP IDP support. |

---

## 🏛️ System Architecture & Sub-Agent Topology

```text
                                Candidate Documents (PDF / DOCX / Scans / URLs)
                                                       │
                                                       ▼
                                        ┌────────────────────────────┐
                                        │   Root Coordinator Agent   │ ──► capture_plan() & delegate(tokens)
                                        └──────────────┬─────────────┘
                                                       │ (Cryptographically Signed Delegation Tokens with TTL)
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
    ┌───────────────────────┼──────────────────────────┬──────────────────────────┐
    ▼                       ▼                          ▼                          ▼
Sub-Agent 6             Sub-Agent 7                Sub-Agent 8                Sub-Agent 9 / 10
opportunity_ranker      knowledge_builder          resume_tailor              bar_raiser_panel & debrief_synthesizer
(Keypair 6)             (Keypair 7)                (Keypair 8)                (Keypair 9 & 10)
    │                       │                          │                          │
    ▼                       ▼                          ▼                          ▼
MCP Server 6            MCP Server 7               MCP Server 8               MCP Interview Server
(ranked:write)          (knowledge:read)           (tailored:write)           (panel:synthesize, debrief:write)
```

---

## 🎙️ Real-Time Multimodal AI Interview Room (v3 Feature)

CareerOS v3 features a **Google Meet-style Real-Time AI Video & Voice Interview Room**:

1. **Gemini Multimodal Live API Full-Duplex Audio & Video:**
   * Natural, low-latency, interruptible voice conversation with Dr. Elena Vance (Lead Bar-Raiser).
   * WebRTC / WebSocket audio streaming with live webcam and screen-sharing support.
2. **Deep Company & Resume Grounding:**
   * Prompts are dynamically contextualized using scraped company intelligence (tech stack, values, evaluation criteria) and the candidate's uploaded resume.
3. **Real-Time Telemetry & Observational Sub-Agents:**
   * Monitors non-verbal cues: posture stability, eye contact percentage, speech pacing, and answer clarity.
4. **ArmorIQ-Governed 4-Pillar Debrief & Scorecard:**
   * Automatically executes the `panel_synthesizer` sub-agent under ArmorIQ governance:
     * **Technical Score (/30)**
     * **Problem Solving (/25)**
     * **Communication (/25)**
     * **Culture Fit (/20)**
   * Delivers a question-by-question breakdown, candidate answer critique, flawless 10/10 benchmark answers, and a personalized study roadmap.

---

## 🛡️ Zero-Trust ArmorIQ Governance Protocols

CareerOS fulfills all requirements for **Hackathon Problem 2 ("Who authorized that?")** and **Problem 1**:

### 1. Plan Capture (`capture_plan`)
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
```python
scout_token = armoriq.delegate(
    parent_agent_id="root_coordinator_agent",
    parent_keypair=root_keypair,
    sub_agent_id="opportunity_scout",
    allowed_scopes=["profiles:read", "opportunities:write", "web:search"],
    allowed_tools=["mcp_scout.scout_and_store_opportunities"],
    ttl_seconds=300  # Cryptographically expires in 300 seconds
)
```

### 3. Tool Invocation & Verification (`invoke`)
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

### 4. Threat Interception & Shield Scenarios
* **Scenario 1: Cross-Agent Privilege Breach:** An agent attempts an out-of-scope tool call (`auto_apply_job`). ArmorIQ intercepts and blocks execution before any HTTP request occurs.
* **Scenario 2: Stale Token TTL Expiration Replay Attack:** An attacker attempts to reuse an expired delegation token (>300s). ArmorIQ detects expired timestamp `exp` and rejects invocation.
* **Scenario 3: Problem 1 High-Stakes Action Hold:** High-stakes commitments (`accept_binding_job_offer`) are held in quarantine until an authorized supervisor signs the approval request (`/api/demo/approve-action`).

---

## 📡 REST API Reference

### 🔐 Authentication & Profile Management
| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/auth/login` | `POST` | Authenticates user or performs 1-click candidate profile login. |
| `/api/auth/register` | `POST` | Registers a new user with an isolated profile and knowledge base. |
| `/api/user/profile` | `GET` / `POST` | Retrieves or updates candidate profile, target roles, and social URLs. |
| `/api/user/upload-template` | `POST` | Parses uploaded resume via Docling and stores as master template. |
| `/api/candidates` | `GET` / `POST` | Lists all candidate personas or creates a new candidate persona. |

### 🎙️ Real-Time AI Video & Voice Interview Room (v3)
| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/interview/upload-resume` | `POST` | Ingests and parses candidate's uploaded interview resume. |
| `/api/interview/init-session` | `POST` | Initializes interview session config with scraped company tech stack & Bar-Raiser prompt. |
| `/api/interview/debrief` | `POST` | Synthesizes ArmorIQ-governed multi-panel debrief scorecard & study roadmap. |
| `/api/interview/history` | `GET` | Retrieves candidate's past interview session debriefs and telemetry. |

### 🎯 Opportunities & ATS 90+ Goal Intelligence
| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/opportunities` | `GET` | Lists scouted opportunities ranked by cosine semantic similarity. |
| `/api/opportunities/custom-search` | `POST` | Live search for jobs, internships, hackathons, and conclaves. |
| `/api/company/deep-research` | `POST` | Firecrawl deep research over target company tech stacks and culture. |
| `/api/company-jd-deep-intel` | `POST` | Generates HR-grade company & JD intelligence with interview questions. |
| `/api/ats-goal-pipeline` | `POST` | Runs ATS 90+ Goal Optimizer, keyword density audit, and enhancement. |

### 📄 Documents, Knowledge Base & RAG
| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/documents/upload` | `POST` | Converts files via Docling, generates 768d Gemini embeddings, indexes in DB. |
| `/api/documents` | `GET` | Lists all documents belonging to the candidate. |
| `/api/documents/{doc_id}` | `DELETE` | Removes document and cascades vector deletions. |
| `/api/knowledge/search` | `POST` | Executes asymmetric RAG vector similarity search over candidate data. |
| `/api/query-db` | `POST` | RAG-powered interactive Q&A assistant. |

### 📝 Resume Studio & PDF Generation
| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/tailor` | `POST` | Generates company-tailored resume with authentic metric preservation. |
| `/api/resume/refine` | `POST` | AI refinement chips (ATS Optimize, Quantify Metrics, Pitch, Polish). |
| `/api/resume/download-pdf` | `POST` | Renders and downloads high-fidelity PDF with custom styling. |
| `/api/tailored-resumes` | `GET` | Lists all generated tailored resumes. |

### 🛡️ Multi-Agent Orchestration & ArmorIQ Governance
| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/autopilot/run` | `POST` | Executes 1-click end-to-end Career Autopilot pipeline. |
| `/api/audit-logs` | `GET` | Fetches live cryptographic governance audit trail logs. |
| `/api/demo/trigger-attack` | `POST` | Triggers simulated attack with Shield ON/OFF toggle and Trajectory Trace. |
| `/api/demo/approve-action` | `POST` | Problem 1 supervisor resolution for quarantined high-stakes actions. |
| `/api/health` | `GET` | Container health probe for ZopDay / cloud load balancers. |

---

## ☁️ Cloud & ZopDay Deployment Guide

CareerOS is containerized using a **production multi-stage Docker build** that serves both the React 19 Frontend and FastAPI Backend under port `8000`.

### 1. Deploy on ZopDay (1-Click Git Connect)

1. Log into your **ZopDay / ZopDev Console** ([zop.dev](https://zop.dev)).
2. Click **+ New Deployment** and connect the repository:
   ```text
   https://github.com/Krati-orbit/automatic-hack
   ```
3. Set the build parameters:
   * **Build Type:** `Docker`
   * **Dockerfile Path:** `./Dockerfile`
   * **Port:** `8000`
   * **Health Check Path:** `/api/health`
4. Set Environment Variables in ZopDay Secrets:
   * `GROQ_API_KEY`, `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`
5. Click **Deploy**. ZopDay will build the frontend, install OCR and PDF libraries, and launch the unified container.

### 2. Local Docker Deployment

```bash
docker compose up --build
```
* **Unified Web App:** [http://localhost:8000](http://localhost:8000)
* **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 🚀 Local Development Setup

### Step 1: Clone & Configure `.env`
```bash
git clone https://github.com/Krati-orbit/automatic-hack.git
cd automatic-hack
```

Create `.env`:
```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=groq/qwen/qwen3.8-27b
GEMINI_API_KEY=your_gemini_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_or_service_key
JWT_SECRET=careeros_super_secret_jwt_key
```

### Step 2: Install Dependencies
```bash
# Backend dependencies
pip install -r requirements.txt

# Frontend dependencies
cd frontend
npm install
cd ..
```

### Step 3: Run Servers
```bash
# Terminal 1: Backend API Server
python -m uvicorn api:app --reload --port 8000

# Terminal 2: Frontend Dashboard
cd frontend
npm run dev
```

* **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
* **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📜 Hackathon Compliance Scorecard (Problem 2 & Problem 1)

| Rule / Requirement | Status | Verification in CareerOS v3 |
| :--- | :---: | :--- |
| **Every Sub-Agent has $\ge 1$ MCP Tool** | ✅ Verified | All sub-agents invoke tools through decoupled MCP servers under `my_agent/mcp_servers/`. |
| **Sub-Agents run with Separate Keypairs** | ✅ Verified | Asymmetric RSA keypairs generated per sub-agent in `armoriq_crypto.py`. |
| **Demonstrate Scope Violation Interception** | ✅ Verified | Intercepts unauthorized tool calls (`auto_apply_job`) with 4-step Trajectory Trace. |
| **Use ArmorIQ SDK Core Methods** | ✅ Verified | `capture_plan()`, `delegate()`, and `invoke()` integrated in `armoriq_wrapper.py`. |
| **Delegated Token Expiry (TTL)** | ✅ Verified | Delegation tokens enforce 300s TTL; expired token replay attacks are blocked. |
| **Problem 1 High-Stakes Action Hold** | ✅ Verified | Irreversible actions (`accept_binding_job_offer`) require supervisor approval (`/api/demo/approve-action`). |

---

## 👥 Contributors & Acknowledgments

* **Hackathon Track:** Problem 2 — *"Who authorized that?"* & Problem 1
* **Core Technologies:** ArmorIQ SDK, Google Agent Development Kit (ADK), Gemini Multimodal Live API, IBM Docling, Google Gemini Embedding 001, LiteLLM, Groq Cloud AI, Firecrawl MCP, FastAPI, React 19, Tailwind CSS, ZopDay IDP.
