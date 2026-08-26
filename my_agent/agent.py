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

MODEL = "gemini-3.1-flash-lite"

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
    description="CareerOS v3 coordinator agent orchestrating 8 ArmorIQ-governed sub-agents.",
    instruction="""You are the CareerOS v3 coordinator. Manage sequential pipeline execution across 8 sub-agents:
1. document_processor
2. resume_extractor
3. resume_analyzer
4. profile_maker
5. opportunity_scout
6. opportunity_ranker
7. knowledge_builder
8. resume_tailor

Answer candidate queries directly using database reads when possible.""",
    tools=[read_from_db, search_knowledge_base],
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