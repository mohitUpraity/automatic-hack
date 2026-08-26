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
from typing import Optional

from fastapi import FastAPI, Form, File, UploadFile, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from my_agent.armoriq_crypto import generate_pipeline_keypairs
from my_agent.armoriq_wrapper import ArmorIQClient, ArmorIQScopeViolationError

# MCP & Tools
from my_agent.tools.docling_tools import convert_document
from my_agent.tools.embedding_tools import embed_chunks
from my_agent.tools.db_tools import store_document, store_embeddings, get_supabase, store_to_db, read_from_db
from my_agent.tools.knowledge_tools import search_knowledge_base, get_rag_context
from my_agent.tools.tailor_tools import tailor_resume_for_opportunity
from my_agent.tools.llm_tools import call_groq_llm

from my_agent.mcp_servers.mcp_extractor_server import extract_and_store_resume
from my_agent.mcp_servers.mcp_analyzer_server import analyze_and_store_resume
from my_agent.mcp_servers.mcp_profiler_server import build_and_store_profile
from my_agent.mcp_servers.mcp_scout_server import scout_and_store_opportunities, auto_apply_job
from my_agent.mcp_servers.mcp_ranker_server import rank_and_store_opportunities
from my_agent.mcp_servers.mcp_docproc_server import process_and_embed_document
from my_agent.mcp_servers.mcp_knowledge_server import build_knowledge_base
from my_agent.mcp_servers.mcp_tailor_server import tailor_resume

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


class AttackRequest(BaseModel):
    secured: Optional[bool] = True


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
            "trigger_attack": "/api/demo/trigger-attack (POST)"
        }
    }


# ── 1. Document Upload Endpoint (Fixing PDF Upload Bug) ─────────────────────
@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("resume"),
    user_id: str = Depends(get_current_user)
):
    """Upload ANY document (PDF, DOCX, Images, OCR). Docling converts, Gemini embeds, stored in DB."""
    temp_dir = "/tmp/careeros_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)

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

        if os.path.exists(temp_path):
            os.remove(temp_path)

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
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Document upload error: {str(e)}")


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
    """Generates company-specific tailored resume content and WeasyPrint PDF."""
    try:
        res = tailor_resume_for_opportunity(
            opportunity_title=req.opportunity_title,
            company_name=req.company_name,
            requirements=req.requirements,
            user_id=user_id
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tailoring error: {str(e)}")


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
            "total_ranked": res_5.get("total_ranked")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 5. Query DB & Profiles Endpoints ───────────────────────────────────────
@app.post("/api/query-db")
async def query_db(req: QueryRequest, user_id: str = Depends(get_current_user)):
    """RAG-powered candidate Q&A endpoint."""
    context = get_rag_context(req.question, user_id=user_id)
    answer = call_groq_llm(f"Candidate Context:\n{context}\n\nUser Question: {req.question}")
    return {"status": "success", "question": req.question, "answer": answer}


@app.get("/api/profiles")
def get_all_profiles():
    res = read_from_db("profiles")
    return {"status": "success", "profiles": res.get("records", [])}


@app.get("/api/audit-logs")
def get_audit_logs():
    return {"status": "success", "logs": global_armoriq.get_audit_trail()}


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
