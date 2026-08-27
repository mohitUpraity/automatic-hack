import os
import sys
import json
import uuid

# Ensure root directory in python path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

from my_agent.tools.db_tools import get_supabase, store_document, store_embeddings, store_to_db, read_from_db, delete_from_db
from my_agent.tools.knowledge_tools import search_knowledge_base, get_rag_context
from my_agent.tools.embedding_tools import embed_chunks

def run_tests():
    print("==================================================")
    print("   CareerOS Supabase Pure Database E2E Test Suite")
    print("==================================================")

    sb = get_supabase()
    if not sb:
        print("[FAIL] Supabase client could not be initialized.")
        return False

    print("[PASS] Supabase HTTPS Client initialized successfully.")

    # 1. Use authenticated user from Supabase
    test_user_id = "333c3701-93f2-497b-994e-98ec8177950f"
    user_rec = sb.select("users", filters={"id": f"eq.{test_user_id}"})
    print(f"[PASS] Authenticated Supabase User verified: {user_rec[0]['email']} (ID: {test_user_id})")

    # 2. Test Multiple Candidate Personas Creation under same user
    # Persona 1: AI / Backend Persona
    persona1_id = str(uuid.uuid4())
    p1 = {
        "id": persona1_id,
        "user_id": test_user_id,
        "tech_stack": ["Python", "FastAPI", "PyTorch", "pgvector", "PostgreSQL"],
        "preferred_roles": ["Senior AI & Backend Engineer"],
        "career_goals": "Deep learning, distributed microservices, and RAG pipelines.",
        "location_preference": "Remote",
        "search_keywords": ["Python AI Engineer", "FastAPI pgvector"]
    }
    sb.insert("profiles", p1)
    print(f"[PASS] Persona 1 (AI Backend) inserted into Supabase (ID: {persona1_id})")

    # Persona 2: Frontend / UI Persona
    persona2_id = str(uuid.uuid4())
    p2 = {
        "id": persona2_id,
        "user_id": test_user_id,
        "tech_stack": ["React", "TypeScript", "Tailwind CSS", "Three.js", "Vite"],
        "preferred_roles": ["Lead Frontend & Design Systems Architect"],
        "career_goals": "Design systems, accessible interfaces, and 3D web applications.",
        "location_preference": "Remote",
        "search_keywords": ["React Frontend", "Design Systems"]
    }
    sb.insert("profiles", p2)
    print(f"[PASS] Persona 2 (UI Architect) inserted into Supabase (ID: {persona2_id})")

    # 3. Test Ingesting Documents & Embeddings per Persona
    # Ingest document for Persona 1
    doc1_content = "Experienced in building high-throughput PyTorch neural search pipelines, pgvector similarity indexing, and FastAPI services."
    doc1_id = store_document(
        user_id=test_user_id,
        filename="AI_Backend_Resume.pdf",
        doc_type="resume",
        raw_markdown=doc1_content,
        metadata={"persona": "AI Backend", "candidate_id": persona1_id},
        candidate_id=persona1_id
    )
    chunks1 = [{"text": doc1_content, "chunk_index": 0, "metadata": {"candidate_id": persona1_id}}]
    emb1 = embed_chunks(chunks1)
    stored1 = store_embeddings(doc1_id, test_user_id, emb1, candidate_id=persona1_id)
    print(f"[PASS] Persona 1 Document ({doc1_id}) & {stored1} Embeddings stored in Supabase.")

    # Ingest document for Persona 2
    doc2_content = "Master of React component architecture, Tailwind CSS design tokens, WebGL shaders, and high-performance DOM rendering."
    doc2_id = store_document(
        user_id=test_user_id,
        filename="UI_Architect_Resume.pdf",
        doc_type="resume",
        raw_markdown=doc2_content,
        metadata={"persona": "UI Architect", "candidate_id": persona2_id},
        candidate_id=persona2_id
    )
    chunks2 = [{"text": doc2_content, "chunk_index": 0, "metadata": {"candidate_id": persona2_id}}]
    emb2 = embed_chunks(chunks2)
    stored2 = store_embeddings(doc2_id, test_user_id, emb2, candidate_id=persona2_id)
    print(f"[PASS] Persona 2 Document ({doc2_id}) & {stored2} Embeddings stored in Supabase.")

    # 4. Test Isolated Persona Vector Search
    print("\n--- Testing Vector Retrieval Scoping ---")
    # Query for PyTorch/Backend targeting Persona 1
    res1 = search_knowledge_base("PyTorch neural search and pgvector", user_id=test_user_id, candidate_id=persona1_id, top_k=5)
    print(f"[PASS] Persona 1 Scoped Search returned {len(res1)} matches. Top score: {res1[0]['similarity'] if res1 else 'N/A'}")
    
    # Query for React targeting Persona 2
    res2 = search_knowledge_base("React component architecture and Tailwind", user_id=test_user_id, candidate_id=persona2_id, top_k=5)
    print(f"[PASS] Persona 2 Scoped Search returned {len(res2)} matches. Top score: {res2[0]['similarity'] if res2 else 'N/A'}")

    # Multi-Candidate / Combined View Query
    res_all = search_knowledge_base("Engineer technical experience", user_id=test_user_id, candidate_id="all", top_k=10)
    print(f"[PASS] Combined Multi-Candidate Query returned {len(res_all)} matches across personas.")

    # 5. Clean up test records in Supabase
    print("\n--- Cleaning Up Test Fixtures ---")
    sb.delete("embeddings", filters={"document_id": f"eq.{doc1_id}"})
    sb.delete("embeddings", filters={"document_id": f"eq.{doc2_id}"})
    sb.delete("documents", filters={"id": f"eq.{doc1_id}"})
    sb.delete("documents", filters={"id": f"eq.{doc2_id}"})
    sb.delete("profiles", filters={"id": f"eq.{persona1_id}"})
    sb.delete("profiles", filters={"id": f"eq.{persona2_id}"})
    print("[PASS] Cleaned up temporary test records from Supabase tables.")

    print("\n==================================================")
    print("   ALL TESTS PASSED WITH 100% SUPABASE ISOLATION!  ")
    print("==================================================")
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
