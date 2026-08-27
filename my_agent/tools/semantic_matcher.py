"""High-Performance Semantic Similarity Vector Retrieval Engine for Multi-Candidate Opportunity Matching."""

import json
import math
import os
import re
from typing import Any, Dict, List, Optional, Tuple

# Vector embedding dimension
EMBEDDING_DIM = 768

# In-memory candidate embedding cache
_CANDIDATE_EMBEDDING_CACHE: Dict[str, List[float]] = {}


def _clean_text_tokens(text: str) -> List[str]:
    """Tokenizes and cleans text for semantic n-gram and term frequency vectorization."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\+\#\.\s]', ' ', text)
    tokens = [t.strip() for t in text.split() if len(t.strip()) > 1]
    return tokens


def _build_semantic_vector(text: str, dim: int = EMBEDDING_DIM) -> List[float]:
    """Generates a dense, normalized semantic feature vector.
    
    Combines character/word n-gram hashing, semantic domain weighting, and cosine projection.
    If GEMINI_API_KEY is active and reachable, leverages Google Gemini 768d embeddings.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            res = genai.embed_content(
                model="models/gemini-embedding-001",
                content=text,
                task_type="RETRIEVAL_QUERY"
            )
            emb = res.get("embedding")
            if emb and len(emb) == dim:
                # Normalize vector
                norm = math.sqrt(sum(x * x for x in emb))
                return [x / (norm + 1e-9) for x in emb]
        except Exception:
            pass

    # Dense semantic TF-IDF hashing projection with domain-specific dimensional weights
    vec = [0.0] * dim
    tokens = _clean_text_tokens(text)
    if not tokens:
        return vec

    # Semantic domain term boosts
    domain_weights = {
        # Backend & Distributed Systems (Vishnu Cluster)
        "backend": 2.5, "fastapi": 3.0, "django": 3.0, "postgresql": 3.0, "postgres": 3.0,
        "distributed": 3.0, "microservices": 2.5, "redis": 2.5, "kafka": 3.0, "database": 2.0,
        "sharding": 3.0, "replication": 2.5, "concurrency": 2.5, "grpc": 2.5, "docker": 2.0,
        "stripe": 2.5, "aws": 2.5, "cloud": 2.0, "sql": 2.0, "rest": 1.5, "api": 1.5,
        "throughput": 2.5, "scalability": 2.5, "idempotency": 3.0,

        # Frontend & Design Systems (Krati Cluster)
        "frontend": 2.5, "react": 3.0, "typescript": 3.0, "nextjs": 3.0, "tailwind": 3.0,
        "figma": 3.0, "ui": 2.5, "ux": 2.5, "design": 2.5, "wcag": 3.0, "accessibility": 2.5,
        "storybook": 3.0, "framer": 3.0, "motion": 2.5, "canvas": 2.5, "components": 2.0,
        "glassmorphism": 3.0, "microanimations": 3.0, "vercel": 2.5, "linear": 2.5, "css": 2.0,

        # AI/ML, Computer Vision & Wearables (Mohit Cluster)
        "ai": 2.5, "ml": 2.5, "pytorch": 3.0, "tensorflow": 3.0, "opencv": 3.0,
        "vision": 3.0, "wearables": 3.0, "gait": 3.0, "sensors": 2.5, "iot": 3.0,
        "drdo": 3.0, "ngfw": 3.0, "firewall": 3.0, "cybersecurity": 2.5, "deep": 2.0,
        "learning": 2.0, "rag": 2.5, "llms": 2.5, "anomaly": 2.5, "hcl": 2.5, "hackathon": 2.0
    }

    # 1. Unigram feature hashing
    for i, token in enumerate(tokens):
        weight = domain_weights.get(token, 1.0)
        # Position weight
        pos_decay = 1.0 / (1.0 + 0.005 * i)
        val = weight * pos_decay
        
        # Hash to multiple buckets (Bloom feature spread)
        h1 = (hash(token) & 0x7fffffff) % dim
        h2 = ((hash(token + "_alt") ^ 0x5bd1e995) & 0x7fffffff) % dim
        h3 = ((hash(token + "_proj") * 31) & 0x7fffffff) % dim
        
        vec[h1] += val * 1.0
        vec[h2] += val * 0.7
        vec[h3] += val * 0.5

    # 2. Bigram feature hashing
    for i in range(len(tokens) - 1):
        bigram = f"{tokens[i]}_{tokens[i+1]}"
        b_weight = 1.8
        if tokens[i] in domain_weights or tokens[i+1] in domain_weights:
            b_weight = 2.8
        h_bi = (hash(bigram) & 0x7fffffff) % dim
        vec[h_bi] += b_weight

    # 3. L2 Unit Normalization
    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]

    return vec


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculates dot product cosine similarity between two unit-normalized float vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    return max(0.0, min(1.0, dot))


def build_candidate_semantic_doc(candidate: Dict[str, Any]) -> str:
    """Constructs a dense semantic text representation of candidate skills, resume, and projects."""
    if not isinstance(candidate, dict):
        return ""

    parts = [
        str(candidate.get("name") or ""),
        str(candidate.get("role") or ""),
        str(candidate.get("summary") or ""),
        " ".join([str(s) for s in candidate.get("skills", []) if s]),
        " ".join([str(s) for s in candidate.get("top_skills", []) if s])
    ]
    for p in candidate.get("projects", []):
        if isinstance(p, dict):
            parts.append(f"{p.get('title') or ''} {p.get('desc') or ''} {p.get('tech') or ''}")
    for exp in candidate.get("experiences", []):
        if isinstance(exp, dict):
            parts.append(f"{exp.get('role') or ''} {exp.get('company') or ''} {exp.get('desc') or ''}")
    for ach in candidate.get("achievements", []):
        if isinstance(ach, dict):
            parts.append(f"{ach.get('title') or ''} {ach.get('desc') or ''}")
    
    resume_md = candidate.get("resume_markdown")
    if resume_md and isinstance(resume_md, str):
        parts.append(resume_md[:1200])

    # Filter out empty or None strings safely
    return " ".join([str(p) for p in parts if p is not None and str(p).strip()])


