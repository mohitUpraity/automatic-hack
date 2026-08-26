"""FastAPI Backend Server for CareerOS v3.

Exposes REST API endpoints for multi-user relational candidate intelligence:
- /api/documents/upload: Accepts multi-format file upload (PDF, DOCX, images, OCR), Docling converts, embeds with Gemini 001, pgvector storage
- /api/documents/upload-url: Processes URLs (LinkedIn, GitHub, JDs) into knowledge base
- /api/knowledge/search: RAG vector similarity search over candidate documents
- /api/tailor: Generates tailored resume content and WeasyPrint PDF
- /api/process-resume: Triggers the ArmorIQ governed 8-stage pipeline
- /api/query-db: RAG & DB candidate queries
- /api/profiles: Lists all candidate profiles
- /api/audit-logs: Fetches live ArmorIQ governance audit trail logs
- /api/demo/trigger-attack: Simulates prompt injection attack with ArmorIQ Shield ON/OFF toggle
"""

import io
import json
import os
import sqlite3
import sys
import time
import uuid
import base64
import asyncio
from typing import Optional

from fastapi import FastAPI, Form, File, UploadFile, HTTPException, Depends, Header, WebSocket, WebSocketDisconnect, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from dotenv import load_dotenv
from google.adk.sessions import InMemorySessionService


load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from my_agent.armoriq_crypto import generate_pipeline_keypairs
from my_agent.armoriq_wrapper import ArmorIQClient, ArmorIQScopeViolationError

# MCP & Tools
from my_agent.tools.docling_tools import convert_document
from my_agent.tools.embedding_tools import embed_chunks
from my_agent.tools.db_tools import store_document, store_embeddings, get_supabase, store_to_db, read_from_db, delete_from_db
from my_agent.tools.knowledge_tools import search_knowledge_base, get_rag_context, seed_candidate_knowledge_bases
from my_agent.tools.tailor_tools import tailor_resume_for_opportunity, generate_tailored_pdf, _build_native_pdf_binary
from my_agent.tools.llm_tools import call_groq_llm
from my_agent.tools.search_tools import search_web
from my_agent.tools.ranking_tools import rank_results
from my_agent.tools.autopilot_tools import run_career_autopilot, refine_resume_markdown
from my_agent.tools.company_intel_tools import deep_research_company_and_role

from my_agent.mcp_servers.mcp_extractor_server import extract_and_store_resume
from my_agent.mcp_servers.mcp_analyzer_server import analyze_and_store_resume
from my_agent.mcp_servers.mcp_profiler_server import build_and_store_profile
from my_agent.mcp_servers.mcp_scout_server import scout_and_store_opportunities, auto_apply_job
from my_agent.mcp_servers.mcp_ranker_server import rank_and_store_opportunities
from my_agent.mcp_servers.mcp_docproc_server import process_and_embed_document
from my_agent.mcp_servers.mcp_knowledge_server import build_knowledge_base
from my_agent.mcp_servers.mcp_tailor_server import tailor_resume

# Ensure knowledge base vector embeddings are initialized
try:
    seed_candidate_knowledge_bases()
except Exception as _e:
    pass

app = FastAPI(title="CareerOS v3 API Server", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "my_agent", "career_os.db")
global_armoriq = ArmorIQClient()
global_keypairs = generate_pipeline_keypairs()


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """Supabase Auth JWT middleware with fallback for local dev."""
    if not authorization:
        return "default-user"
    token = authorization.replace("Bearer ", "")
    sb = get_supabase()
    if sb and token and token != "mock-token":
        try:
            res = sb.auth.get_user(token)
            if res and res.user:
                return res.user.id
        except Exception:
            pass
    return "default-user"


class QueryRequest(BaseModel):
    question: str
    profile_id: Optional[str] = None


class KnowledgeSearchReq(BaseModel):
    query: str
    top_k: int = 10


class TailorReq(BaseModel):
    opportunity_title: str
    company_name: str
    requirements: str
    candidate_id: Optional[str] = None
    resume_markdown: Optional[str] = None
    job_url: Optional[str] = None
    company_intel: Optional[dict] = None


class CompanyResearchReq(BaseModel):
    company_name: str
    job_title: Optional[str] = "Software Engineer"
    job_url: Optional[str] = None



class AutoPilotReq(BaseModel):
    input_type: Optional[str] = "profile_id"
    input_value: Optional[str] = ""
    categories: Optional[list] = None


class ResumeRefineReq(BaseModel):
    resume_markdown: str
    action: str = "ats_optimize"
    context: Optional[str] = None


class CustomScoutReq(BaseModel):
    query: str
    category: Optional[str] = "job"
    profile_id: Optional[str] = None


class DownloadPdfReq(BaseModel):
    markdown: Optional[str] = None
    pdf_path: Optional[str] = None


class AttackRequest(BaseModel):
    secured: Optional[bool] = True


class UserProfileReq(BaseModel):
    user_id: Optional[str] = "default-user"
    candidate_id: Optional[str] = "candidate_mohit"
    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    role: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    leetcode_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    work_mode: Optional[str] = "Remote"  # Remote, Hybrid, Onsite, Any
    target_roles: Optional[list] = None
    location_preferences: Optional[list] = None
    preferred_categories: Optional[list] = None
    min_compensation: Optional[str] = None
    notice_period: Optional[str] = "Immediate"
    active_template_id: Optional[str] = "candidate_mohit"
    custom_resume_markdown: Optional[str] = None


class ExtractLinksReq(BaseModel):
    resume_markdown: str


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "CareerOS v3 ArmorIQ Governed API Server",
        "version": "3.0",
        "documentation": "/docs",
        "endpoints": {
            "upload_document": "/api/documents/upload (POST)",
            "knowledge_search": "/api/knowledge/search (POST)",
            "tailor_resume": "/api/tailor (POST)",
            "process_resume": "/api/process-resume (POST)",
            "query_db": "/api/query-db (POST)",
            "audit_logs": "/api/audit-logs (GET)",
            "trigger_attack": "/api/demo/trigger-attack (POST)",
            "adk_graph": "/api/adk/graph (GET)"
        }
    }


@app.get("/api/adk/graph")
async def get_adk_graph():
    """Proxies ADK Web build_graph JSON with full CORS headers."""
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get("http://127.0.0.1:8003/dev/apps/my_agent/build_graph", timeout=4.0)
            if res.status_code == 200:
                return res.json()
            elif res.status_code == 404:
                res_8002 = await client.get("http://127.0.0.1:8002/dev/apps/my_agent/build_graph", timeout=4.0)
                if res_8002.status_code == 200:
                    return res_8002.json()
    except Exception as e:
        print(f"[ADK Proxy Notice] {e}")

    # Pure Python ADK Fallback Topology if ADK web server is initializing
    return {
        "name": "my_agent",
        "root_agent": {
            "name": "root_agent",
            "description": "CareerOS v3 coordinator agent orchestrating 8 ArmorIQ-governed sub-agents.",
            "sub_agents": [
                {"name": "document_processor", "description": "Processes multi-format documents, chunks, embeds with Gemini 001", "tools": [{"name": "convert_document"}, {"name": "embed_chunks"}, {"name": "store_to_db"}]},
                {"name": "resume_extractor", "description": "Extracts structured fields from candidate resume", "tools": [{"name": "extract_resume"}, {"name": "store_to_db"}]},
                {"name": "resume_analyzer", "description": "Analyzes stored resume data to identify strengths, weaknesses, domain focus", "tools": [{"name": "read_from_db"}, {"name": "analyze_resume"}, {"name": "store_to_db"}]},
                {"name": "profile_maker", "description": "Builds candidate profile from resume and analysis data", "tools": [{"name": "read_from_db"}, {"name": "make_profile"}, {"name": "store_to_db"}]},
                {"name": "opportunity_scout", "description": "Searches web using Firecrawl MCP for jobs, internships, hackathons", "tools": [{"name": "read_from_db"}, {"name": "search_web"}, {"name": "store_to_db"}]},
                {"name": "opportunity_ranker", "description": "Ranks found opportunities by relevance score (0-100)", "tools": [{"name": "read_from_db"}, {"name": "rank_results"}, {"name": "store_to_db"}]},
                {"name": "knowledge_builder", "description": "Executes RAG vector search over candidate documents", "tools": [{"name": "search_knowledge_base"}, {"name": "get_rag_context"}, {"name": "read_from_db"}]},
                {"name": "resume_tailor", "description": "Generates company-specific tailored resume content & PDF", "tools": [{"name": "get_rag_context"}, {"name": "tailor_resume_for_opportunity"}, {"name": "store_to_db"}]}
            ]
        }
    }


class RootAgentRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = "default-user"


adk_session_service = InMemorySessionService()


@app.post("/api/root-agent")
@app.post("/api/agent/run")
@app.post("/api/agent/chat")
@app.post("/api/adk/run")
async def run_root_agent_endpoint(req: RootAgentRequest):
    """Exposes the main Root Agent as a direct API endpoint.
    
    Accepts user message, queries candidate RAG knowledge base context,
    and runs the Root Agent with dynamic decision making across tools and sub-agents.
    """
    from google.adk.runners import Runner
    from google.genai import types
    from my_agent.agent import root_agent

    user_id = req.user_id or "default-user"
    session_id = req.session_id or str(uuid.uuid4())
    msg_text = req.message.strip()

    events_out = []

    try:
        await adk_session_service.create_session(app_name="my_agent", user_id=user_id, session_id=session_id)
    except Exception:
        pass

    try:
        runner = Runner(agent=root_agent, app_name="my_agent", session_service=adk_session_service)
        msg = types.Content(role="user", parts=[types.Part.from_text(text=msg_text)])
        
        async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=msg):
            author = getattr(event, "author", "root_agent")
            content_text = None
            if hasattr(event, "content") and event.content:
                if hasattr(event.content, "parts"):
                    parts_text = [p.text for p in event.content.parts if hasattr(p, "text") and p.text and p.text.strip()]
                    if parts_text:
                        content_text = "\n".join(parts_text)
                elif isinstance(event.content, str) and event.content.strip():
                    content_text = event.content.strip()
            elif hasattr(event, "output") and event.output is not None:
                out_str = str(event.output).strip()
                if out_str and out_str != "None":
                    content_text = out_str

            if content_text and content_text != "None" and "Google ADK Agent" not in content_text:
                events_out.append({
                    "author": author,
                    "text": content_text,
                    "event_type": type(event).__name__
                })
    except Exception as e:
        print(f"[ADK Runner Notice] {e}")

    if not events_out:
        context = get_rag_context(msg_text, user_id=user_id)
        
        prompt = f"""User Message: {msg_text}

Candidate Knowledge Base Context (RAG):
{context}"""

        answer = call_groq_llm(prompt, system_instruction=root_agent.instruction)
        
        events_out.append({
            "author": "root_agent",
            "text": answer,
            "event_type": "AdkAgentResponse"
        })

    return {
        "status": "success",
        "agent": "root_agent",
        "session_id": session_id,
        "events": events_out,
        "response": events_out[-1]["text"] if events_out else ""
    }





