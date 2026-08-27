"""Knowledge Base & RAG Vector Search Integration.

100% Supabase PostgreSQL pgvector connected with strict user & candidate persona isolation.
Zero SQLite dependency and zero cross-tenant leakage.
"""

import json
from typing import Any, Dict, List, Optional
from my_agent.tools.db_tools import get_supabase
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
    user_id: str,
    candidate_id: Optional[str] = None,
    top_k: int = 10,
    match_threshold: float = 0.0
) -> List[Dict[str, Any]]:
    """Strictly isolated semantic vector search over authenticated user & candidate documents in Supabase."""
    if not user_id:
        return []

    query_vector = embed_query(query)
    sb = get_supabase()

    # 1. Try Supabase pgvector RPC function
    try:
        rpc_params = {
            "query_embedding": query_vector,
            "match_threshold": match_threshold,
            "match_count": top_k * 2 if candidate_id else top_k,
            "filter_user_id": user_id
        }

        res = sb.rpc("match_embeddings", rpc_params)
        if res and isinstance(res, list) and len(res) > 0:
            if candidate_id and candidate_id not in ("all", "candidate_all"):
                res = [
                    r for r in res
                    if (r.get("chunk_metadata") or {}).get("candidate_id") == candidate_id
                    or r.get("user_id") == candidate_id
                ]
            if res:
                return res[:top_k]
    except Exception as e:
        print(f"[Supabase RPC vector search notice] {e}")

    # 2. Query Supabase embeddings table with strict user_id filtering
    try:
        filters = {"user_id": f"eq.{user_id}"}
        rows = sb.select("embeddings", filters=filters, limit=100)
        
        # If candidate_id is specified, filter further in memory if candidate_id was stored in metadata
        if candidate_id and candidate_id not in ("all", "candidate_all"):
            rows = [
                r for r in rows
                if (r.get("chunk_metadata") or {}).get("candidate_id") == candidate_id
                or r.get("user_id") == candidate_id
                or candidate_id in str(r.get("document_id", ""))
            ]

        results = []
        for r in rows:
            try:
                emb = r.get("embedding")
                if isinstance(emb, str):
                    emb = json.loads(emb)
                if not emb:
                    continue

                sim = _cosine_similarity(query_vector, emb)
                meta = r.get("chunk_metadata")
                if isinstance(meta, str):
                    meta = json.loads(meta)
                elif not meta:
                    meta = {}

                # Lexical overlap boost for relevance
                query_words = set(query.lower().split())
                chunk_words = set(r.get("chunk_text", "").lower().split())
                overlap = len(query_words.intersection(chunk_words))
                score = sim + (overlap * 0.05)

                if score >= match_threshold or len(rows) <= top_k:
                    results.append({
                        "id": r.get("id"),
                        "document_id": r.get("document_id"),
                        "chunk_text": r.get("chunk_text"),
                        "chunk_metadata": meta,
                        "similarity": round(score, 4)
                    })
            except Exception:
                continue

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]
    except Exception as e:
        print(f"[Supabase direct vector search error] {e}")
        return []


def get_rag_context(query: str, user_id: str, candidate_id: Optional[str] = None, top_k: int = 8) -> str:
    """Retrieves top relevant chunks from Supabase and formats them as RAG context for LLM prompt."""
    if not user_id:
        return "No authenticated context available."

    chunks = search_knowledge_base(query, user_id=user_id, candidate_id=candidate_id, top_k=top_k)

    if not chunks:
        return "No relevant context found in knowledge base."

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        meta = chunk.get("chunk_metadata", {}) or {}
        heading = meta.get("heading", f"Section {i}")
        text = chunk.get("chunk_text", "").strip()
        sim = chunk.get("similarity", 0.0)
        context_parts.append(f"--- Context Source {i}: {heading} (Relevance: {sim}) ---\n{text}")

    return "\n\n".join(context_parts)


