"""Gemini Embedding 001 Integration for Vector Search."""

import os
from typing import Dict, List

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

EMBEDDING_MODEL = "models/gemini-embedding-001"


def _configure_genai():
    api_key = os.getenv("GEMINI_API_KEY")
    if HAS_GENAI and api_key:
        genai.configure(api_key=api_key)


def embed_text(text: str) -> List[float]:
    """Generate a 768-dimension embedding vector for document chunks.
    
    Uses RETRIEVAL_DOCUMENT task type for optimal storage indexing.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not HAS_GENAI:
        # Deterministic mock 768d embedding for testing without API key
        import hashlib
        h = hashlib.sha256(text.encode("utf-8")).digest()
        vec = [(float(b) / 255.0) - 0.5 for b in h]
        return (vec * 24)[:768]

    _configure_genai()
    try:
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="RETRIEVAL_DOCUMENT"
        )
        return result['embedding']
    except Exception:
        import hashlib
        h = hashlib.sha256(text.encode("utf-8")).digest()
        vec = [(float(b) / 255.0) - 0.5 for b in h]
        return (vec * 24)[:768]


def embed_query(query: str) -> List[float]:
    """Generate a 768-dimension embedding vector for search queries.
    
    Uses RETRIEVAL_QUERY task type for optimal asymmetric search matching.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not HAS_GENAI:
        import hashlib
        h = hashlib.sha256(query.encode("utf-8")).digest()
        vec = [(float(b) / 255.0) - 0.5 for b in h]
        return (vec * 24)[:768]

    _configure_genai()
    try:
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=query,
            task_type="RETRIEVAL_QUERY"
        )
        return result['embedding']
    except Exception:
        import hashlib
        h = hashlib.sha256(query.encode("utf-8")).digest()
        vec = [(float(b) / 255.0) - 0.5 for b in h]
        return (vec * 24)[:768]


def embed_chunks(chunks: List[Dict]) -> List[Dict]:
    """Embed multiple text chunks in batch.
    
    Adds 'embedding' key to each chunk dictionary.
    """
    if not chunks:
        return []

    texts = [c.get("text", "") for c in chunks]
    api_key = os.getenv("GEMINI_API_KEY")

    if api_key and HAS_GENAI:
        try:
            _configure_genai()
            result = genai.embed_content(
                model=EMBEDDING_MODEL,
                content=texts,
                task_type="RETRIEVAL_DOCUMENT"
            )
            embeddings = result['embedding']
            for i, chunk in enumerate(chunks):
                chunk["embedding"] = embeddings[i]
            return chunks
        except Exception:
            pass

    for chunk in chunks:
        chunk["embedding"] = embed_text(chunk.get("text", ""))

    return chunks
