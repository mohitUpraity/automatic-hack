"""MCP Server Tool for Sub-Agent 7: knowledge_builder."""

from ..tools.knowledge_tools import search_knowledge_base, get_rag_context
from ..tools.db_tools import store_to_db


def build_knowledge_base(query: str, user_id: str = "default-user") -> dict:
    """Builds and queries candidate RAG knowledge base.

    Authorized Scope: 'embeddings:read', 'knowledge:write'
    """
    results = search_knowledge_base(query, user_id=user_id)
    context = get_rag_context(query, user_id=user_id)
    
    store_to_db("knowledge_queries", {
        "user_id": user_id,
        "query": query,
        "results_count": len(results)
    })

    return {
        "status": "success",
        "query": query,
        "results_count": len(results),
        "context_preview": context[:500]
    }