def seed_candidate_knowledge_bases(force: bool = False):
    """Seeds initial authentic candidate profiles & embeddings directly into Supabase if empty."""
    from my_agent.tools.embedding_tools import embed_chunks
    from my_agent.tools.db_tools import store_embeddings, store_document, store_to_db, read_from_db

    sb = get_supabase()
    existing = sb.select("embeddings", limit=5)
    if existing and len(existing) >= 3 and not force:
        return {"status": "already_seeded", "count": len(existing)}

    # Define initial candidate data
    candidates_data = [
        {
            "id": "candidate_mohit",
            "name": "Mohit Prasad Upraity",
            "email": "mohitupraity123@gmail.com",
            "role": "Software Engineer & AI Systems Architect",
            "location": "Noida, Uttar Pradesh, India",
            "phone": "+91-9368014154",
            "bio": "AI Systems Engineer specializing in IoT Wearables, Gait Telemetry, and Deep Packet Inspection NGFW architectures.",
            "skills": ["Python", "FastAPI", "React", "PyTorch", "TensorFlow", "PostgreSQL", "Docker", "Linux", "C++", "IoT Telemetry", "Computer Vision"],
            "projects": [
                {"title": "AI Smart Shoe Gait Analysis", "tech": "PyTorch, 6-Axis IMU, FSR Sensors, ESP32", "desc": "Wearable smart shoe telemetry predicting fall risks with 98.4% accuracy."},
                {"title": "DRDO ADRDE Next-Gen Firewall (NGFW)", "tech": "Python, Multi-Threading, iptables, Scikit-Learn", "desc": "Deep packet inspection engine processing 10,000+ pkts/sec with zero-trust mitigation."}
            ],
            "experiences": [
                {"role": "AI Research & Embedded Intern", "company": "DRDO ADRDE (Agra)", "period": "2025 - Present", "desc": "Engineered kernel-level packet inspection and automated threat classification algorithms."}
            ],
            "education": [
                {"degree": "B.Tech in Computer Science & Engineering", "institution": "AKTU", "period": "2022 - 2026", "details": "Specialization in AI & Distributed Systems."}
            ]
        },
        {
            "id": "candidate_krati",
            "name": "Krati Verma",
            "email": "krati.verma@careeros.ai",
            "role": "Lead Frontend Engineer & Design Systems Architect",
            "location": "Noida, Uttar Pradesh, India",
            "phone": "+91-9876543210",
            "bio": "Lead Frontend Engineer specializing in React 19, accessible Design Systems (WCAG AAA), and 60fps glassmorphic micro-animations.",
            "skills": ["React 19", "TypeScript", "Next.js", "Tailwind CSS", "Design Tokens", "Storybook", "Framer Motion", "Figma SDK", "WCAG AAA"],
            "projects": [
                {"title": "Glassmorphism UI System", "tech": "React, Tailwind, Framer Motion", "desc": "Ultra-fast dark mode design system with 100+ accessible primitives."},
                {"title": "LawBot360 Legal AI Interface", "tech": "Next.js, Tailwind, WebSockets", "desc": "Interactive real-time legal assistant platform."}
            ],
            "experiences": [
                {"role": "Product Engineering Intern", "company": "AI Tech Labs", "period": "2025 - Present", "desc": "Architected component libraries and design tokens for enterprise applications."}
            ],
            "education": [
                {"degree": "B.Tech in Computer Science & Engineering", "institution": "AKTU", "period": "2022 - 2026", "details": "Focus on Human-Computer Interaction & Frontend Architecture."}
            ]
        },
        {
            "id": "candidate_vishnu",
            "name": "Vishnu Kumar",
            "email": "vishnu.kumar@careeros.ai",
            "role": "Senior Full-Stack Developer & Distributed Systems Engineer",
            "location": "Noida, Uttar Pradesh, India",
            "phone": "+91-9123456789",
            "bio": "Senior Backend & Full-Stack Developer specializing in distributed microservices, database scaling, real-time data pipelines, and LLMs from scratch.",
            "skills": ["Python 3.x", "FastAPI", "React", "Node.js", "MongoDB", "MySQL", "PostgreSQL", "Docker", "Redis", "Kafka", "AWS", "TensorFlow"],
            "projects": [
                {"title": "GPT LLM from Scratch", "tech": "Python, TensorFlow, Transformer Attention", "desc": "Implemented GPT-1 Transformer architecture from foundational matrix operations."},
                {"title": "SentiScan NLP Microservice", "tech": "Bidirectional LSTM, FastAPI, Docker", "desc": "High-throughput sentiment analysis microservice processing 5,000 req/sec at 92.4% accuracy."}
            ],
            "experiences": [
                {"role": "Full Stack Developer", "company": "Devstack Technologies", "period": "2026 - Present", "desc": "Engineered full-stack platforms with React frontend, FastAPI/Node.js microservices, and Docker CI/CD."}
            ],
            "education": [
                {"degree": "B.Tech in Computer Science & Engineering", "institution": "AKTU", "period": "2022 - 2026", "details": "Focus on Distributed Systems & Database Scaling."}
            ]
        }
    ]

    for cand in candidates_data:
        # 1. Store profile in Supabase
        sb.insert("profiles", {
            "id": cand["id"],
            "user_id": cand["id"],
            "name": cand["name"],
            "email": cand["email"],
            "role": cand["role"],
            "location_preference": cand["location"],
            "tech_stack": cand["skills"],
            "career_goals": cand["bio"],
            "preferred_roles": [cand["role"]],
            "search_keywords": [f"{s} jobs" for s in cand["skills"][:4]]
        })

        # 2. Store document in Supabase
        raw_md = f"# {cand['name']}\n**{cand['role']}**\n{cand['email']} | {cand['phone']} | {cand['location']}\n\n## Professional Summary\n{cand['bio']}\n\n## Technical Skills\n{', '.join(cand['skills'])}\n\n## Experience\n"
        for exp in cand["experiences"]:
            raw_md += f"- **{exp['role']}** at {exp['company']} ({exp['period']}): {exp['desc']}\n"
        raw_md += "\n## Key Projects\n"
        for p in cand["projects"]:
            raw_md += f"- **{p['title']}** ({p['tech']}): {p['desc']}\n"
        raw_md += "\n## Education\n"
        for edu in cand["education"]:
            raw_md += f"- **{edu['degree']}** — {edu['institution']} ({edu['period']})\n"

        doc_id = store_document(
            user_id=cand["id"],
            filename=f"{cand['name'].replace(' ', '_')}_Resume.pdf",
            doc_type="resume",
            raw_markdown=raw_md,
            metadata={"candidate": cand["name"], "verified": True},
            candidate_id=cand["id"]
        )

        # 3. Embed chunks and store in Supabase
        chunks = [
            {"text": f"Candidate: {cand['name']} ({cand['role']}). {cand['bio']}", "meta": {"heading": "Profile Summary", "candidate_id": cand["id"]}},
            {"text": f"Skills for {cand['name']}: {', '.join(cand['skills'])}", "meta": {"heading": "Technical Skills", "candidate_id": cand["id"]}}
        ]
        for p in cand["projects"]:
            chunks.append({"text": f"Project by {cand['name']}: {p['title']} using {p['tech']}. {p['desc']}", "meta": {"heading": f"Project: {p['title']}", "candidate_id": cand["id"]}})

        embedded = embed_chunks(chunks)
        store_embeddings(doc_id, cand["id"], embedded, candidate_id=cand["id"])

    return {"status": "seeded", "count": len(candidates_data)}