def build_opportunity_semantic_doc(opp: Dict[str, Any]) -> str:
    """Constructs a dense semantic text representation of an opportunity."""
    if not isinstance(opp, dict):
        return ""

    parts = [
        str(opp.get("title") or ""),
        str(opp.get("company") or opp.get("company_name") or ""),
        str(opp.get("category") or ""),
        str(opp.get("location") or ""),
        str(opp.get("description") or ""),
        str(opp.get("skills_required") or "")
    ]
    reqs = opp.get("requirements", [])
    if isinstance(reqs, list):
        parts.append(" ".join([str(r) for r in reqs if r]))
    elif reqs:
        parts.append(str(reqs))

    intel = opp.get("intelligence") or opp.get("company_intel") or {}
    if isinstance(intel, dict):
        parts.append(str(intel.get("overview") or ""))
        parts.append(str(intel.get("engineering_culture") or ""))
        parts.append(" ".join([str(t) for t in intel.get("tech_stack", []) if t]))
        parts.append(" ".join([str(k) for k in intel.get("ats_keywords", []) if k]))

    # Filter out empty or None strings safely
    return " ".join([str(p) for p in parts if p is not None and str(p).strip()])


def get_candidate_vector(candidate_id: str, candidate_data: Dict[str, Any]) -> List[float]:
    """Retrieves or calculates normalized semantic vector for a candidate."""
    if candidate_id in _CANDIDATE_EMBEDDING_CACHE:
        return _CANDIDATE_EMBEDDING_CACHE[candidate_id]
    
    doc_text = build_candidate_semantic_doc(candidate_data)
    vec = _build_semantic_vector(doc_text)
    _CANDIDATE_EMBEDDING_CACHE[candidate_id] = vec
    return vec


def rank_and_match_opportunities_semantically(
    opportunities: List[Dict[str, Any]],
    candidates_registry: Dict[str, Dict[str, Any]],
    target_candidate_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Performs true mathematical semantic vector retrieval and ranking.
    
    1. Computes dense vector embeddings for all candidates in the registry.
    2. For each opportunity, computes vector embedding and calculates cosine similarity across candidates.
    3. Identifies the optimal candidate cluster (highest cosine similarity).
    4. When target_candidate_id is specified (e.g. 'candidate_vishnu'), filters to that candidate's
       semantically matched opportunities and ranks by exact cosine similarity.
    """
    if not opportunities:
        return []

    # 1. Precompute candidate embeddings
    cand_vectors: Dict[str, List[float]] = {}
    for cid, cdata in candidates_registry.items():
        if cid == "candidate_all":
            continue
        cand_vectors[cid] = get_candidate_vector(cid, cdata)

    scored_opps = []

    for opp in opportunities:
        opp_text = build_opportunity_semantic_doc(opp)
        opp_vec = _build_semantic_vector(opp_text)

        # Calculate cosine similarity with each candidate
        best_cand = None
        best_sim = -1.0
        cand_sims: Dict[str, float] = {}

        for cid, cvec in cand_vectors.items():
            sim = cosine_similarity(cvec, opp_vec)
            cand_sims[cid] = sim
            if sim > best_sim:
                best_sim = sim
                best_cand = cid

        # Scale raw cosine similarity [0.15 .. 0.85+] to percentage fit [65 .. 99]
        normalized_fit = int(min(99, max(60, round(60 + (best_sim * 45)))))

        # Target candidate score if evaluating specific candidate
        if target_candidate_id and target_candidate_id in cand_sims:
            target_sim = cand_sims[target_candidate_id]
            target_fit = int(min(99, max(60, round(60 + (target_sim * 45)))))
        else:
            target_fit = normalized_fit

        item = dict(opp)
        item["relevance_score"] = target_fit if (target_candidate_id and target_candidate_id != "candidate_all") else normalized_fit
        item["matched_candidate_id"] = best_cand
        item["matched_candidate_name"] = candidates_registry.get(best_cand, {}).get("name", "Candidate")
        item["semantic_cosine_similarity"] = round(best_sim, 4)
        item["candidate_similarities"] = {k: round(v, 4) for k, v in cand_sims.items()}

        scored_opps.append(item)

    # 3. Filtering & Sorting
    if target_candidate_id and target_candidate_id != "candidate_all":
        target_cand_meta = candidates_registry.get(target_candidate_id, {})
        target_name = target_cand_meta.get("name", "Candidate")
        # Score each opportunity specifically against the target candidate's profile vector
        for o in scored_opps:
            target_sim = o.get("candidate_similarities", {}).get(target_candidate_id, 0.0)
            o["semantic_cosine_similarity"] = round(target_sim, 4)
            o["relevance_score"] = int(min(99, max(60, round(60 + (target_sim * 45)))))
            o["matched_candidate_id"] = target_candidate_id
            o["matched_candidate_name"] = target_name
        
        # Sort descending by the target candidate's exact semantic similarity
        scored_opps.sort(key=lambda x: x.get("semantic_cosine_similarity", 0), reverse=True)
        return scored_opps

    # Global view: Sort descending by fit score
    scored_opps.sort(key=lambda x: x.get("semantic_cosine_similarity", 0), reverse=True)
    return scored_opps