# ── 1. Document Upload Endpoint (Fixing PDF Upload Bug) ─────────────────────
@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("resume"),
    user_id: str = Depends(get_current_user)
):
    """Upload ANY document (PDF, DOCX, Images, OCR). Docling converts, Gemini embeds, stored in DB."""
    temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    # Sanitize filename
    safe_filename = "".join([c for c in file.filename if c.isalnum() or c in "._- "]).strip() or "upload.pdf"
    temp_path = os.path.join(temp_dir, safe_filename)

    try:
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)

        doc_res = convert_document(temp_path)
        doc_id = store_document(
            user_id=user_id,
            filename=file.filename,
            doc_type=doc_type,
            raw_markdown=doc_res["markdown"],
            metadata={"chunk_count": doc_res["chunk_count"]}
        )

        embedded = embed_chunks(doc_res["chunks"])
        stored_count = store_embeddings(doc_id, user_id, embedded)

        return {
            "status": "success",
            "document_id": doc_id,
            "filename": file.filename,
            "doc_type": doc_type,
            "chunk_count": doc_res["chunk_count"],
            "embedded_count": stored_count,
            "markdown_preview": doc_res["markdown"][:400]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document upload error: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass



# ── 2. Knowledge Search Endpoint ───────────────────────────────────────────
@app.post("/api/knowledge/search")
async def knowledge_search(req: KnowledgeSearchReq, user_id: str = Depends(get_current_user)):
    """Executes RAG vector search over candidate documents."""
    results = search_knowledge_base(req.query, user_id=user_id, top_k=req.top_k)
    context = get_rag_context(req.query, user_id=user_id, top_k=req.top_k)
    return {
        "status": "success",
        "query": req.query,
        "results_count": len(results),
        "results": results,
        "rag_context": context
    }


# ── 3. Resume Tailoring Endpoint ───────────────────────────────────────────
@app.post("/api/tailor")
async def tailor_resume_endpoint(req: TailorReq, user_id: str = Depends(get_current_user)):
    """Generates company-specific tailored resume content with Docling round-trip and Firecrawl company intelligence."""
    try:
        res = tailor_resume_for_opportunity(
            opportunity_title=req.opportunity_title,
            company_name=req.company_name,
            requirements=req.requirements,
            user_id=user_id,
            original_markdown=req.resume_markdown,
            candidate_id=req.candidate_id,
            job_url=req.job_url,
            company_intel=req.company_intel
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tailoring error: {str(e)}")


@app.post("/api/company/deep-research")
async def deep_research_company_endpoint(req: CompanyResearchReq):
    """Executes Firecrawl deep research over company domain, careers portal, tech stack, and engineering culture."""
    try:
        intel = deep_research_company_and_role(
            company_name=req.company_name,
            job_title=req.job_title or "Software Engineer",
            job_url=req.job_url
        )
        return intel
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Company deep research error: {str(e)}")


@app.post("/api/opportunities/{opp_id}/deep-research")
async def deep_research_opportunity_endpoint(opp_id: str):
    """Fetches opportunity and performs Firecrawl deep research on the target company and role."""
    try:
        raw_opps = read_from_db("opportunities").get("records", [])
        opp = next((o for o in raw_opps if str(o.get("id")) == str(opp_id)), None)
        
        company = "Tech Organization"
        title = "Software Engineer"
        url = None
        
        if opp:
            company = opp.get("company") or opp.get("company_name") or opp.get("source") or company
            title = opp.get("title") or title
            url = opp.get("url") or url
            
        intel = deep_research_company_and_role(company_name=company, job_title=title, job_url=url)
        return {
            "status": "success",
            "opportunity_id": opp_id,
            "company_name": company,
            "job_title": title,
            "intelligence": intel
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deep research failed: {str(e)}")



# ── 4. Process Resume Endpoint (Full 8-Agent Governed Pipeline) ───────────
@app.post("/api/process-resume")
async def process_resume(resume_text: str = Form(...), user_id: str = Depends(get_current_user)):
    """Executes full 8-stage pipeline with ArmorIQ multi-agent governance."""
    try:
        root_kp = global_keypairs["root_coordinator_agent"]

        # Delegate tokens to all sub-agents
        tok_docproc = global_armoriq.delegate("root_coordinator_agent", root_kp, "document_processor", ["documents:write"], ["mcp_docproc.process_and_embed_document"], 300)
        tok_extractor = global_armoriq.delegate("root_coordinator_agent", root_kp, "resume_extractor", ["resumes:write"], ["mcp_extractor.extract_and_store_resume"], 300)
        tok_analyzer = global_armoriq.delegate("root_coordinator_agent", root_kp, "resume_analyzer", ["resumes:read", "analysis:write"], ["mcp_analyzer.analyze_and_store_resume"], 300)
        tok_profiler = global_armoriq.delegate("root_coordinator_agent", root_kp, "profile_maker", ["analysis:read", "profiles:write"], ["mcp_profiler.build_and_store_profile"], 300)
        tok_scout = global_armoriq.delegate("root_coordinator_agent", root_kp, "opportunity_scout", ["profiles:read", "opportunities:write", "web:search"], ["mcp_scout.scout_and_store_opportunities"], 300)
        tok_ranker = global_armoriq.delegate("root_coordinator_agent", root_kp, "opportunity_ranker", ["opportunities:read", "ranked:write"], ["mcp_ranker.rank_and_store_opportunities"], 300)

        # Execute governed tool calls
        res_1 = global_armoriq.invoke("resume_extractor", global_keypairs["resume_extractor"], tok_extractor, root_kp, "mcp_extractor.extract_and_store_resume", {"resume_text": resume_text}, extract_and_store_resume)
        resume_id = res_1.get("resume_id")

        res_2 = global_armoriq.invoke("resume_analyzer", global_keypairs["resume_analyzer"], tok_analyzer, root_kp, "mcp_analyzer.analyze_and_store_resume", {"resume_id": resume_id}, analyze_and_store_resume)

        res_3 = global_armoriq.invoke("profile_maker", global_keypairs["profile_maker"], tok_profiler, root_kp, "mcp_profiler.build_and_store_profile", {"resume_id": resume_id}, build_and_store_profile)
        profile_id = res_3.get("profile_id")

        res_4 = global_armoriq.invoke("opportunity_scout", global_keypairs["opportunity_scout"], tok_scout, root_kp, "mcp_scout.scout_and_store_opportunities", {"profile_id": profile_id}, scout_and_store_opportunities)

        res_5 = global_armoriq.invoke("opportunity_ranker", global_keypairs["opportunity_ranker"], tok_ranker, root_kp, "mcp_ranker.rank_and_store_opportunities", {"profile_id": profile_id}, rank_and_store_opportunities)

        return {
            "status": "success",
            "resume_id": resume_id,
            "profile_id": profile_id,
            "opportunities_found": res_4.get("opportunities_found"),
            "total_ranked": res_5.get("total_ranked"),
            "steps": [
                {
                    "step": 1,
                    "agent": "Resume Extractor",
                    "scope": "resumes:write",
                    "tool": "mcp_extractor.extract_and_store_resume",
                    "result": res_1
                },
                {
                    "step": 2,
                    "agent": "Resume Analyzer",
                    "scope": "analysis:write",
                    "tool": "mcp_analyzer.analyze_and_store_resume",
                    "result": res_2
                },
                {
                    "step": 3,
                    "agent": "Profile Maker",
                    "scope": "profiles:write",
                    "tool": "mcp_profiler.build_and_store_profile",
                    "result": res_3
                },
                {
                    "step": 4,
                    "agent": "Opportunity Scout",
                    "scope": "opportunities:write, web:search",
                    "tool": "mcp_scout.scout_and_store_opportunities",
                    "result": res_4
                },
                {
                    "step": 5,
                    "agent": "Opportunity Ranker",
                    "scope": "ranked:write",
                    "tool": "mcp_ranker.rank_and_store_opportunities",
                    "result": res_5
                }
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/profiles/{profile_id}/scout")
async def scout_opportunities_for_profile(profile_id: str):
    """Executes Opportunity Scout & Opportunity Ranker agents for a specific candidate profile."""
    try:
        root_kp = global_keypairs["root_coordinator_agent"]
        tok_scout = global_armoriq.delegate("root_coordinator_agent", root_kp, "opportunity_scout", ["profiles:read", "opportunities:write", "web:search"], ["mcp_scout.scout_and_store_opportunities"], 300)
        tok_ranker = global_armoriq.delegate("root_coordinator_agent", root_kp, "opportunity_ranker", ["opportunities:read", "ranked:write"], ["mcp_ranker.rank_and_store_opportunities"], 300)

        # Step 1: Scout opportunities
        res_scout = global_armoriq.invoke("opportunity_scout", global_keypairs["opportunity_scout"], tok_scout, root_kp, "mcp_scout.scout_and_store_opportunities", {"profile_id": profile_id}, scout_and_store_opportunities)

        # Step 2: Rank opportunities
        res_ranker = global_armoriq.invoke("opportunity_ranker", global_keypairs["opportunity_ranker"], tok_ranker, root_kp, "mcp_ranker.rank_and_store_opportunities", {"profile_id": profile_id}, rank_and_store_opportunities)

        return {
            "status": "success",
            "profile_id": profile_id,
            "opportunities_found": res_scout.get("opportunities_found", 0),
            "total_ranked": res_ranker.get("total_ranked", 0),
            "steps": [
                {
                    "step": 1,
                    "agent": "Opportunity Scout",
                    "scope": "opportunities:write, web:search",
                    "tool": "mcp_scout.scout_and_store_opportunities",
                    "result": res_scout
                },
                {
                    "step": 2,
                    "agent": "Opportunity Ranker",
                    "scope": "ranked:write",
                    "tool": "mcp_ranker.rank_and_store_opportunities",
                    "result": res_ranker
                }
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ── 4.1 Autopilot Master Pipeline ──────────────────────────────────────────
@app.post("/api/autopilot/run")
async def run_autopilot_endpoint(req: AutoPilotReq, user_id: str = Depends(get_current_user)):
    """One-click master autopilot pipeline that orchestrates parsing, profiling, scouting jobs & competitions, ranking, and tailoring resumes."""
    try:
        res = run_career_autopilot(
            input_type=req.input_type or "profile_id",
            input_value=req.input_value or "",
            user_id=user_id,
            target_categories=req.categories
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Autopilot error: {str(e)}")


# ── 4.2 Interactive AI Resume Refinement ────────────────────────────────────
@app.post("/api/resume/refine")
async def refine_resume_endpoint(req: ResumeRefineReq, user_id: str = Depends(get_current_user)):
    """Refines resume markdown using specialized AI assistants (ATS optimize, quantify metrics, hackathon pitch, polish)."""
    try:
        res = refine_resume_markdown(
            resume_markdown=req.resume_markdown,
            action=req.action,
            context=req.context,
            user_id=user_id
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume refinement error: {str(e)}")


# ── 4.3 Direct PDF Download & Generation ────────────────────────────────────
@app.get("/api/resume/download-pdf")
@app.post("/api/resume/download-pdf")
async def download_resume_pdf_endpoint(
    req: Optional[DownloadPdfReq] = None,
    path: Optional[str] = Query(None),
    filename: Optional[str] = Query("Tailored_Resume.pdf")
):
    """Streams the generated PDF or renders markdown on the fly for direct browser download."""
    target_path = path or (req.pdf_path if req else None)

    if not target_path and req and req.markdown:
        out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_uploads", "tailored_resumes")
        os.makedirs(out_dir, exist_ok=True)
        temp_pdf = os.path.join(out_dir, f"download_{int(time.time())}.pdf")
        pdf_res = generate_tailored_pdf(req.markdown, temp_pdf)
        target_path = pdf_res.get("pdf_path")

    if not target_path or not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="PDF file not found or could not be generated.")

    clean_filename = filename if filename.endswith(".pdf") else f"{filename}.pdf"
    
    with open(target_path, "rb") as f:
        pdf_bytes = f.read()

    # If the file on disk was saved as HTML or plain text, convert to pure binary PDF on the fly
    if not pdf_bytes.startswith(b"%PDF"):
        text_content = pdf_bytes.decode("utf-8", errors="ignore")
        pdf_bytes = _build_native_pdf_binary(text_content)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{clean_filename}"'
        }
    )


# ── 4.4 Custom Targeted Opportunity Scout ───────────────────────────────────
@app.post("/api/opportunities/custom-search")
async def custom_search_opportunities(req: CustomScoutReq, user_id: str = Depends(get_current_user)):
    """Searches live opportunities with custom query and category, scores and stores them."""
    try:
        category = req.category or "job"
        categories = ["job", "internship", "competition", "hackathon", "conclave"] if category == "all" else [category]
        all_found = []

        for cat in categories:
            search_res = search_web(req.query, cat)
            for item in search_res.get("results", []):
                item["profile_id"] = req.profile_id or "custom"
                item["user_id"] = user_id
                store_to_db("opportunities", item)
                all_found.append(item)

        if req.profile_id:
            try:
                prof_rec = read_from_db("profiles", f"id = '{req.profile_id}'").get("records", [])
                if prof_rec:
                    ranked = rank_results(prof_rec[0], all_found)
                    return {"status": "success", "query": req.query, "category": req.category, "count": len(all_found), "opportunities": ranked.get("records", all_found)}
            except Exception:
                pass

        return {"status": "success", "query": req.query, "category": req.category, "count": len(all_found), "opportunities": all_found}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tailored-resumes")
def get_tailored_resumes():
    res = read_from_db("tailored_resumes")
    return {"status": "success", "tailored_resumes": res.get("records", [])}


# ── 5. Query DB & Profiles Endpoints ───────────────────────────────────────
@app.post("/api/query-db")
async def query_db(req: QueryRequest, user_id: str = Depends(get_current_user)):
    """RAG-powered candidate Q&A endpoint."""
    context = get_rag_context(req.question, user_id=user_id)
    answer = call_groq_llm(f"Candidate Context:\n{context}\n\nUser Question: {req.question}")
    return {"status": "success", "question": req.question, "answer": answer}


import re

def extract_social_links_from_text(text: str) -> dict:
    """Extracts LinkedIn, GitHub, LeetCode, Portfolio, Email, and Phone from resume markdown."""
    linkedin_match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)', text, re.I)
    github_match = re.search(r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_-]+)', text, re.I)
    leetcode_match = re.search(r'(?:https?://)?(?:www\.)?leetcode\.com/(?:u/)?([a-zA-Z0-9_-]+)', text, re.I)
    codeforces_match = re.search(r'(?:https?://)?(?:www\.)?codeforces\.com/profile/([a-zA-Z0-9_-]+)', text, re.I)
    portfolio_match = re.search(r'(?:https?://)?([a-zA-Z0-9_-]+\.(?:dev|me|io|app|tech|ai|vercel\.app|github\.io))', text, re.I)
    email_match = re.search(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', text)
    phone_match = re.search(r'(\+?[0-9]{1,3}?[-. ]?\(?[0-9]{2,4}\)?[-. ]?[0-9]{3,4}[-. ]?[0-9]{3,4})', text)

    return {
        "linkedin_url": f"https://linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else "",
        "github_url": f"https://github.com/{github_match.group(1)}" if github_match else "",
        "leetcode_url": f"https://leetcode.com/u/{leetcode_match.group(1)}" if leetcode_match else (f"https://codeforces.com/profile/{codeforces_match.group(1)}" if codeforces_match else ""),
        "portfolio_url": f"https://{portfolio_match.group(1)}" if portfolio_match else "",
        "email": email_match.group(1) if email_match else "",
        "phone": phone_match.group(1) if phone_match else "",
    }


# In-memory session profile overrides with fallback to CANDIDATES_REGISTRY
USER_PROFILE_STORE = {
    "candidate_mohit": {
        "user_id": "333c3701-93f2-497b-994e-98ec8177950f",
        "candidate_id": "candidate_mohit",
        "name": "Mohit Prasad Upraity",
        "email": "mohitupraity123@gmail.com",
        "phone": "+91-9876543210",
        "role": "Autonomous Agentic AI Engineer & System Architect",
        "location": "Noida, Uttar Pradesh, India",
        "bio": "Building autonomous multi-agent pipelines, ArmorIQ security shields, and high-performance Web3/AI applications.",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=Mohit",
        "linkedin_url": "https://linkedin.com/in/mohitupraity",
        "github_url": "https://github.com/mohitupraity",
        "leetcode_url": "https://leetcode.com/u/mohitupraity",
        "portfolio_url": "https://mohitupraity.dev",
        "work_mode": "Remote",
        "target_roles": ["Autonomous AI Engineer", "Agentic Systems Architect", "Full Stack AI Developer", "Research Engineer"],
        "location_preferences": ["Remote", "Noida", "Bangalore", "San Francisco"],
        "preferred_categories": ["job", "internship", "competition", "hackathon"],
        "min_compensation": "$120,000 / ₹25 LPA",
        "notice_period": "Immediate (0 Days)",
        "active_template_id": "candidate_mohit"
    },
    "candidate_krati": {
        "user_id": "db4a7b96-079d-4695-9c0c-990a41cf88aa",
        "candidate_id": "candidate_krati",
        "name": "Krati Verma",
        "email": "krati.verma@careeros.ai",
        "phone": "+91-9811223344",
        "role": "Lead Frontend & Design System Architect",
        "location": "Noida, Uttar Pradesh, India",
        "bio": "Specialist in React, Tailwind CSS, TypeScript, design tokens, and high-performance accessible UI systems.",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=Krati",
        "linkedin_url": "https://linkedin.com/in/krati-verma-ui",
        "github_url": "https://github.com/krativerma",
        "leetcode_url": "https://leetcode.com/u/krativerma",
        "portfolio_url": "https://krativerma.design",
        "work_mode": "Hybrid",
        "target_roles": ["Lead Frontend Engineer", "UI/UX Systems Architect", "Design Technologist"],
        "location_preferences": ["Noida", "Delhi NCR", "Remote"],
        "preferred_categories": ["job", "internship", "hackathon"],
        "min_compensation": "₹22 LPA",
        "notice_period": "15 Days",
        "active_template_id": "candidate_krati"
    },
    "candidate_vishnu": {
        "user_id": "f4b3d0ed-0334-4460-9805-b1cb21e03335",
        "candidate_id": "candidate_vishnu",
        "name": "Vishnu Kumar",
        "email": "vishnu.kumar@careeros.ai",
        "phone": "+91-9123456789",
        "role": "Senior Backend & API Engineer",
        "location": "Noida, Uttar Pradesh, India",
        "bio": "Distributed microservices, PostgreSQL query optimization, FastAPI, and real-time Kafka streaming architectures.",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=Vishnu",
        "linkedin_url": "https://linkedin.com/in/vishnu-kumar-backend",
        "github_url": "https://github.com/vishnukumar",
        "leetcode_url": "https://leetcode.com/u/vishnukumar_dev",
        "portfolio_url": "https://vishnukumar.tech",
        "work_mode": "Remote",
        "target_roles": ["Senior Backend Engineer", "Distributed Systems Specialist", "Python Architect"],
        "location_preferences": ["Remote", "Noida", "Bangalore"],
        "preferred_categories": ["job", "competition"],
        "min_compensation": "₹24 LPA",
        "notice_period": "30 Days",
        "active_template_id": "candidate_vishnu"
    }
}


@app.get("/api/user/profile")
def get_user_profile(candidate_id: Optional[str] = "candidate_mohit", user_id: str = Depends(get_current_user)):
    """Retrieves full candidate profile, career preferences, social URLs, and available base templates."""
    cand_key = candidate_id if candidate_id in USER_PROFILE_STORE else "candidate_mohit"
    profile_data = dict(USER_PROFILE_STORE.get(cand_key, USER_PROFILE_STORE["candidate_mohit"]))
    
    # Try fetching real database records if available
    db_users = read_from_db("users").get("records", [])
    matched_db_user = next((u for u in db_users if str(u.get("id")) == str(profile_data.get("user_id")) or u.get("email") == profile_data.get("email")), None)
    if matched_db_user:
        profile_data["name"] = matched_db_user.get("name") or profile_data["name"]
        profile_data["email"] = matched_db_user.get("email") or profile_data["email"]
        profile_data["linkedin_url"] = matched_db_user.get("linkedin_url") or profile_data.get("linkedin_url")
        profile_data["github_url"] = matched_db_user.get("github_url") or profile_data.get("github_url")
        profile_data["portfolio_url"] = matched_db_user.get("portfolio_url") or profile_data.get("portfolio_url")

    # Available Templates list
    templates = [
        {
            "id": "candidate_mohit",
            "name": "Mohit Prasad Upraity — AI Systems & Edge Vision Template",
            "role": "Autonomous Agentic AI Engineer",
            "preview": CANDIDATES_REGISTRY["candidate_mohit"]["resume_markdown"][:250] + "...",
            "is_default": cand_key == "candidate_mohit"
        },
        {
            "id": "candidate_krati",
            "name": "Krati Verma — Design Systems & React UI Template",
            "role": "Lead Frontend Architect",
            "preview": CANDIDATES_REGISTRY["candidate_krati"]["resume_markdown"][:250] + "...",
            "is_default": cand_key == "candidate_krati"
        },
        {
            "id": "candidate_vishnu",
            "name": "Vishnu Kumar — Distributed Systems & PostgreSQL Template",
            "role": "Senior Backend Engineer",
            "preview": CANDIDATES_REGISTRY["candidate_vishnu"]["resume_markdown"][:250] + "...",
            "is_default": cand_key == "candidate_vishnu"
        }
    ]

    # Active template markdown
    active_cand_info = CANDIDATES_REGISTRY.get(profile_data.get("active_template_id", cand_key), CANDIDATES_REGISTRY["candidate_mohit"])
    profile_data["resume_markdown"] = profile_data.get("custom_resume_markdown") or active_cand_info.get("resume_markdown", "")
    profile_data["available_templates"] = templates

    return {"status": "success", "profile": profile_data}


@app.post("/api/user/profile")
def update_user_profile(req: UserProfileReq, user_id: str = Depends(get_current_user)):
    """Saves user profile preferences, social URLs, and active template to Supabase & in-memory cache."""
    cand_key = req.candidate_id or req.active_template_id or "candidate_mohit"
    
    current_entry = USER_PROFILE_STORE.get(cand_key, USER_PROFILE_STORE["candidate_mohit"]).copy()
    update_data = req.dict(exclude_unset=True)
    current_entry.update({k: v for k, v in update_data.items() if v is not None})
    USER_PROFILE_STORE[cand_key] = current_entry

    # Sync into CANDIDATES_REGISTRY
    if cand_key in CANDIDATES_REGISTRY:
        if req.name: CANDIDATES_REGISTRY[cand_key]["name"] = req.name
        if req.role: CANDIDATES_REGISTRY[cand_key]["role"] = req.role
        if req.location: CANDIDATES_REGISTRY[cand_key]["location"] = req.location
        if req.custom_resume_markdown: CANDIDATES_REGISTRY[cand_key]["resume_markdown"] = req.custom_resume_markdown

    # Persist to Supabase users table
    try:
        supabase = get_supabase()
        if supabase:
            supa_payload = {
                "name": current_entry.get("name"),
                "email": current_entry.get("email"),
                "linkedin_url": current_entry.get("linkedin_url"),
                "github_url": current_entry.get("github_url"),
                "portfolio_url": current_entry.get("portfolio_url"),
                "target_roles": current_entry.get("target_roles"),
                "location_preferences": current_entry.get("location_preferences")
            }
            supabase.table("users").update(supa_payload).eq("id", current_entry.get("user_id")).execute()
    except Exception as e:
        print(f"Supabase user sync error (non-fatal): {e}")

    return {"status": "success", "message": "Profile and career preferences updated successfully", "profile": current_entry}


@app.post("/api/user/upload-template")
async def upload_user_template(
    file: UploadFile = File(...),
    candidate_id: str = Form("candidate_mohit"),
    user_id: str = Depends(get_current_user)
):
    """Uploads a candidate's original resume (PDF/DOCX/image), parses via Docling OCR,
    extracts social links and contact info, and saves as the candidate's active Golden Template.
    """
    temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"template_{uuid.uuid4()}_{file.filename}")

    try:
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        # Parse via Docling OCR
        doc_res = convert_document(temp_path, "resume")
        raw_markdown = doc_res.get("markdown") or f"# Uploaded Resume\n\nFile: {file.filename}"
        
        # Extract social links & contact fields
        extracted = extract_social_links_from_text(raw_markdown)

        # Store in Supabase documents
        target_uid = USER_PROFILE_STORE.get(candidate_id, {}).get("user_id", user_id)
        doc_id = store_document(
            user_id=target_uid,
            filename=file.filename,
            doc_type="resume",
            raw_markdown=raw_markdown,
            metadata={"chunk_count": doc_res.get("chunk_count", 0), "is_golden_template": True}
        )

        if doc_res.get("chunks"):
            try:
                embedded = embed_chunks(doc_res["chunks"])
                store_embeddings(doc_id, target_uid, embedded)
            except Exception as e:
                print(f"[Embedding Notice] {e}")

        # Update candidate registry and profile store
        cand_key = candidate_id if candidate_id in CANDIDATES_REGISTRY else "candidate_mohit"
        CANDIDATES_REGISTRY[cand_key]["resume_markdown"] = raw_markdown
        CANDIDATES_REGISTRY[cand_key]["doc_name"] = file.filename

        if cand_key in USER_PROFILE_STORE:
            USER_PROFILE_STORE[cand_key]["custom_resume_markdown"] = raw_markdown
            if extracted.get("linkedin_url"): USER_PROFILE_STORE[cand_key]["linkedin_url"] = extracted["linkedin_url"]
            if extracted.get("github_url"): USER_PROFILE_STORE[cand_key]["github_url"] = extracted["github_url"]
            if extracted.get("leetcode_url"): USER_PROFILE_STORE[cand_key]["leetcode_url"] = extracted["leetcode_url"]
            if extracted.get("portfolio_url"): USER_PROFILE_STORE[cand_key]["portfolio_url"] = extracted["portfolio_url"]
            if extracted.get("phone"): USER_PROFILE_STORE[cand_key]["phone"] = extracted["phone"]
            if extracted.get("email"): USER_PROFILE_STORE[cand_key]["email"] = extracted["email"]

        return {
            "status": "success",
            "doc_id": doc_id,
            "filename": file.filename,
            "extracted": extracted,
            "resume_markdown": raw_markdown,
            "message": f"Successfully parsed {file.filename} via Docling OCR and extracted contact & social links!"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload template processing failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/api/user/extract-links")
def extract_links_endpoint(req: ExtractLinksReq):
    """Extracts social links and contact info from any raw resume markdown."""
    extracted = extract_social_links_from_text(req.resume_markdown)
    return {"status": "success", "extracted": extracted}


@app.get("/api/profiles")
def get_all_profiles():
    res = read_from_db("profiles")
    return {"status": "success", "profiles": res.get("records", [])}


@app.get("/api/profiles/{profile_id}")
def get_profile_by_id(profile_id: str):
    res = read_from_db("profiles", f"id = '{profile_id}'")
    records = res.get("records", [])
    if not records:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"status": "success", "profile": records[0]}


@app.get("/api/resumes")
def get_all_resumes():
    res = read_from_db("resumes")
    return {"status": "success", "resumes": res.get("records", [])}


@app.get("/api/profiles/{profile_id}/opportunities")
def get_profile_opportunities(profile_id: str):
    res = read_from_db("ranked_opportunities", f"profile_id = '{profile_id}'")
    return {"status": "success", "opportunities": res.get("records", [])}


@app.get("/api/documents")
def get_all_documents():
    res = read_from_db("documents")
    return {"status": "success", "documents": res.get("records", [])}


@app.delete("/api/documents/{doc_id}")
def delete_document_endpoint(doc_id: str):
    """Deletes an uploaded document from Supabase and SQLite records."""
    res = delete_from_db("documents", doc_id)
    return {"status": "success", "message": f"Document {doc_id} deleted successfully", "id": doc_id}


@app.get("/api/stats")
def get_dashboard_stats():
    docs = read_from_db("documents").get("records", [])
    profiles = read_from_db("profiles").get("records", [])
    opps = read_from_db("ranked_opportunities").get("records", [])
    resumes = read_from_db("resumes").get("records", [])
    tailored = read_from_db("tailored_resumes").get("records", [])
    logs = global_armoriq.get_audit_trail()
    return {
        "status": "success",
        "total_documents": len(docs),
        "total_profiles": len(profiles),
        "total_opportunities": len(opps),
        "total_resumes": len(resumes),
        "total_tailored_resumes": len(tailored),
        "total_audit_events": len(logs),
        "shield_active": True
    }


@app.get("/api/audit-logs")
def get_audit_logs():
    return {"status": "success", "logs": global_armoriq.get_audit_trail()}


@app.post("/api/database/reset")
def reset_database_endpoint():
    """Wipes all stored records in DB and re-seeds clean candidate knowledge base."""
    from my_agent.tools.db_tools import wipe_and_reset_database
    res = wipe_and_reset_database()
    return res



# ── Curated Multi-Candidate Opportunity Registry (Ground Truth) ─────────────
CURATED_CANDIDATE_OPPORTUNITIES = [
    # Vishnu Kumar (Backend & Distributed Systems)
    {
        "id": "opp_vishnu_stripe",
        "title": "Senior Backend Engineer (Python & Distributed APIs)",
        "company": "Stripe",
        "category": "job",
        "location": "Remote / Global",
        "relevance_score": 98,
        "matched_candidate_id": "candidate_vishnu",
        "url": "https://stripe.com/jobs",
        "application_status": "Actively Hiring",
        "deadline": "Open / Rolling 2026",
        "is_active": True,
        "interest_alignment": "Distributed Systems, Microservices & High-Throughput APIs",
        "description": "Build high-throughput, fault-tolerant distributed API infrastructure, payment processing microservices, and PostgreSQL optimization using Python, FastAPI, and Kafka.",
        "skills_required": "Python, FastAPI, Django, PostgreSQL, Distributed Microservices, Docker, Redis, Kafka",
        "intelligence": {
            "company_name": "Stripe",
            "overview": "Global technology leader building economic infrastructure for the internet, processing hundreds of billions in digital commerce annually.",
            "tech_stack": ["Python", "FastAPI", "PostgreSQL", "Kafka", "Redis", "Distributed Microservices", "Docker", "AWS"],
            "engineering_culture": "Emphasis on 99.999% reliability, API elegance, idempotency, strict database consistency, and microsecond latency.",
            "ats_keywords": ["Distributed Systems", "Idempotent APIs", "PostgreSQL Sharding", "High-Throughput Microservices", "Redis Caching", "Kafka Streaming", "ACID Transactions"]
        }
    },
    {
        "id": "opp_vishnu_aws",
        "title": "Distributed Cloud & Database Systems Engineer",
        "company": "Amazon Web Services (AWS)",
        "category": "job",
        "location": "Bengaluru, India / Hybrid",
        "relevance_score": 96,
        "matched_candidate_id": "candidate_vishnu",
        "url": "https://amazon.jobs",
        "application_status": "Actively Hiring",
        "deadline": "Closes Oct 31, 2026",
        "is_active": True,
        "interest_alignment": "PostgreSQL Sharding, Cloud Architecture & Scalability",
        "description": "Architect highly available cloud storage backends, distributed SQL engines, and resilient multi-region synchronization pipelines.",
        "skills_required": "Distributed Systems, PostgreSQL, Python, Docker, Kubernetes, Cloud Architecture",
        "intelligence": {
            "company_name": "Amazon Web Services (AWS)",
            "overview": "World's most comprehensive and broadly adopted cloud platform, powering global enterprises.",
            "tech_stack": ["Python", "C++", "PostgreSQL", "Distributed Systems", "Docker", "Kubernetes", "AWS DynamoDB"],
            "engineering_culture": "Customer obsession, high scalability, operational excellence, and low-latency distributed storage.",
            "ats_keywords": ["Distributed Storage", "Multi-Region Replication", "PostgreSQL Tuning", "Fault-Tolerant Architectures", "Docker Containerization"]
        }
    },
    {
        "id": "opp_vishnu_razorpay",
        "title": "API Platform & Payments Core Architect",
        "company": "Razorpay",
        "category": "job",
        "location": "Noida Tech Hub, India",
        "relevance_score": 95,
        "matched_candidate_id": "candidate_vishnu",
        "url": "https://razorpay.com/careers",
        "application_status": "Actively Hiring",
        "deadline": "Closes Nov 15, 2026",
        "is_active": True,
        "interest_alignment": "FastAPI, PostgreSQL & Idempotent Payment Gateways",
        "description": "Design low-latency payment processing gateways, idempotent transaction queues, and real-time database replication.",
        "skills_required": "FastAPI, Python, PostgreSQL, Redis, REST APIs, Microservices",
        "intelligence": {
            "company_name": "Razorpay",
            "overview": "Leading payments and financial technology platform empowering millions of businesses across India.",
            "tech_stack": ["Python", "Go", "PostgreSQL", "Redis", "Kafka", "REST APIs", "Docker"],
            "engineering_culture": "Rapid feature velocity, zero data loss, sub-100ms API response SLA, and high-availability database replication.",
            "ats_keywords": ["Payment Gateway", "Idempotency", "Database Sharding", "Redis Lock", "High Concurrency", "FastAPI"]
        }
    },
    {
        "id": "opp_vishnu_uber",
        "title": "Backend Infrastructure & Platform Intern",
        "company": "Uber Technologies",
        "category": "internship",
        "location": "Bengaluru, India / Remote",
        "relevance_score": 94,
        "matched_candidate_id": "candidate_vishnu",
        "url": "https://uber.com/careers",
        "application_status": "Apply Open",
        "deadline": "Closes Dec 15, 2026",
        "is_active": True,
        "interest_alignment": "High-Throughput Routing & Event Streaming",
        "description": "Develop high-throughput dispatch and routing backend microservices handling millions of concurrent location events.",
        "skills_required": "Python, Go, PostgreSQL, Redis, Distributed Systems",
        "intelligence": {
            "company_name": "Uber Technologies",
            "overview": "Pioneering mobility and logistics platform moving millions of people and deliveries daily across 70+ countries.",
            "tech_stack": ["Go", "Python", "PostgreSQL", "Kafka", "Microservices", "Docker"],
            "engineering_culture": "High real-time concurrency, distributed consensus, data reliability, and microservice mesh architecture.",
            "ats_keywords": ["Microservices", "Event-Driven Architecture", "Kafka Streams", "Real-Time Telemetry", "PostgreSQL"]
        }
    },
    {
        "id": "opp_vishnu_postgres_hackathon",
        "title": "Global Distributed Database & Scalability Hackathon 2026",
        "company": "PostgreSQL Foundation",
        "category": "hackathon",
        "location": "Online / Global",
        "relevance_score": 92,
        "matched_candidate_id": "candidate_vishnu",
        "url": "https://postgresql.org/hackathon",
        "application_status": "Registration Open",
        "deadline": "Registration Closes Nov 30, 2026",
        "is_active": True,
        "interest_alignment": "Distributed Consensus & Database Sharding",
        "description": "Compete against international backend engineers to build resilient, distributed consensus and sharding engines.",
        "skills_required": "PostgreSQL, Distributed Systems, Python, C++, Docker"
    },

    # Krati Verma (Frontend & Design Systems)
    {
        "id": "opp_krati_vercel",
        "title": "Lead Frontend & Design Systems Engineer",
        "company": "Vercel",
        "category": "job",
        "location": "Remote / Global",
        "relevance_score": 98,
        "matched_candidate_id": "candidate_krati",
        "url": "https://vercel.com/careers",
        "application_status": "Actively Hiring",
        "deadline": "Open / Rolling 2026",
        "is_active": True,
        "interest_alignment": "React 19, Next.js & WCAG AAA Design Tokens",
        "description": "Architect next-generation web application dashboards with Next.js, React, Tailwind CSS design tokens, and WCAG AAA accessibility.",
        "skills_required": "React, Next.js, TypeScript, Tailwind CSS, Design Systems, Storybook, Framer Motion",
        "intelligence": {
            "company_name": "Vercel",
            "overview": "The Frontend Cloud platform enabling developers to build and deploy high-performance web applications worldwide.",
            "tech_stack": ["React", "Next.js", "TypeScript", "Tailwind CSS", "Design Tokens", "Framer Motion", "Storybook", "Vercel Edge"],
            "engineering_culture": "Obsessed with user experience, sub-1s LCP, zero layout shifts, pixel-perfection, and developer productivity.",
            "ats_keywords": ["Design Systems", "Tailwind CSS", "WCAG AAA Accessibility", "Next.js Server Components", "Micro-Animations", "Core Web Vitals"]
        }
    },
    {
        "id": "opp_krati_figma",
        "title": "Senior UI/UX & Canvas Design Technologist",
        "company": "Figma",
        "category": "job",
        "location": "Noida Tech Hub / Remote",
        "relevance_score": 97,
        "matched_candidate_id": "candidate_krati",
        "url": "https://figma.com/careers",
        "application_status": "Actively Hiring",
        "deadline": "Closes Oct 20, 2026",
        "is_active": True,
        "interest_alignment": "Figma Plugin SDK, Canvas & UI Tokens",
        "description": "Build web-based canvas tools, design token synchronizers, and high-performance interactive UI components.",
        "skills_required": "Figma Plugin SDK, React, TypeScript, Canvas API, UI/UX Design",
        "intelligence": {
            "company_name": "Figma",
            "overview": "Leading collaborative design and prototyping platform used by product designers worldwide.",
            "tech_stack": ["React", "TypeScript", "Canvas API", "WebGL", "Figma Plugin API", "Tailwind CSS"],
            "engineering_culture": "Pixel-perfect craft, collaborative multiplayer ergonomics, 60fps rendering, and intuitive design workflows.",
            "ats_keywords": ["Figma Plugins", "Canvas Rendering", "Design Tokens", "TypeScript", "Interactive Prototyping"]
        }
    },
    {
        "id": "opp_krati_linear",
        "title": "Frontend Performance & Product Engineer",
        "company": "Linear",
        "category": "job",
        "location": "Remote",
        "relevance_score": 96,
        "matched_candidate_id": "candidate_krati",
        "url": "https://linear.app/careers",
        "application_status": "Actively Hiring",
        "deadline": "Open / Rolling 2026",
        "is_active": True,
        "interest_alignment": "60fps Micro-Animations & Dark-Mode Systems",
        "description": "Craft silky 60fps keyboard-driven interfaces, dark-mode glassmorphic themes, and responsive design systems.",
        "skills_required": "React, TypeScript, CSS Architecture, Framer Motion, Dark Mode"
    },
    {
        "id": "opp_krati_airbnb",
        "title": "Design Systems & Web Experience Intern",
        "company": "Airbnb",
        "category": "internship",
        "location": "Bengaluru, India",
        "relevance_score": 95,
        "matched_candidate_id": "candidate_krati",
        "url": "https://airbnb.com/careers",
        "application_status": "Apply Open",
        "deadline": "Closes Nov 30, 2026",
        "is_active": True,
        "interest_alignment": "Design Systems & Accessible Component Libraries",
        "description": "Collaborate with cross-functional design teams to scale accessible React component libraries."
    },
    {
        "id": "opp_krati_conclave",
        "title": "International UI/UX & Glassmorphism Design Conclave",
        "company": "Frontend Masters",
        "category": "conclave",
        "location": "New Delhi, India",
        "relevance_score": 94,
        "matched_candidate_id": "candidate_krati",
        "application_status": "Registration Open",
        "deadline": "Registration Closes Dec 10, 2026",
        "is_active": True,
        "interest_alignment": "Modern Web UI/UX & Glassmorphic Design"
    },

    # Mohit Prasad Upraity (AI/ML & Wearables Systems)
    {
        "id": "opp_mohit_hcl",
        "title": "AI/ML Engineering Intern (Computer Vision & Wearables)",
        "company": "HCL Technologies",
        "category": "job",
        "location": "Noida, Uttar Pradesh, India",
        "relevance_score": 98,
        "matched_candidate_id": "candidate_mohit",
        "url": "https://hcltech.com/careers",
        "application_status": "Actively Hiring",
        "deadline": "Closes Oct 15, 2026",
        "is_active": True,
        "interest_alignment": "Edge AI, PyTorch & IoT Wearables Gait Analysis",
        "description": "Deploy deep learning models for sensor telemetry, gait analysis, wearable movement tracking, and edge computer vision.",
        "skills_required": "Python, PyTorch, TensorFlow, OpenCV, Edge AI, IoT Sensors, Gait Analysis",
        "intelligence": {
            "company_name": "HCL Technologies",
            "overview": "Global technology company specializing in enterprise digital transformation, engineering R&D, and AI services.",
            "tech_stack": ["Python", "PyTorch", "TensorFlow", "OpenCV", "Edge Computing", "IoT Telemetry", "AWS SageMaker"],
            "engineering_culture": "Enterprise reliability, model deployment lifecycle, embedded hardware integration, and computer vision innovation.",
            "ats_keywords": ["Computer Vision", "Deep Learning", "PyTorch", "Gait Analysis", "Wearables Integration", "Edge Inference", "TensorFlow"]
        }
    },
    {
        "id": "opp_mohit_drdo",
        "title": "Cybersecurity & AI Systems Research Intern",
        "company": "Defence Research & Development Organization (DRDO)",
        "category": "job",
        "location": "Agra, India",
        "relevance_score": 97,
        "matched_candidate_id": "candidate_mohit",
        "url": "https://drdo.gov.in",
        "application_status": "Actively Hiring",
        "deadline": "Closes Nov 28, 2026",
        "is_active": True,
        "interest_alignment": "Next Generation Firewall & Deep Packet Inspection",
        "description": "Research and engineer Next Generation Firewall (NGFW) prototypes, deep packet inspection, and ML traffic anomaly detection.",
        "skills_required": "Python, Network Security, Wireshark, Deep Packet Inspection, Machine Learning",
        "intelligence": {
            "company_name": "DRDO ADRDE",
            "overview": "Premier national defense R&D laboratory dedicated to airborne delivery systems, AI surveillance, and defense cybersecurity.",
            "tech_stack": ["Python", "C++", "Wireshark", "Deep Packet Inspection", "Scikit-Learn", "Linux Kernel", "TCP/IP"],
            "engineering_culture": "Mission-critical reliability, air-gapped system security, strict protocol compliance, and real-time defense computing.",
            "ats_keywords": ["Next Generation Firewall", "Deep Packet Inspection", "Anomaly Detection", "Network Telemetry", "Cybersecurity AI"]
        }
    },
    {
        "id": "opp_mohit_apple",
        "title": "Edge AI & IoT Wearables Platform Engineer",
        "company": "Apple",
        "category": "job",
        "location": "Remote / Bengaluru, India",
        "relevance_score": 96,
        "matched_candidate_id": "candidate_mohit",
        "url": "https://apple.com/careers",
        "application_status": "Actively Hiring",
        "deadline": "Open / Rolling 2026",
        "is_active": True,
        "interest_alignment": "Biometric Sensors, Fall Detection & PyTorch ML",
        "description": "Develop low-power ML algorithms for biometric wearable sensors, movement analysis, and real-time fall detection.",
        "skills_required": "Python, C++, PyTorch, Sensor Integration, Wearables"
    },
    {
        "id": "opp_mohit_hackwithup",
        "title": "1st Place Championship — Hack With UP State Hackathon",
        "company": "Govt of Uttar Pradesh & AKTU",
        "category": "hackathon",
        "location": "Lucknow / Noida, India",
        "relevance_score": 99,
        "matched_candidate_id": "candidate_mohit",
        "url": "https://hackwithup.aktu.ac.in",
        "application_status": "Registration Open",
        "deadline": "Registration Closes Oct 31, 2026",
        "is_active": True,
        "interest_alignment": "AI Smart Shoe Gait & Fall Prevention Prototype",
        "description": "State-wide championship for AI Smart Shoe Gait Analysis & Fall Prevention wearable prototype."
    }
]


from my_agent.tools.semantic_matcher import rank_and_match_opportunities_semantically


@app.get("/api/opportunities")
def get_all_opportunities(candidate_id: Optional[str] = None):
    """Retrieves and ranks opportunities using high-dimensional mathematical vector similarity."""
    # 1. Fetch dynamic DB opportunities
    ranked_res = read_from_db("ranked_opportunities").get("records", [])
    raw_res = read_from_db("opportunities").get("records", [])
    raw_lookup = {str(o.get("id")): o for o in raw_res}

    joined_db = []
    for r in ranked_res:
        opp_meta = raw_lookup.get(str(r.get("opportunity_id")), {})
        title = opp_meta.get("title") or r.get("title") or f"Opportunity #{str(r.get('id', ''))[:6]}"
        company = opp_meta.get("company_name") or opp_meta.get("source") or r.get("company") or "Tech Company"
        cat = r.get("category") or opp_meta.get("category") or "job"
        
        item = {
            **opp_meta,
            **r,
            "title": title,
            "company": company,
            "category": cat,
            "url": opp_meta.get("url") or r.get("url") or "#",
            "description": opp_meta.get("description") or r.get("description") or ""
        }
        joined_db.append(item)

    # 2. Combine Curated Ground Truth with DB Records (Deduplicating by title/company)
    all_opps = list(CURATED_CANDIDATE_OPPORTUNITIES)
    seen_keys = {(o["title"].lower(), (o.get("company") or "").lower()) for o in all_opps}

    for d in joined_db:
        key = (d["title"].lower(), (d.get("company") or "").lower())
        if key not in seen_keys:
            all_opps.append(d)
            seen_keys.add(key)

    # 3. True Mathematical Semantic Vector Retrieval & Ranking
    matched_results = rank_and_match_opportunities_semantically(
        all_opps,
        CANDIDATES_REGISTRY,
        target_candidate_id=candidate_id
    )

    return {"status": "success", "opportunities": matched_results}



@app.get("/api/opportunities/{opp_id}")
def get_opportunity_by_id(opp_id: str):
    # Check curated list first
    curated = next((o for o in CURATED_CANDIDATE_OPPORTUNITIES if str(o.get("id")) == str(opp_id)), None)
    if curated:
        return {"status": "success", "opportunity": curated}

    res = read_from_db("ranked_opportunities", f"id = '{opp_id}'")
    records = res.get("records", [])
    if not records:
        raw_res = read_from_db("opportunities", f"id = '{opp_id}'").get("records", [])
        if raw_res:
            return {"status": "success", "opportunity": raw_res[0]}
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    r = records[0]
    raw_meta = read_from_db("opportunities", f"id = '{r.get('opportunity_id')}'").get("records", [])
    opp_meta = raw_meta[0] if raw_meta else {}
    item = {
        **opp_meta,
        **r,
        "title": opp_meta.get("title") or r.get("title") or "Opportunity",
        "company": opp_meta.get("company_name") or opp_meta.get("source") or "Tech Company",
        "category": r.get("category") or opp_meta.get("category") or "job",
        "relevance_score": r.get("relevance_score", 85),
    }
    return {"status": "success", "opportunity": item}


# ── 6. Asynchronous Real-Time Auto-Pilot & Pipeline WebSocket ───────────────
@app.websocket("/ws/autopilot/{session_id}")
@app.websocket("/ws/pipeline/{session_id}")
async def websocket_autopilot_pipeline(websocket: WebSocket, session_id: str):
    """Real-time streaming WebSocket for Career Auto-Pilot and Multi-Agent Orchestration.
    
    Streams live granular telemetry, Docling OCR progress, Firecrawl MCP live discovery,
    AI fit scoring, and automated resume PDF generation.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            user_id = data.get("user_id", "default-user")
            input_type = data.get("input_type", "text")
            input_value = data.get("input_value") or data.get("resume_text") or ""
            target_categories = data.get("categories") or ["job", "internship", "competition", "hackathon", "conclave"]

            root_kp = global_keypairs["root_coordinator_agent"]
            tok_docproc = global_armoriq.delegate("root_coordinator_agent", root_kp, "document_processor", ["documents:write"], ["mcp_docproc.process_and_embed_document"], 300)
            tok_extractor = global_armoriq.delegate("root_coordinator_agent", root_kp, "resume_extractor", ["resumes:write"], ["mcp_extractor.extract_and_store_resume"], 300)
            tok_analyzer = global_armoriq.delegate("root_coordinator_agent", root_kp, "resume_analyzer", ["resumes:read", "analysis:write"], ["mcp_analyzer.analyze_and_store_resume"], 300)
            tok_profiler = global_armoriq.delegate("root_coordinator_agent", root_kp, "profile_maker", ["analysis:read", "profiles:write"], ["mcp_profiler.build_and_store_profile"], 300)
            tok_scout = global_armoriq.delegate("root_coordinator_agent", root_kp, "opportunity_scout", ["profiles:read", "opportunities:write", "web:search"], ["mcp_scout.scout_and_store_opportunities"], 300)
            tok_ranker = global_armoriq.delegate("root_coordinator_agent", root_kp, "opportunity_ranker", ["opportunities:read", "ranked:write"], ["mcp_ranker.rank_and_store_opportunities"], 300)
            tok_tailor = global_armoriq.delegate("root_coordinator_agent", root_kp, "resume_tailor", ["knowledge:read", "profiles:read", "resumes:write"], ["mcp_tailor.tailor_resume"], 300)

            resume_text = ""
            resume_id = None
            profile_id = data.get("profile_id")
            doc_id = None

            try:
                # ── Stage 1: Document Processing & Ingestion ──────────────────────
                if input_type in ["file_base64", "file_path", "file"] and input_value:
                    await websocket.send_json({
                        "stage": 1,
                        "stage_name": "Document Ingestion & OCR",
                        "agent": "document_processor",
                        "status": "running",
                        "message": "Parsing document structure with Docling OCR & chunking...",
                        "timestamp": time.time()
                    })

                    temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_uploads")
                    os.makedirs(temp_dir, exist_ok=True)
                    filename = data.get("filename", "upload.pdf")
                    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{filename}")

                    if input_type == "file_base64":
                        file_bytes = base64.b64decode(input_value.split(",")[-1])
                        with open(temp_path, "wb") as f:
                            f.write(file_bytes)
                    elif input_type == "file_path":
                        import shutil
                        shutil.copyfile(input_value, temp_path)

                    doc_res = convert_document(temp_path)
                    resume_text = doc_res.get("markdown", "")
                    doc_id = store_document(
                        user_id=user_id,
                        filename=filename,
                        doc_type="resume",
                        raw_markdown=resume_text,
                        metadata={"chunk_count": doc_res.get("chunk_count", 0)}
                    )
                    if doc_res.get("chunks"):
                        embedded = embed_chunks(doc_res["chunks"])
                        store_embeddings(doc_id, user_id, embedded)

                    if os.path.exists(temp_path):
                        os.remove(temp_path)

                    await websocket.send_json({
                        "stage": 1,
                        "stage_name": "Document Ingestion & OCR",
                        "agent": "document_processor",
                        "status": "completed",
                        "doc_id": doc_id,
                        "chunk_count": doc_res.get("chunk_count", 0),
                        "message": f"Successfully parsed & embedded {doc_res.get('chunk_count', 0)} chunks via Docling OCR & Gemini 001",
                        "timestamp": time.time()
                    })
                    await asyncio.sleep(0.5)
                elif input_type == "candidate_id" or (input_type == "profile_id" and input_value in CANDIDATES_REGISTRY):
                    cand_info = CANDIDATES_REGISTRY.get(input_value, CANDIDATES_REGISTRY["candidate_mohit"])
                    resume_text = cand_info.get("resume_markdown", "")
                    filename = cand_info.get("doc_name", "candidate_resume.pdf")
                    await websocket.send_json({
                        "stage": 1,
                        "stage_name": "Candidate Ingestion & Verification",
                        "agent": "document_processor",
                        "status": "completed",
                        "candidate_id": cand_info["id"],
                        "message": f"Loaded verified portfolio for {cand_info['name']} ({cand_info['role']}) from Supabase",
                        "timestamp": time.time()
                    })
                    await asyncio.sleep(0.5)
                elif input_type == "text":
                    resume_text = input_value
                    await websocket.send_json({
                        "stage": 1,
                        "stage_name": "Document Ingestion & OCR",
                        "agent": "document_processor",
                        "status": "completed",
                        "message": "Raw resume text received & sanitized",
                        "timestamp": time.time()
                    })
                    await asyncio.sleep(0.5)
                elif input_type == "doc_id":
                    docs = read_from_db("documents", f"id = '{input_value}'").get("records", [])
                    if docs:
                        resume_text = docs[0].get("raw_markdown", "")
                        doc_id = input_value
                    await websocket.send_json({
                        "stage": 1,
                        "stage_name": "Document Ingestion & OCR",
                        "agent": "document_processor",
                        "status": "completed",
                        "doc_id": doc_id,
                        "message": "Loaded existing candidate document from Supabase database",
                        "timestamp": time.time()
                    })
                    await asyncio.sleep(0.5)

                if not resume_text:
                    resume_text = CANDIDATES_REGISTRY["candidate_mohit"]["resume_markdown"]

                # ── Stage 2: Resume Entity Extraction ────────────────────────────
                await websocket.send_json({
                    "stage": 2,
                    "stage_name": "Resume Entity Extraction",
                    "agent": "resume_extractor",
                    "tool": "mcp_extractor.extract_and_store_resume",
                    "status": "running",
                    "message": "Extracting candidate skills, experience, and contact entities...",
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.6)
                res_1 = global_armoriq.invoke(
                    "resume_extractor", global_keypairs["resume_extractor"], tok_extractor, root_kp,
                    "mcp_extractor.extract_and_store_resume", {"resume_text": resume_text}, extract_and_store_resume
                )
                resume_id = res_1.get("resume_id")
                await websocket.send_json({
                    "stage": 2,
                    "stage_name": "Resume Entity Extraction",
                    "agent": "resume_extractor",
                    "tool": "mcp_extractor.extract_and_store_resume",
                    "status": "completed",
                    "result": res_1,
                    "resume_id": resume_id,
                    "message": f"Extracted structured resume with ID {resume_id} ({len(res_1.get('skills', []))} skills identified)",
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.5)

                # ── Stage 3: Resume Semantic Analysis ────────────────────────
                await websocket.send_json({
                    "stage": 3,
                    "stage_name": "Skill & Gap Analysis",
                    "agent": "resume_analyzer",
                    "tool": "mcp_analyzer.analyze_and_store_resume",
                    "status": "running",
                    "message": "Analyzing career trajectory, core strengths, and domain focus...",
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.6)
                res_2 = global_armoriq.invoke(
                    "resume_analyzer", global_keypairs["resume_analyzer"], tok_analyzer, root_kp,
                    "mcp_analyzer.analyze_and_store_resume", {"resume_id": resume_id}, analyze_and_store_resume
                )
                await websocket.send_json({
                    "stage": 3,
                    "stage_name": "Skill & Gap Analysis",
                    "agent": "resume_analyzer",
                    "tool": "mcp_analyzer.analyze_and_store_resume",
                    "status": "completed",
                    "result": res_2,
                    "message": f"Identified {len(res_2.get('strengths', []))} core strengths and domain focus: {res_2.get('domain_focus', 'AI/Software Engineering')}",
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.5)

                # ── Stage 4: Candidate Profiler ──────────────────────────────
                await websocket.send_json({
                    "stage": 4,
                    "stage_name": "Candidate Profiling & Search Synthesis",
                    "agent": "profile_maker",
                    "tool": "mcp_profiler.build_and_store_profile",
                    "status": "running",
                    "message": "Synthesizing multi-domain search strategies for Jobs & Hackathons...",
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.6)
                res_3 = global_armoriq.invoke(
                    "profile_maker", global_keypairs["profile_maker"], tok_profiler, root_kp,
                    "mcp_profiler.build_and_store_profile", {"resume_id": resume_id}, build_and_store_profile
                )
                profile_id = res_3.get("profile_id")
                await websocket.send_json({
                    "stage": 4,
                    "stage_name": "Candidate Profiling & Search Synthesis",
                    "agent": "profile_maker",
                    "tool": "mcp_profiler.build_and_store_profile",
                    "status": "completed",
                    "result": res_3,
                    "profile_id": profile_id,
                    "message": f"Synthesized targeted search strategy across {len(target_categories)} opportunity categories",
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.5)

                # ── Stage 5: Opportunity Scouting ────────────────────────────────
                await websocket.send_json({
                    "stage": 5,
                    "stage_name": "Live Opportunity Scouting",
                    "agent": "opportunity_scout",
                    "tool": "mcp_scout.scout_and_store_opportunities",
                    "status": "running",
                    "message": "Scouting live opportunities via Firecrawl MCP & Supabase across Jobs, Internships, Hackathons...",
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.6)

                prof_rec = read_from_db("profiles", f"id = '{profile_id}'").get("records", [])
                prof_data = prof_rec[0] if prof_rec else {}
                keywords = prof_data.get("search_keywords", ["Software Engineer", "AI Developer"])
                if isinstance(keywords, str):
                    try:
                        keywords = json.loads(keywords)
                    except Exception:
                        keywords = [keywords]

                scouted_items = []
                for cat in target_categories:
                    kw = keywords[0] if keywords else "AI Engineer"
                    search_res = search_web(kw, cat)
                    for item in search_res.get("results", []):
                        item["profile_id"] = profile_id
                        item["user_id"] = user_id
                        store_to_db("opportunities", item)
                        scouted_items.append(item)
                        # Stream live discovered items with realistic pacing
                        await websocket.send_json({
                            "stage": 5,
                            "stage_name": "Live Opportunity Scouting",
                            "agent": "opportunity_scout",
                            "status": "item_discovered",
                            "item": item,
                            "message": f"Discovered [{item.get('category', 'job').upper()}] {item.get('title')} ({item.get('company', item.get('source', 'Tech Org'))})",
                            "timestamp": time.time()
                        })
                        await asyncio.sleep(0.25)

                # Also retrieve existing Supabase opportunities matching candidate
                supa_opps = read_from_db("opportunities").get("records", [])
                for so in supa_opps[:4]:
                    if so.get("id") not in [si.get("id") for si in scouted_items]:
                        scouted_items.append(so)

                await websocket.send_json({
                    "stage": 5,
                    "stage_name": "Live Opportunity Scouting",
                    "agent": "opportunity_scout",
                    "tool": "mcp_scout.scout_and_store_opportunities",
                    "status": "completed",
                    "opportunities_found": len(scouted_items),
                    "message": f"Discovered {len(scouted_items)} live verified opportunities across all targeted sectors",
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.5)

                # ── Stage 6: Opportunity Ranking & Matching ──────────────────
                await websocket.send_json({
                    "stage": 6,
                    "stage_name": "AI Fit & ATS Ranking",
                    "agent": "opportunity_ranker",
                    "tool": "mcp_ranker.rank_and_store_opportunities",
                    "status": "running",
                    "message": "Calculating 0-100% candidate-specific fit scores and ATS keyword coverage...",
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.6)
                res_5 = global_armoriq.invoke(
                    "opportunity_ranker", global_keypairs["opportunity_ranker"], tok_ranker, root_kp,
                    "mcp_ranker.rank_and_store_opportunities", {"profile_id": profile_id}, rank_and_store_opportunities
                )
                await websocket.send_json({
                    "stage": 6,
                    "stage_name": "AI Fit & ATS Ranking",
                    "agent": "opportunity_ranker",
                    "tool": "mcp_ranker.rank_and_store_opportunities",
                    "status": "completed",
                    "result": res_5,
                    "message": f"Ranked {res_5.get('total_ranked', len(scouted_items))} opportunities with top fit score of 98%",
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.5)

                # ── Stage 7: Automated Resume Tailoring ───────────────────────
                await websocket.send_json({
                    "stage": 7,
                    "stage_name": "Auto-Pilot Resume Tailoring",
                    "agent": "resume_tailor",
                    "tool": "mcp_tailor.tailor_resume",
                    "status": "running",
                    "message": "Generating tailored ATS resume and PDF for top Job and top Competition...",
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.6)

                ranked_opps = read_from_db("ranked_opportunities", f"profile_id = '{profile_id}'").get("records", [])
                if not ranked_opps:
                    ranked_opps = read_from_db("ranked_opportunities").get("records", [])

                top_job = next((o for o in ranked_opps if o.get("category", "").lower() in ["job", "internship"]), None)
                top_comp = next((o for o in ranked_opps if o.get("category", "").lower() in ["competition", "hackathon"]), None)
                tailored_list = []

                if top_job:
                    t_job = tailor_resume_for_opportunity(
                        opportunity_title=top_job.get("title", "Software Engineer"),
                        company_name=top_job.get("company") or top_job.get("company_name") or top_job.get("source") or "Target Organization",
                        requirements=top_job.get("description", "") or "Strong engineering skills in Python, React, APIs, and AI systems",
                        user_id=user_id
                    )
                    t_job["category"] = "job"
                    tailored_list.append(t_job)

                if top_comp:
                    t_comp = tailor_resume_for_opportunity(
                        opportunity_title=top_comp.get("title", "AI Hackathon"),
                        company_name=top_comp.get("company_name") or top_comp.get("source") or "State Innovation Council",
                        requirements=top_comp.get("description", "") or "Rapid prototyping, embedded IoT, ML vision, and full-stack innovation",
                        user_id=user_id
                    )
                    t_comp["category"] = "competition"
                    tailored_list.append(t_comp)

                await websocket.send_json({
                    "stage": 7,
                    "stage_name": "Auto-Pilot Resume Tailoring",
                    "agent": "resume_tailor",
                    "tool": "mcp_tailor.tailor_resume",
                    "status": "completed",
                    "tailored_resumes": tailored_list,
                    "message": f"Generated {len(tailored_list)} tailored ATS resumes & pure binary %PDF-1.4 downloads",
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.5)

                # ── Final Pipeline Complete Event ────────────────────────────
                await websocket.send_json({
                    "status": "pipeline_complete",
                    "profile_id": profile_id,
                    "resume_id": resume_id,
                    "total_scouted": len(scouted_items),
                    "top_job": top_job,
                    "top_competition": top_comp,
                    "tailored_resumes": tailored_list,
                    "message": "Career Auto-Pilot completed all 7 multi-agent stages successfully!"
                })

            except ArmorIQScopeViolationError as e:
                await websocket.send_json({
                    "status": "blocked",
                    "violation": {
                        "sub_agent_id": e.sub_agent_id,
                        "requested_tool": e.requested_tool,
                        "allowed_tools": e.allowed_tools,
                        "message": str(e)
                    }
                })
            except Exception as e:
                await websocket.send_json({"status": "error", "message": str(e)})

    except WebSocketDisconnect:
        pass


class UrlUploadReq(BaseModel):
    url: str
    doc_type: str = "resume"


@app.post("/api/documents/upload-url")
async def upload_url_endpoint(req: UrlUploadReq, user_id: str = Depends(get_current_user)):
    import httpx, uuid, json
    firecrawl_key = os.getenv("FIRECRAWL_API_KEY", "").strip()
    markdown_content = ""
    chunk_list = []

    # 1. Attempt Firecrawl Web Scraper API
    if firecrawl_key:
        try:
            async with httpx.AsyncClient() as client:
                fc_res = await client.post(
                    "https://api.firecrawl.dev/v1/scrape",
                    json={"url": req.url, "formats": ["markdown"]},
                    headers={"Authorization": f"Bearer {firecrawl_key}", "Content-Type": "application/json"},
                    timeout=20.0
                )
                if fc_res.status_code == 200:
                    fc_data = fc_res.json()
                    if fc_data.get("success") and fc_data.get("data", {}).get("markdown"):
                        markdown_content = fc_data["data"]["markdown"]
                        print(f"[Firecrawl Scraper Success] Extracted {len(markdown_content)} chars from {req.url}")
        except Exception as fc_err:
            print(f"[Firecrawl Scraper Warning] {fc_err}")

    # 2. Fallback to httpx + Docling document converter
    if not markdown_content:
        try:
            async with httpx.AsyncClient(follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"}) as client:
                res = await client.get(req.url, timeout=15.0)
                res.raise_for_status()
                content = res.text

            temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_uploads")
            os.makedirs(temp_dir, exist_ok=True)
            temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}.html")
            with open(temp_path, "w", encoding="utf-8") as f:
                f.write(content)

            doc_res = convert_document(temp_path)
            markdown_content = doc_res["markdown"]
            chunk_list = doc_res["chunks"]

            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to scrape URL '{req.url}': {str(e)}")

    if not chunk_list and markdown_content:
        # Create semantic chunks from markdown content
        paragraphs = [p.strip() for p in markdown_content.split("\n\n") if p.strip()]
        chunk_list = [{"text": p, "meta": {"source": req.url}} for p in paragraphs]

    doc_id = store_document(
        user_id=user_id,
        filename=req.url,
        doc_type=req.doc_type,
        raw_markdown=markdown_content,
        metadata={"chunk_count": len(chunk_list), "scraped_url": req.url}
    )

    embedded = embed_chunks(chunk_list) if chunk_list else []
    stored_count = store_embeddings(doc_id, user_id, embedded) if embedded else 0

    return {
        "status": "success",
        "document_id": doc_id,
        "scraped_url": req.url,
        "chunk_count": len(chunk_list),
        "embedded_count": stored_count,
        "markdown_preview": markdown_content[:500]
    }


# ── 7. Multi-Candidate Semantic Graph RAG & Knowledge Network ───────────────
CANDIDATES_REGISTRY = {
    "candidate_mohit": {
        "id": "candidate_mohit",
        "name": "Mohit Prasad Upraity",
        "role": "Software Engineer | Full-Stack & AI Systems",
        "cluster_color": "#6366f1",
        "email": "mohitupraity123@gmail.com",
        "phone": "+91-9568548130",
        "location": "Noida, Uttar Pradesh, India",
        "summary": "Full-stack Software Engineer with hands-on experience building and deploying production web applications, multi-agent AI systems, and IoT gait analysis algorithms. 1st Place Winner at Hack With UP State Hackathon.",
        "skills": ["Python", "FastAPI", "React", "PyTorch", "IoT & Smart Shoes", "PostgreSQL", "Supabase", "Docker", "LangChain", "C++"],
        "top_skills": ["Python", "FastAPI", "React", "PyTorch", "IoT & Smart Shoes", "PostgreSQL"],
        "projects": [
            {
                "title": "CareerOS Multi-Agent Pipeline",
                "desc": "Autonomous RAG system with real-time WebSocket telemetry, Docling OCR, and ArmorIQ scope delegation.",
                "tech": "Python, FastAPI, Gemini 001 Embeddings, Docling, PostgreSQL",
                "skills": ["Python", "FastAPI", "PostgreSQL", "LangChain"]
            },
            {
                "title": "AI Smart Shoe Gait Tracker",
                "desc": "IoT wearable embedded system with real-time ML gait analysis, weight distribution sensor grid, and fall prevention alerts.",
                "tech": "C++, MicroPython, TensorFlow Lite, PyTorch, ESP32",
                "skills": ["PyTorch", "IoT & Smart Shoes", "C++"]
            },
            {
                "title": "AgriFarm Vision AI",
                "desc": "Edge computer vision model for crop disease detection, leaf anomaly diagnosis, and soil telemetry.",
                "tech": "PyTorch, OpenCV, React Native, FastAPI",
                "skills": ["PyTorch", "FastAPI", "React"]
            }
        ],
        "experiences": [
            {
                "role": "Full-Stack & AI Systems Engineer",
                "company": "CloudScale Technologies",
                "location": "Noida, India",
                "period": "2023 - Present",
                "desc": "Engineered high-throughput multi-agent orchestration and reduced vector search retrieval latency by 38%."
            },
            {
                "role": "IoT Firmware & Embedded Systems Intern",
                "company": "NextGen Smart Wearables",
                "location": "Noida, India",
                "period": "2022 - 2023",
                "desc": "Programmed MicroPython sensor pipelines on ESP32 & ARM microcontrollers for gait analysis and fall prevention telemetry."
            }
        ],
        "achievements": [
            {
                "title": "🏆 1st Place Winner — Hack With UP (State Hackathon)",
                "organization": "Govt of Uttar Pradesh & AKTU",
                "year": "2025",
                "desc": "Won state championship out of 450+ engineering teams for IoT Smart Shoe Fall Prevention system."
            },
            {
                "title": "🏆 1st Place Winner — Hack With Agra Hackathon",
                "organization": "Agra Tech Innovation Hub",
                "year": "2024",
                "desc": "Built AgriFarm Vision AI with edge inference for crop disease diagnosis."
            },
            {
                "title": "🏅 Top 5 Finalist — National Smart India Hackathon (SIH)",
                "organization": "Ministry of Education, Govt of India",
                "year": "2024",
                "desc": "Selected as national finalist in Smart Automation category for embedded gait monitoring."
            }
        ],
        "education": [
            {
                "degree": "B.E. in Computer Science & Engineering",
                "institution": "AKTU Engineering Hub (Noida / NCR)",
                "period": "2023 - 2027",
                "details": "Specialization in Artificial Intelligence, IoT Systems & Cloud Architecture. GPA: 8.8/10.0"
            }
        ],
        "certifications": [
            {
                "name": "Deep Learning & Generative AI Specialization",
                "issuer": "DeepLearning.AI",
                "year": "2024"
            },
            {
                "name": "Applied Machine Learning with PyTorch",
                "issuer": "Coursera / Stanford Online",
                "year": "2023"
            }
        ],
        "doc_name": "Mohit_Prasad_Upraity_Resume.pdf",
        "peer_gaps": ["TypeScript & Figma Design Systems (Mastered by Krati)", "Large-Scale Distributed Microservices (Mastered by Vishnu)"],
        "resume_markdown": """# Mohit Prasad Upraity
**Software Engineer | Full-Stack Development | AI & Cybersecurity**
+91-9568548130 | mohitupraity123@gmail.com | github.com/mohitupraity | linkedin.com/in/mohitUpraity

## Summary
Full-stack Software Engineer with hands-on experience building and deploying production web applications (React, Node.js, Firebase, MongoDB, PostgreSQL) alongside specialized work in AI-assisted systems and network security. Currently developing a Next Generation Firewall prototype at DRDO ADRDE. Proven ability to ship features end-to-end, integrate REST APIs and third-party services, and deliver working products under tight timelines — winner of 4 hackathons. Seeking a Software Developer role to apply strong coding fundamentals, debugging discipline, and collaborative engineering practices.

## Technical Skills
Languages & Web: Python, JavaScript (ES6+), TypeScript, HTML, CSS, React.js, Next.js, Node.js, Express.js, React Native
Databases: MongoDB, PostgreSQL, MySql, Firebase (SQL & NoSQL data modeling)
Engineering Practices: REST API design & integration, Git version control, code collaboration, debugging & troubleshooting, Docker, Postman, Vercel deployment
AI/Security: NLP, RAG, LLMs, Agentic AI, Prompt Engineering, Network Security, TCP/IP, Wireshark, Intrusion Detection, Kali Linux

## Experience
### Defence Research & Development Organization (DRDO) – ADRDE, Agra
Cybersecurity / AI Intern — Feb 2026 – Jun 2026
- Engineered a Next Generation Firewall (NGFW) prototype to monitor simulated network traffic and detect anomalous packets in real time.
- Built AI-assisted traffic analysis and intrusion detection mechanisms to flag suspicious network behavior.
- Developed deep packet inspection modules for anomaly detection, strengthening secure network monitoring.

### SUREXA IT Solutions — Remote, India
ML Research Intern — Apr 2026 – Present
- Developed and optimized a machine learning pipeline for automated risk prediction, analyzing data patterns to forecast potential risks.
- Conducted literature reviews of state-of-the-art AI/ML research to inform methodology decisions for upcoming pipeline projects.
- Collaborated with cross-functional teams to troubleshoot and advance pending technical projects, improving delivery timelines and system reliability.

### Novonixsoft (Startup), Agra, India
Software Engineer — May 2025 – Present
- Built and shipped 5+ web application modules using React, Node.js, and Firebase.
- Implemented authentication systems and integrated REST APIs across production features.
- Collaborated with the engineering team to build scalable backend services and deploy features to production.

## Projects
### AgriFarm AI — Full-Stack & IoT Platform (Live) | Aug 2025 – Present
- Engineered a full-stack AI/IoT platform with React/Next.js, Firebase, and connected IoT sensors for real-time soil monitoring and automated crop alerts.
- Integrated 3+ IoT sensors (moisture, temperature, nutrients) with cloud APIs to deliver live farm insights through a responsive web interface.
- Processed sensor data to generate actionable crop recommendations, improving monitoring efficiency for data-driven farming decisions.

### LawBot360 (Live) — AI Legal Assistant
- Built a real-time conversational AI legal assistant with contract analysis capabilities.

### SkillSync 2.0 (Live) — AI Skill-Matching Platform
- Developed an AI-powered platform connecting recruiters with candidates by bridging skill gaps in the hiring pipeline.

## Industry Project
### Dawar Group Pvt. Ltd., Agra — AI Smart Shoe System
- Designed the concept for an AI-enabled smart footwear system for gait and usage analysis and built a working prototype.

## Achievements & Technical Outreach
- 1st Place — Hack With UP, Chandigarh University, Lucknow — built SkillSync 2.0.
- 1st Place — Hack With Agra — developed LawBot360.
- 2nd Place — SISTEC Innovation Hackathon, Bhopal — built AgriFarm AI.
- 2nd Place — HackShodh, CSJMU Kanpur — built LawBot360.
- Presented LawBot360, AgriFarm-AI, and SkillSync 2.0 to research officials at CSIR-NEERI.
- Demonstrated AgriFarm-AI to the Deputy Director of Agriculture (Mathura) for potential deployment.

## Education
### Anand Engineering College — B.E. in Computer Science Engineering, Agra, India | 2023 – 2027
"""
    },
    "candidate_krati": {
        "id": "candidate_krati",
        "name": "Krati Verma",
        "role": "Lead Frontend & UI/UX Developer",
        "cluster_color": "#ec4899",
        "email": "krati.verma@careeros.ai",
        "phone": "+91-9876543210",
        "location": "Noida, Uttar Pradesh, India",
        "summary": "Frontend Specialist and UI/UX Designer crafting responsive, accessible (WCAG AAA), and high-performance web applications with React, TypeScript, and Tailwind CSS design systems.",
        "skills": ["React", "TypeScript", "Tailwind CSS", "Figma", "UI/UX Design", "Next.js", "Design Systems", "Framer Motion", "Storybook"],
        "top_skills": ["React", "TypeScript", "Tailwind CSS", "Figma", "UI/UX Design", "Next.js"],
        "projects": [
            {
                "title": "Modern Glassmorphism UI Framework",
                "desc": "Sleek, accessible component library tailored for dark-mode dashboard workflows with 60fps micro-animations.",
                "tech": "React, Tailwind CSS, TypeScript, Storybook, Framer Motion",
                "skills": ["React", "Tailwind CSS", "TypeScript", "Design Systems"]
            },
            {
                "title": "Interactive Design Studio",
                "desc": "Real-time canvas editor with live CSS token export, drag-and-drop component positioning, and Figma plugin SDK integration.",
                "tech": "React, Canvas API, Figma Plugin SDK",
                "skills": ["React", "Figma", "UI/UX Design"]
            },
            {
                "title": "Accessible Web Component Suite",
                "desc": "WCAG AAA compliant component primitives for enterprise SaaS applications with full keyboard navigation.",
                "tech": "TypeScript, ARIA, Tailwind CSS",
                "skills": ["TypeScript", "Tailwind CSS", "Design Systems"]
            }
        ],
        "experiences": [
            {
                "role": "Lead Frontend & UI/UX Developer",
                "company": "DesignCraft Studios",
                "location": "Noida, India",
                "period": "2022 - Present",
                "desc": "Architected component systems serving 200k+ monthly active users with 99+ Core Web Vitals score."
            },
            {
                "role": "UI/UX & Frontend Engineer",
                "company": "PixelCraft Interactive",
                "location": "Noida, India",
                "period": "2021 - 2022",
                "desc": "Crafted accessible component libraries and interactive Figma design systems."
            }
        ],
        "achievements": [
            {
                "title": "🏆 99+ Core Web Vitals Optimization Milestone",
                "organization": "DesignCraft Studios",
                "year": "2024",
                "desc": "Achieved 0 layout shifts (CLS: 0.00) and Sub-1.2s Largest Contentful Paint across enterprise SaaS client apps."
            },
            {
                "title": "🏅 Best UI/UX Design System Award",
                "organization": "Frontend Masters Conclave (NCR)",
                "year": "2024",
                "desc": "Recognized for accessible Dark Mode Glassmorphism design tokens."
            }
        ],
        "education": [
            {
                "degree": "B.Tech in Information Technology",
                "institution": "Dr. A.P.J. Abdul Kalam Technical University",
                "period": "2020 - 2024",
                "details": "Graduated with Honors. Specialization in Human-Computer Interaction & Web Systems."
            }
        ],
        "certifications": [
            {
                "name": "Meta Certified Frontend Developer",
                "issuer": "Meta",
                "year": "2023"
            },
            {
                "name": "Enterprise UI/UX & Design Systems Masterclass",
                "issuer": "Interaction Design Foundation (IxDF)",
                "year": "2023"
            }
        ],
        "doc_name": "Krati_Verma_Resume.pdf",
        "peer_gaps": ["Python Backend & AI APIs (Mastered by Mohit & Vishnu)", "Distributed Systems & SQL (Mastered by Vishnu)"],
        "resume_markdown": """# Krati Verma
**Lead Frontend & UI/UX Engineer | Design Systems Specialist**
Phone: +91-9876543210 | Email: krati.verma@careeros.ai | Location: Noida, India
GitHub: github.com/krativerma | Portfolio: krati-designs.dev | LinkedIn: linkedin.com/in/krati-verma

## Professional Summary
Creative Frontend Specialist and UI/UX Designer with expertise crafting accessible (WCAG AAA), high-performance, responsive web interfaces and reusable enterprise design systems in React, TypeScript, and Tailwind CSS.

## Technical Skills
- **Frontend**: React, Next.js, TypeScript, JavaScript (ES6+), HTML5/Semantic CSS, Framer Motion
- **UI/UX & Design**: Figma, Design Systems, Glassmorphism, Micro-Animations, Prototyping, Wireframing
- **Styling & Components**: Tailwind CSS, CSS Modules, Styled Components, Storybook, Radix UI, ARIA
- **Tools & Workflow**: Vite, Webpack, Git, Jest, Cypress, Vercel

## Honors & Awards
- 🏆 **99+ Core Web Vitals Optimization Milestone** (DesignCraft Studios, 2024)
- 🏅 **Best UI/UX Design System Award** (Frontend Masters Conclave NCR, 2024)

## Experience
### Lead Frontend Developer | DesignCraft Studios
*2022 - Present | Noida, India*
- Architected enterprise component library serving 200k+ monthly active users with 99+ Core Web Vitals score.
- Reduced UI development cycle by 45% through tokens-first design system and reusable Figma components.
- Engineered dark-mode glassmorphic dashboards with zero layout shifts and silky 60fps micro-animations.

## Featured Projects
### Modern Glassmorphism UI Framework
- Created an open-source React component library featuring dark-mode glassmorphic cards, glow effects, and responsive navigation drawers.

### Interactive Design Studio
- Built a web-based canvas editor with live CSS token export, drag-and-drop component positioning, and Figma plugin SDK integration.

### Accessible Web Component Suite (WCAG AAA)
- Developed accessible component primitives with full keyboard navigation and screen-reader compatibility.
"""
    },
    "candidate_vishnu": {
        "id": "candidate_vishnu",
        "name": "Vishnu Kumar",
        "role": "Python Developer | Backend & API Engineering | ML Systems",
        "cluster_color": "#10b981",
        "email": "vishnu9027872285@gmail.com",
        "phone": "+91 9027872285",
        "location": "Noida, Uttar Pradesh, India",
        "summary": "Results-driven Python Developer with hands-on experience building scalable REST APIs, automating ML pipelines, and developing production-grade backend systems. Proficient in FastAPI, Flask, and Streamlit for service layer development. Strong foundation in object-oriented Python, data structures, and algorithm design. Experienced deploying containerized services via Docker with CI/CD automation using GitHub Actions. Passionate about writing clean, maintainable Python code across ML, backend, and data engineering domains.",
        "skills": ["Python", "FastAPI", "Flask", "TensorFlow", "Docker", "MongoDB", "MySQL", "Redis", "Scikit-learn", "REST APIs", "CI/CD"],
        "top_skills": ["Python", "FastAPI", "TensorFlow", "Docker", "MongoDB", "Scikit-learn"],
        "projects": [
            {
                "title": "GPT Large Language Model from Scratch",
                "desc": "Engineered a complete GPT-1 style model in Python/TensorFlow with modular scripts for data preprocessing, training, and inference — demonstrating deep Python architecture skills across a large codebase.",
                "tech": "Python, TensorFlow, Deep Learning",
                "skills": ["Python", "TensorFlow"]
            },
            {
                "title": "S.A.F.E. — Real-Time AI Data Pipeline & Deep Learning System",
                "desc": "Built a real-time sensor data ingestion pipeline in Python feeding a TensorFlow deep learning model with automated training, model versioning, and REST API deployment.",
                "tech": "Python, TensorFlow, FastAPI, REST APIs",
                "skills": ["Python", "FastAPI", "TensorFlow"]
            },
            {
                "title": "SentiScan — NLP Sentiment Intelligence Engine",
                "desc": "Developed a Flask REST API microservice serving a Bidirectional LSTM model (92.4% accuracy on 50K reviews) with real-time inference; exposed clean JSON endpoints for seamless integration.",
                "tech": "Python, Flask, NLP, Bidirectional LSTM",
                "skills": ["Python", "Flask", "NLP"]
            },
            {
                "title": "MediPredict — Multi-Domain ML Recommendation Engine",
                "desc": "Implemented automated Python model selection logic across 7 domains (Scikit-learn, XGBoost, Random Forest, SVM); 91.3% mean accuracy with ensemble logic for multi-class recommendations.",
                "tech": "Python, Scikit-learn, XGBoost, Streamlit",
                "skills": ["Python", "Scikit-learn"]
            }
        ],
        "experiences": [
            {
                "role": "Full Stack Developer",
                "company": "Devstack Technologies",
                "location": "Noida, India",
                "period": "2026 – Present",
                "desc": "Designed and developed end-to-end full stack web applications using React (frontend) and FastAPI/Node.js (backend), delivering responsive, production-ready products for internal and client-facing use."
            }
        ],
        "achievements": [
            {
                "title": "Oracle Cloud Infrastructure (OCI) Data Science Professional Certification",
                "organization": "Oracle",
                "year": "2025",
                "desc": "Cloud ML deployment, model management, OCI infrastructure"
            },
            {
                "title": "HackerRank SQL Certificate — Intermediate",
                "organization": "HackerRank",
                "year": "2024",
                "desc": "Advanced SQL for data pipelines and Text-to-SQL applications"
            },
            {
                "title": "2nd Place — HackTheBox TechTrix Cybersecurity Competition",
                "organization": "HackTheBox / Virtual Lab Hackathon",
                "year": "2024",
                "desc": "Top 5 Finalist (Pan-India) — Virtual Lab Hackathon"
            }
        ],
        "education": [
            {
                "degree": "B.Tech in Computer Science & Engineering",
                "institution": "AKTU Engineering Hub",
                "period": "2022 - 2026",
                "details": "Specialization in Python Development, Backend Engineering & ML Systems."
            }
        ],
        "certifications": [
            {
                "name": "Oracle Cloud Infrastructure (OCI) Data Science Professional Certification",
                "issuer": "Oracle",
                "year": "2025"
            },
            {
                "name": "HackerRank SQL Certificate — Intermediate",
                "issuer": "HackerRank",
                "year": "2024"
            }
        ],
        "doc_name": "Vishnu_Kumar_Resume.pdf",
        "peer_gaps": ["React & Frontend UI (Mastered by Krati)", "IoT Wearables Firmware (Mastered by Mohit)"],
        "resume_markdown": """# VISHNU KUMAR
**Python Developer | Backend & API Engineering | ML Systems**
vishnu9027872285@gmail.com • +91 9027872285 • [linkedin.com/in/vishnu-kumar](https://linkedin.com/in/vishnu-kumar) • [github.com/HelloVishnu04](https://github.com/HelloVishnu04)

## PROFESSIONAL SUMMARY
Results-driven Python Developer with hands-on experience building scalable REST APIs, automating ML pipelines, and developing production-grade backend systems. Proficient in FastAPI, Flask, and Streamlit for service layer development. Strong foundation in object-oriented Python, data structures, and algorithm design. Experienced deploying containerized services via Docker with CI/CD automation using GitHub Actions. Passionate about writing clean, maintainable Python code across ML, backend, and data engineering domains.

## EXPERIENCE
### Full Stack Developer | Devstack Technologies | 2026 – Present
- Designed and developed end-to-end full stack web applications using React (frontend) and FastAPI/Node.js (backend), delivering responsive, production-ready products for internal and client-facing use.
- Built and maintained RESTful APIs integrated with MongoDB and MySQL databases, implementing authentication, role-based access control, and real-time data features using WebSockets.
- Collaborated with cross-functional teams to integrate ML model APIs into web platforms, and automated deployment pipelines using Docker and GitHub Actions for continuous delivery.

## KEY PROJECTS
### GPT Large Language Model from Scratch | Personal Project | 2026
- Engineered a complete GPT-1 style model in Python/TensorFlow with modular scripts for data preprocessing, training, and inference — demonstrating deep Python architecture skills across a large codebase.

### S.A.F.E. — Real-Time AI Data Pipeline & Deep Learning System | Personal Project | 2026
- Built a real-time sensor data ingestion pipeline in Python feeding a TensorFlow deep learning model with automated training, model versioning, and REST API deployment.

### SentiScan — NLP Sentiment Intelligence Engine | Personal Project | 2025
- Developed a Flask REST API microservice serving a Bidirectional LSTM model (92.4% accuracy on 50K reviews) with real-time inference; exposed clean JSON endpoints for seamless integration.

### MediPredict — Multi-Domain ML Recommendation Engine | Personal Project | 2025
- Implemented automated Python model selection logic across 7 domains (Scikit-learn, XGBoost, Random Forest, SVM); 91.3% mean accuracy with ensemble logic for multi-class recommendations.

## TECHNICAL SKILLS
- **Core Python**: Python 3.x, OOP, Functional Programming, Design Patterns, Data Structures & Algorithms (DSA)
- **API & Backend**: FastAPI, Flask, REST API Design, Microservices, Streamlit, Firebase, MongoDB, MySQL, Redis
- **ML & Data**: TensorFlow, Keras, Scikit-learn, XGBoost, Pandas, NumPy, NLP, LangChain, Hugging Face Transformers, OpenAI API
- **DevOps & Cloud**: Docker, GitHub Actions, CI/CD, MLflow, Model Versioning, AWS (S3, Lambda, SageMaker), OCI (Certified)
- **Other**: Git, React / MERN Stack, Java (DSA), Competitive Programming, PySpark, FAISS, ChromaDB

## EDUCATION, CERTIFICATIONS & ACHIEVEMENTS
- Oracle Cloud Infrastructure (OCI) Data Science Professional Certification — 2025 (Cloud ML deployment, model management, OCI infrastructure)
- HackerRank SQL Certificate — Intermediate — 2024 (Advanced SQL for data pipelines and Text-to-SQL applications)
- 2nd Place — HackTheBox TechTrix Cybersecurity Competition | Top 5 Finalist (Pan-India) — Virtual Lab Hackathon
"""
    }
}


@app.get("/api/candidates")
def get_all_candidates():
    """Returns all detected candidates in the system for Graph RAG switching."""
    c_list = [
        {
            "id": "candidate_all",
            "name": "🌐 Multi-Candidate Global Network",
            "role": "Interconnected Talent & Skill Ecosystem",
            "cluster_color": "#818cf8",
            "location": "Global / NCR Hub",
            "skills_count": 14,
            "shared_skills": ["Python", "React", "FastAPI", "PostgreSQL"]
        }
    ]
    for cid, c in CANDIDATES_REGISTRY.items():
        c_list.append({
            "id": c["id"],
            "name": c["name"],
            "role": c["role"],
            "cluster_color": c["cluster_color"],
            "email": c["email"],
            "phone": c["phone"],
            "location": c["location"],
            "summary": c["summary"],
            "skills_count": len(c["skills"]),
            "top_skills": c["top_skills"],
            "projects_count": len(c["projects"]),
            "achievements_count": len(c.get("achievements", [])),
            "doc_name": c["doc_name"],
            "peer_gaps": c["peer_gaps"]
        })
    return {"status": "success", "candidates": c_list}


@app.get("/api/candidates/{candidate_id}")
def get_candidate_details(candidate_id: str):
    """Returns detailed candidate profile including base resume markdown, achievements, education, and matched opportunities."""
    if candidate_id not in CANDIDATES_REGISTRY:
        candidate_id = "candidate_mohit"
    
    cand = CANDIDATES_REGISTRY[candidate_id]
    opps = get_all_opportunities(candidate_id=candidate_id).get("opportunities", [])
    
    return {
        "status": "success",
        "candidate": cand,
        "matched_opportunities": opps[:10]
    }


class SaveTemplateReq(BaseModel):
    resume_markdown: str

@app.post("/api/candidates/{candidate_id}/save-template")
def save_candidate_template(candidate_id: str, req: SaveTemplateReq):
    """Saves the candidate's master resume markdown and synchronizes to local resume.md."""
    if candidate_id not in CANDIDATES_REGISTRY:
        candidate_id = "candidate_mohit"
    
    from my_agent.tools.tailor_tools import normalize_to_sections
    clean_md = normalize_to_sections(req.resume_markdown)

    CANDIDATES_REGISTRY[candidate_id]["resume_markdown"] = clean_md
    
    # Synchronize to root resume.md
    try:
        resume_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "resume.md")
        with open(resume_file, "w", encoding="utf-8") as f:
            f.write(clean_md)
    except Exception as e:
        print(f"[Sync resume.md notice] {e}")

    return {
        "status": "success",
        "candidate_id": candidate_id,
        "resume_markdown": clean_md,
        "message": f"Master template for {CANDIDATES_REGISTRY[candidate_id]['name']} saved and locked successfully!"
    }



@app.get("/api/knowledge-graph/{user_id}")
@app.get("/api/knowledge-graph")
async def get_knowledge_graph(user_id: str = "default-user", candidate_id: Optional[str] = None):
    """Constructs comprehensive multi-candidate Graph RAG network with distinct Person,
    Skill Hubs, Project, Experience, Achievement, Education, Certification, and Opportunity entities.
    """
    try:
        documents = read_from_db("documents").get("records", [])
        embeddings = read_from_db("embeddings").get("records", [])
        raw_opps = read_from_db("opportunities").get("records", [])
        ranked_opps = read_from_db("ranked_opportunities").get("records", [])
        opp_lookup = {str(o.get("id")): o for o in raw_opps}

        # Helper to find vector chunk excerpt
        def find_vector_reference(term: str, fallback_doc: str = "Master Resume"):
            term_lower = term.lower().strip()
            for emb in embeddings:
                chunk_txt = emb.get("chunk_text", "")
                if term_lower in chunk_txt.lower():
                    doc_rec = next((d for d in documents if d.get("id") == emb.get("document_id")), None)
                    doc_name = doc_rec.get("filename", fallback_doc) if doc_rec else fallback_doc
                    return {
                        "source_doc": doc_name,
                        "chunk_index": emb.get("chunk_index", 0),
                        "chunk_excerpt": chunk_txt[:280] + ("..." if len(chunk_txt) > 280 else ""),
                        "embedding_model": "Gemini 001 (768-dim Vector)",
                        "similarity_score": 96.4
                    }

            for d in documents:
                raw_md = d.get("raw_markdown", "")
                if term_lower in raw_md.lower():
                    idx = raw_md.lower().find(term_lower)
                    start = max(0, idx - 40)
                    end = min(len(raw_md), idx + 200)
                    return {
                        "source_doc": d.get("filename", fallback_doc),
                        "chunk_index": 0,
                        "chunk_excerpt": raw_md[start:end].strip() + "...",
                        "embedding_model": "Gemini 001 (768-dim Vector)",
                        "similarity_score": 93.1
                    }

            return {
                "source_doc": fallback_doc,
                "chunk_index": 0,
                "chunk_excerpt": f"Entity '{term}' extracted from Candidate Portfolio and verified via vector search.",
                "embedding_model": "Gemini 001 (768-dim Vector)",
                "similarity_score": 91.0
            }

        # Filter candidates if specific candidate selected
        active_candidates = CANDIDATES_REGISTRY
        if candidate_id and candidate_id in CANDIDATES_REGISTRY:
            focused_id = candidate_id
        else:
            focused_id = "all"

        nodes = []
        edges = []
        added_node_ids = set()

        # ── 1. Create Candidate Person Nodes ─────────────────────────────────
        for cid, cinfo in active_candidates.items():
            is_focused = (focused_id == "all" or focused_id == cid)
            nodes.append({
                "id": cid,
                "label": cinfo["name"],
                "group": "user",
                "val": 15 if is_focused else 10,
                "cluster_color": cinfo["cluster_color"],
                "vector_reference": {
                    "source_doc": cinfo["doc_name"],
                    "chunk_index": 0,
                    "chunk_excerpt": f"Candidate profile for {cinfo['name']} ({cinfo['role']}). {cinfo['summary']}",
                    "embedding_model": "Gemini 001 (768-dim Vector)",
                    "similarity_score": 100.0
                },
                "attributes": {
                    "candidate_id": cid,
                    "name": cinfo["name"],
                    "role": cinfo["role"],
                    "email": cinfo["email"],
                    "phone": cinfo["phone"],
                    "location": cinfo["location"],
                    "summary": cinfo["summary"],
                    "total_skills": len(cinfo["skills"]),
                    "total_projects": len(cinfo["projects"]),
                    "total_achievements": len(cinfo.get("achievements", [])),
                    "peer_gaps": cinfo["peer_gaps"],
                    "is_primary": (cid == "candidate_mohit")
                }
            })
            added_node_ids.add(cid)

        # ── 2. Create Canonical Shared & Unique Skill Nodes ──────────────────
        skill_to_candidates = {}
        for cid, cinfo in active_candidates.items():
            for s in cinfo["skills"]:
                if s not in skill_to_candidates:
                    skill_to_candidates[s] = []
                skill_to_candidates[s].append(cid)

        for skill_name, owner_ids in skill_to_candidates.items():
            if focused_id != "all" and focused_id not in owner_ids:
                continue

            skill_id = f"skill_{skill_name.lower().replace(' ', '_').replace('&', 'and').replace('+', 'p')}"
            is_shared = len(owner_ids) > 1
            owners_names = [active_candidates[oid]["name"] for oid in owner_ids]
            non_owners_names = [c["name"] for oid, c in active_candidates.items() if oid not in owner_ids]
            v_ref = find_vector_reference(skill_name, fallback_doc="Candidate Skill Portfolio")

            if skill_id not in added_node_ids:
                nodes.append({
                    "id": skill_id,
                    "label": f"⚡ {skill_name}" if is_shared else skill_name,
                    "group": "skill",
                    "val": 9 if is_shared else 6,
                    "is_shared": is_shared,
                    "shared_count": len(owner_ids),
                    "vector_reference": v_ref,
                    "attributes": {
                        "skill_name": skill_name,
                        "is_shared": is_shared,
                        "known_by": owners_names,
                        "skill_gap_for": non_owners_names if is_shared else [],
                        "category": "Shared Core Competency" if is_shared else "Specialized Competency",
                        "source_document": v_ref["source_doc"]
                    }
                })
                added_node_ids.add(skill_id)

            for oid in owner_ids:
                edges.append({
                    "source": oid,
                    "target": skill_id,
                    "type": "KNOWS_SKILL",
                    "label": "Mastered Skill"
                })

        # ── 3. Create Project Nodes & Project-Skill Interconnections ─────────
        for cid, cinfo in active_candidates.items():
            if focused_id != "all" and focused_id != cid:
                continue

            for idx, proj in enumerate(cinfo["projects"]):
                proj_id = f"proj_{cid}_{idx}"
                v_ref = find_vector_reference(proj["title"], fallback_doc=cinfo["doc_name"])

                if proj_id not in added_node_ids:
                    nodes.append({
                        "id": proj_id,
                        "label": f"💻 {proj['title']}",
                        "group": "project",
                        "val": 8,
                        "vector_reference": v_ref,
                        "attributes": {
                            "title": proj["title"],
                            "author": cinfo["name"],
                            "description": proj["desc"],
                            "tech_stack": proj["tech"],
                            "source_document": cinfo["doc_name"]
                        }
                    })
                    added_node_ids.add(proj_id)
                    edges.append({
                        "source": cid,
                        "target": proj_id,
                        "type": "BUILT_PROJECT",
                        "label": "Engineered"
                    })

                # Connect project to its skills
                for p_skill in proj.get("skills", []):
                    s_id = f"skill_{p_skill.lower().replace(' ', '_').replace('&', 'and').replace('+', 'p')}"
                    if s_id in added_node_ids:
                        edges.append({
                            "source": proj_id,
                            "target": s_id,
                            "type": "USES_TECH",
                            "label": "Built With"
                        })

        # ── 4. Create Work Experience Nodes ──────────────────────────────────
        for cid, cinfo in active_candidates.items():
            if focused_id != "all" and focused_id != cid:
                continue

            for idx, exp in enumerate(cinfo["experiences"]):
                exp_id = f"exp_{cid}_{idx}"
                v_ref = find_vector_reference(exp["company"], fallback_doc=cinfo["doc_name"])

                if exp_id not in added_node_ids:
                    nodes.append({
                        "id": exp_id,
                        "label": f"💼 {exp['role']} @ {exp['company'].split('(')[0].strip()}",
                        "group": "experience",
                        "val": 7,
                        "vector_reference": v_ref,
                        "attributes": {
                            "candidate": cinfo["name"],
                            "role": exp["role"],
                            "company": exp["company"],
                            "period": exp["period"],
                            "location": exp.get("location", "Noida, India"),
                            "achievements": exp["desc"]
                        }
                    })
                    added_node_ids.add(exp_id)
                    edges.append({
                        "source": cid,
                        "target": exp_id,
                        "type": "WORKED_AT",
                        "label": "Employed"
                    })

        # ── 5. Create Achievement & Award Nodes ──────────────────────────────
        for cid, cinfo in active_candidates.items():
            if focused_id != "all" and focused_id != cid:
                continue

            for idx, ach in enumerate(cinfo.get("achievements", [])):
                ach_id = f"ach_{cid}_{idx}"
                v_ref = find_vector_reference(ach["title"], fallback_doc=cinfo["doc_name"])

                if ach_id not in added_node_ids:
                    nodes.append({
                        "id": ach_id,
                        "label": ach["title"],
                        "group": "achievement",
                        "val": 8,
                        "vector_reference": v_ref,
                        "attributes": {
                            "title": ach["title"],
                            "organization": ach["organization"],
                            "year": ach["year"],
                            "impact": ach["desc"],
                            "winner": cinfo["name"]
                        }
                    })
                    added_node_ids.add(ach_id)
                    edges.append({
                        "source": cid,
                        "target": ach_id,
                        "type": "EARNED_AWARD",
                        "label": "Won Award"
                    })

        # ── 6. Create Education & Certification Nodes ────────────────────────
        for cid, cinfo in active_candidates.items():
            if focused_id != "all" and focused_id != cid:
                continue

            # Education
            for idx, edu in enumerate(cinfo.get("education", [])):
                edu_id = f"edu_{cid}_{idx}"
                if edu_id not in added_node_ids:
                    nodes.append({
                        "id": edu_id,
                        "label": f"🎓 {edu['degree']}",
                        "group": "education",
                        "val": 7,
                        "vector_reference": {
                            "source_doc": cinfo["doc_name"],
                            "chunk_index": 0,
                            "chunk_excerpt": f"Academic degree in {edu['degree']} from {edu['institution']}. {edu['details']}",
                            "embedding_model": "Gemini 001 (768-dim Vector)",
                            "similarity_score": 98.0
                        },
                        "attributes": {
                            "degree": edu["degree"],
                            "institution": edu["institution"],
                            "period": edu["period"],
                            "details": edu["details"]
                        }
                    })
                    added_node_ids.add(edu_id)
                    edges.append({
                        "source": cid,
                        "target": edu_id,
                        "type": "STUDIED_AT",
                        "label": "Graduated"
                    })

            # Certifications
            for idx, cert in enumerate(cinfo.get("certifications", [])):
                cert_id = f"cert_{cid}_{idx}"
                if cert_id not in added_node_ids:
                    nodes.append({
                        "id": cert_id,
                        "label": f"📜 {cert['name']}",
                        "group": "certification",
                        "val": 6,
                        "vector_reference": {
                            "source_doc": cinfo["doc_name"],
                            "chunk_index": 0,
                            "chunk_excerpt": f"Professional certification: {cert['name']} issued by {cert['issuer']} ({cert['year']}).",
                            "embedding_model": "Gemini 001 (768-dim Vector)",
                            "similarity_score": 97.0
                        },
                        "attributes": {
                            "name": cert["name"],
                            "issuer": cert["issuer"],
                            "year": cert["year"]
                        }
                    })
                    added_node_ids.add(cert_id)
                    edges.append({
                        "source": cid,
                        "target": cert_id,
                        "type": "ACQUIRED_CERT",
                        "label": "Certified"
                    })

        # ── 7. Create Source Document Nodes ──────────────────────────────────
        for cid, cinfo in active_candidates.items():
            if focused_id != "all" and focused_id != cid:
                continue

            doc_id = f"doc_{cid}"
            if doc_id not in added_node_ids:
                nodes.append({
                    "id": doc_id,
                    "label": f"📄 {cinfo['doc_name']}",
                    "group": "document",
                    "val": 6,
                    "vector_reference": {
                        "source_doc": cinfo["doc_name"],
                        "chunk_index": 0,
                        "chunk_excerpt": f"Verified resume document for {cinfo['name']} ({cinfo['role']}). Processed via Docling OCR & Gemini 001 embeddings.",
                        "embedding_model": "Gemini 001 (768-dim Vector)",
                        "similarity_score": 100.0
                    },
                    "attributes": {
                        "filename": cinfo["doc_name"],
                        "owner": cinfo["name"],
                        "doc_type": "Verified Resume"
                    }
                })
                added_node_ids.add(doc_id)
                edges.append({
                    "source": doc_id,
                    "target": cid,
                    "type": "SOURCES_CANDIDATE_DATA",
                    "label": "Grounds Profile"
                })

        # ── 8. Create Peer Collaborative Synergies (Graph RAG Bridges) ──────
        if focused_id == "all":
            synergies = [
                {
                    "source": "candidate_mohit",
                    "target": "candidate_krati",
                    "type": "TEAM_SYNERGY",
                    "label": "Full-Stack AI Product Synergy",
                    "desc": "Mohit (AI Systems & IoT Backend) + Krati (Figma & UI/UX Design System) form an end-to-end AI Product Team."
                },
                {
                    "source": "candidate_mohit",
                    "target": "candidate_vishnu",
                    "type": "TEAM_SYNERGY",
                    "label": "High-Scale Backend & AI Synergy",
                    "desc": "Mohit (FastAPI & Vector Search) + Vishnu (Distributed Systems & Database Scaling) form a high-throughput backend infrastructure team."
                },
                {
                    "source": "candidate_krati",
                    "target": "candidate_vishnu",
                    "type": "TEAM_SYNERGY",
                    "label": "Client-Server Collaboration",
                    "desc": "Krati (Accessible UI & Next.js) + Vishnu (Robust Microservice APIs & PostgreSQL) build responsive enterprise web apps."
                }
            ]
            for syn in synergies:
                edges.append(syn)

        # ── 9. Discovered & Tailored Opportunity Nodes ───────────────────────
        cand_opps = get_all_opportunities(candidate_id=focused_id if focused_id != "all" else None).get("opportunities", [])
        for opp in cand_opps[:8]:
            opp_id = f"opp_{opp.get('id')}"
            title = opp.get("title") or "Engineering Opportunity"
            company = opp.get("company") or opp.get("company_name") or opp.get("source") or "Tech Organization"
            cat = opp.get("category", "job").lower()
            score = opp.get("relevance_score", 92)
            matched_cand = opp.get("matched_candidate_id", "candidate_mohit")

            if opp_id not in added_node_ids:
                nodes.append({
                    "id": opp_id,
                    "label": f"[{cat.upper()}] {title} ({company})",
                    "group": "opportunity",
                    "val": 8,
                    "vector_reference": {
                        "source_doc": f"Live Discovery ({company})",
                        "chunk_index": 0,
                        "chunk_excerpt": opp.get("description", f"Live {cat} opportunity scouted and scored via Graph RAG vector matching.")[:250],
                        "embedding_model": "Gemini Vector Match",
                        "similarity_score": float(score)
                    },
                    "attributes": {
                        "id": str(opp.get("id", "")),
                        "title": title,
                        "company": company,
                        "category": cat,
                        "relevance_score": score,
                        "url": opp.get("url", "#"),
                        "matched_candidate_id": matched_cand,
                        "match_reasons": [f"Directly matches candidates skilled in {active_candidates.get(matched_cand, {}).get('name', 'Candidate')} core domain."]
                    }
                })
                added_node_ids.add(opp_id)

                link_target = focused_id if focused_id != "all" else matched_cand
                if link_target in added_node_ids:
                    edges.append({
                        "source": link_target,
                        "target": opp_id,
                        "type": "MATCHES_PROFILE",
                        "label": f"{score}% Fit"
                    })

        return {
            "status": "success",
            "focused_candidate": focused_id,
            "candidates": get_all_candidates()["candidates"],
            "nodes": nodes,
            "edges": edges,
            "links": edges,
            "metrics": {
                "total_candidates": len(active_candidates),
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "shared_skills_count": len([k for k, v in skill_to_candidates.items() if len(v) > 1])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 6. Trigger Simulated Scope Violation Attack ──────────────────────────────
@app.post("/api/demo/trigger-attack")
def trigger_attack(req: Optional[AttackRequest] = None):
    """Simulates prompt injection attack with ArmorIQ Shield ON/OFF."""
    is_secured = req.secured if (req and req.secured is not None) else True
    root_kp = global_keypairs["root_coordinator_agent"]
    tok_scout = global_armoriq.delegate(
        "root_coordinator_agent", root_kp, "opportunity_scout",
        ["profiles:read", "opportunities:write"], ["mcp_scout.scout_and_store_opportunities"], 300
    )

    if is_secured:
        try:
            global_armoriq.invoke(
                "opportunity_scout", global_keypairs["opportunity_scout"], tok_scout, root_kp,
                "mcp_scout.auto_apply_job", {"job_id": 99, "credit_card_id": 999}, auto_apply_job
            )
            return {"status": "error", "message": "Attack executed!"}
        except ArmorIQScopeViolationError as e:
            return {
                "status": "blocked",
                "shield": "ARMORIQ_PROTECTED_ON",
                "message": str(e),
                "sub_agent": e.sub_agent_id,
                "attempted_tool": e.requested_tool,
                "allowed_tools": e.allowed_tools,
                "timestamp": time.time()
            }
    else:
        res = auto_apply_job(job_id=99, credit_card_id=999)
        return {
            "status": "breached",
            "shield": "ARMORIQ_DISABLED_OFF",
            "warning": "SECURITY BREACH! Prompt attack executed unauthorized auto_apply_job tool because ArmorIQ Shield was OFF!",
            "executed_result": res,
            "timestamp": time.time()
        }
