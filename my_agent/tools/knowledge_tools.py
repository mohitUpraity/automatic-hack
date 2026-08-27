"""Knowledge Base & RAG Vector Search Integration."""

import json
from typing import Any, Dict, List
from my_agent.tools.db_tools import get_supabase, _get_sqlite_conn
from my_agent.tools.embedding_tools import embed_query


def _cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculate cosine similarity between two 1D float vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = sum(a * a for a in v1) ** 0.5
    norm_b = sum(b * b for b in v2) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def search_knowledge_base(
    query: str,
    user_id: str = "default-user",
    top_k: int = 10,
    match_threshold: float = 0.0
) -> List[Dict[str, Any]]:
    """Semantic search over user's knowledge base using RAG embeddings.
    
    Uses Supabase pgvector match_embeddings RPC or SQLite cosine fallback.
    """
    query_vector = embed_query(query)

    sb = get_supabase()
    if sb:
        try:
            res = sb.rpc("match_embeddings", {
                "query_embedding": query_vector,
                "match_threshold": match_threshold,
                "match_count": top_k,
                "filter_user_id": user_id
            }).execute()
            if res.data:
                return res.data
        except Exception:
            pass

    # Fallback SQLite cosine search
    conn = _get_sqlite_conn()
    try:
        rows = conn.execute(
            "SELECT id, document_id, chunk_text, chunk_metadata, embedding FROM embeddings WHERE user_id = ? OR user_id = 'default-user'",
            (user_id,)
        ).fetchall()

        results = []
        for r in rows:
            try:
                emb = json.loads(r["embedding"]) if isinstance(r["embedding"], str) else r["embedding"]
                sim = _cosine_similarity(query_vector, emb)
                meta = json.loads(r["chunk_metadata"]) if isinstance(r["chunk_metadata"], str) else (r["chunk_metadata"] or {})
                
                # Check for basic keyword overlap boost for mock embeddings
                query_words = set(query.lower().split())
                chunk_words = set(r["chunk_text"].lower().split())
                overlap = len(query_words.intersection(chunk_words))
                score = sim + (overlap * 0.1)

                if score >= match_threshold or len(rows) <= top_k:
                    results.append({
                        "id": r["id"],
                        "document_id": r["document_id"],
                        "chunk_text": r["chunk_text"],
                        "chunk_metadata": meta,
                        "similarity": round(score, 4)
                    })
            except Exception:
                continue

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]
    finally:
        conn.close()


def get_rag_context(query: str, user_id: str = "default-user", top_k: int = 8) -> str:
    """Retrieves top relevant chunks and formats them as RAG context for LLM prompt."""
    chunks = search_knowledge_base(query, user_id, top_k=top_k)

    if not chunks:
        return "No relevant context found in knowledge base."

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        meta = chunk.get("chunk_metadata", {})
        heading = meta.get("heading", f"Section {i}")
        text = chunk.get("chunk_text", "").strip()
        sim = chunk.get("similarity", 0.0)
        context_parts.append(f"--- Context Source {i}: {heading} (Relevance: {sim}) ---\n{text}")

    return "\n\n".join(context_parts)
