import os
from dotenv import load_dotenv
import litellm

# Ensure .env is loaded
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
load_dotenv(env_path)
load_dotenv()

litellm.telemetry = False
litellm.drop_params = True

from google.adk.agents.llm_agent import Agent

# ── Import tools ─────────────────────────────────────────────────────────────
from .tools.db_tools import store_to_db, read_from_db
from .tools.docling_tools import convert_document
from .tools.embedding_tools import embed_chunks
from .tools.knowledge_tools import search_knowledge_base, get_rag_context
from .tools.resume_tools import extract_resume
from .tools.analysis_tools import analyze_resume
from .tools.profile_tools import make_profile
from .tools.search_tools import search_web
from .tools.ranking_tools import rank_results
from .tools.tailor_tools import tailor_resume_for_opportunity

raw_model = os.getenv("GROQ_MODEL", "groq/qwen/qwen3.8-27b").strip()
if raw_model == "groq/qwen3.8-27b":
    MODEL = "groq/qwen/qwen3.8-27b"
else:
    MODEL = raw_model


# ── Sub-Agent 1: Document Processor ──────────────────────────────────────────
document_processor = Agent(
    model=MODEL,
    name="document_processor",
    description="Processes multi-format documents (PDF, DOCX, images, scanned docs), chunks, embeds with Gemini 001, and stores in knowledge base.",
    instruction="Converts documents to markdown using Docling, creates semantic chunks, generates 768d vector embeddings, and stores records.",
    tools=[convert_document, embed_chunks, store_to_db],
    mode="single_turn",
)

# ── Sub-Agent 2: Resume Extractor ────────────────────────────────────────────
resume_extractor = Agent(
    model=MODEL,
    name="resume_extractor",
    description="Extracts structured fields from candidate resume.",
    instruction="Extract structured fields from resume text and save record.",
    tools=[extract_resume, store_to_db],
    mode="single_turn",
)

# ── Sub-Agent 3: Resume Analyzer ─────────────────────────────────────────────
resume_analyzer = Agent(
    model=MODEL,
    name="resume_analyzer",
    description="Analyzes stored resume data to identify strengths, weaknesses, experience level, and domain focus.",
    instruction="Read resume record, analyze candidate strengths and domain focus, and store analysis.",
    tools=[read_from_db, analyze_resume, store_to_db],
    mode="single_turn",
)

# ── Sub-Agent 4: Profile Maker ───────────────────────────────────────────────
profile_maker = Agent(
    model=MODEL,
    name="profile_maker",
    description="Builds candidate profile from resume and analysis data.",
    instruction="Read resume and analysis records, compile tech stack and goals into candidate profile.",
    tools=[read_from_db, make_profile, store_to_db],
    mode="single_turn",
)

# ── Sub-Agent 5: Opportunity Scout ───────────────────────────────────────────
opportunity_scout = Agent(
    model=MODEL,
    name="opportunity_scout",
    description="Searches web using Firecrawl MCP for jobs, internships, hackathons, and conclaves.",
    instruction="Read candidate profile search_keywords, execute Firecrawl web searches, and store opportunities.",
    tools=[read_from_db, search_web, store_to_db],
    mode="single_turn",
)

# ── Sub-Agent 6: Opportunity Ranker ──────────────────────────────────────────
opportunity_ranker = Agent(
    model=MODEL,
    name="opportunity_ranker",
    description="Ranks found opportunities by relevance score (0-100) using RAG candidate context.",
    instruction="Read profile and raw opportunities, compute relevance scores, and store ranked list.",
    tools=[read_from_db, rank_results, store_to_db],
    mode="single_turn",
)

# ── Sub-Agent 7: Knowledge Builder ───────────────────────────────────────────
knowledge_builder = Agent(
    model=MODEL,
    name="knowledge_builder",
    description="Executes RAG vector search over candidate documents and builds context.",
    instruction="Semantic query over user embeddings table and format RAG context.",
    tools=[search_knowledge_base, get_rag_context, read_from_db],
    mode="single_turn",
)

# ── Sub-Agent 8: Resume Tailor ───────────────────────────────────────────────
resume_tailor = Agent(
    model=MODEL,
    name="resume_tailor",
    description="Generates company-specific tailored resume content (markdown) and WeasyPrint PDF.",
    instruction="Retrieve candidate RAG context for opportunity requirements, tailor resume text via LLM, and render PDF.",
    tools=[get_rag_context, tailor_resume_for_opportunity, store_to_db],
    mode="single_turn",
)

# ── Coordinator Root Agent ────────────────────────────────────────────────────
root_agent = Agent(
    model=MODEL,
    name="root_agent",
    description="CareerOS v3 coordinator root agent. Central decision maker for all user requests.",
    instruction="""You are the CareerOS v3 central root agent. 
Any candidate request goes directly to you. Analyze the user's intent and dynamically decide what tools or sub-agents to use:

1. For queries or questions: ALWAYS query the RAG Knowledge Base first using `search_knowledge_base` or `get_rag_context` to retrieve candidate context before answering.
2. For resume extraction: Use `extract_resume` or `resume_extractor`.
3. For resume analysis: Use `analyze_resume` or `resume_analyzer`.
4. For candidate profiling: Use `make_profile` or `profile_maker`.
5. For opportunity search: Use `search_web` or `opportunity_scout`.
6. For opportunity ranking: Use `rank_results` or `opportunity_ranker`.
7. For document processing: Use `convert_document` / `embed_chunks` or `document_processor`.
8. For tailoring resumes: Use `tailor_resume_for_opportunity` or `resume_tailor`.

Directly execute tools or delegate to sub-agents as needed to satisfy the request.""",
    tools=[
        read_from_db,
        store_to_db,
        search_knowledge_base,
        get_rag_context,
        convert_document,
        embed_chunks,
        extract_resume,
        analyze_resume,
        make_profile,
        search_web,
        rank_results,
        tailor_resume_for_opportunity,
    ],
    sub_agents=[
        document_processor,
        resume_extractor,
        resume_analyzer,
        profile_maker,
        opportunity_scout,
        opportunity_ranker,
        knowledge_builder,
        resume_tailor,
    ],
)