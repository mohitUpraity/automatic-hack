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
            "SELECT id, document_id, chunk_text, chunk_metadata, embedding FROM embeddings WHERE user_id = ?",
            (user_id,)
        ).fetchall()

        if not rows:
            rows = conn.execute(
                "SELECT id, document_id, chunk_text, chunk_metadata, embedding FROM embeddings WHERE user_id = 'default-user'"
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


def seed_candidate_knowledge_bases(force: bool = False):
    """Seeds rich chunk embeddings for all candidates into the vector knowledge base."""
    from my_agent.tools.embedding_tools import embed_text
    from my_agent.tools.db_tools import store_to_db, read_from_db

    if not force:
        existing = read_from_db("embeddings").get("records", [])
        if len(existing) >= 6:
            return {"status": "already_seeded", "count": len(existing)}

    seed_chunks = [
        # Mohit Prasad Upraity Chunks
        {
            "user_id": "candidate_mohit",
            "document_id": "doc_mohit_master",
            "chunk_text": "AI Smart Shoe Gait Analysis & Fall Prevention System. Integrated 6-axis IMU sensors, FSR pressure arrays, and edge PyTorch ML models to classify human gait patterns with 98.4% anomaly detection accuracy.",
            "chunk_metadata": {"heading": "Project: Smart Shoe Gait Analysis", "candidate": "Mohit Prasad Upraity"}
        },
        {
            "user_id": "candidate_mohit",
            "document_id": "doc_mohit_master",
            "chunk_text": "DRDO ADRDE Next-Generation Firewall (NGFW) Prototype. Engineered multi-threaded deep packet inspection engine processing 10,000+ packets/sec with ML-driven threat mitigation and iptables kernel enforcement.",
            "chunk_metadata": {"heading": "Experience: DRDO ADRDE", "candidate": "Mohit Prasad Upraity"}
        },
        {
            "user_id": "candidate_mohit",
            "document_id": "doc_mohit_master",
            "chunk_text": "Technical Skills: Python, C++, PyTorch, TensorFlow, OpenCV, Edge AI, IoT Telemetry, Scikit-Learn, Docker, Linux, Wireshark, Computer Vision.",
            "chunk_metadata": {"heading": "Technical Skills", "candidate": "Mohit Prasad Upraity"}
        },

        # Vishnu Kumar Chunks (Authentic Profile Knowledge)
        {
            "user_id": "candidate_vishnu",
            "document_id": "doc_vishnu_master",
            "chunk_text": "Full Stack Developer at Devstack Technologies (2026 - Present). Built end-to-end full stack web applications with React frontend, FastAPI/Node.js backend, MongoDB/MySQL databases, WebSockets real-time features, and automated Docker CI/CD deployment pipelines.",
            "chunk_metadata": {"heading": "Experience: Full Stack Developer", "candidate": "Vishnu Kumar"}
        },
        {
            "user_id": "candidate_vishnu",
            "document_id": "doc_vishnu_master",
            "chunk_text": "Key AI/ML Projects: Built GPT Large Language Model from Scratch (GPT-1 in Python/TensorFlow), S.A.F.E. Real-Time AI Sensor Data Pipeline, SentiScan Bidirectional LSTM NLP Sentiment Microservice (92.4% accuracy), and MediPredict Multi-Domain ML Recommendation Engine across 7 domains.",
            "chunk_metadata": {"heading": "Projects: ML & Data Systems", "candidate": "Vishnu Kumar"}
        },
        {
            "user_id": "candidate_vishnu",
            "document_id": "doc_vishnu_master",
            "chunk_text": "Technical Skills & Certifications: Python 3.x, FastAPI, Flask, Streamlit, TensorFlow, Keras, Scikit-learn, Docker, GitHub Actions, MongoDB, MySQL, Redis, AWS, OCI Certified Data Science Professional, HackerRank SQL Certified Intermediate.",
            "chunk_metadata": {"heading": "Technical Skills & Certifications", "candidate": "Vishnu Kumar"}
        },

        # Krati Verma Chunks
        {
            "user_id": "candidate_krati",
            "document_id": "doc_krati_master",
            "chunk_text": "Lead Frontend & Design System Architecture. Developed enterprise React 19 and Next.js component system with 100+ accessible WCAG AAA compliant primitives and design tokens.",
            "chunk_metadata": {"heading": "Experience: Lead Frontend Engineer", "candidate": "Krati Verma"}
        },
        {
            "user_id": "candidate_krati",
            "document_id": "doc_krati_master",
            "chunk_text": "Interactive Web Experience & 60fps Micro-Animations. Architected dark-mode glassmorphic design token system with Tailwind CSS, Storybook, and Framer Motion achieving 100% Lighthouse Performance.",
            "chunk_metadata": {"heading": "Specialization: UI/UX & Design Systems", "candidate": "Krati Verma"}
        },
        {
            "user_id": "candidate_krati",
            "document_id": "doc_krati_master",
            "chunk_text": "Technical Skills: React, TypeScript, Next.js, Tailwind CSS, Design Tokens, Storybook, Framer Motion, Webpack, Figma Plugin SDK, WCAG AAA Accessibility.",
            "chunk_metadata": {"heading": "Technical Skills", "candidate": "Krati Verma"}
        }
    ]

    for chunk in seed_chunks:
        emb = embed_text(chunk["chunk_text"])
        chunk["embedding"] = emb
        store_to_db("embeddings", chunk)

    return {"status": "success", "seeded_count": len(seed_chunks)}

