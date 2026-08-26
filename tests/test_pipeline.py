"""End-to-end testing for document processing, embedding, storage, and RAG retrieval."""

import os
from my_agent.tools.docling_tools import convert_document
from my_agent.tools.embedding_tools import embed_text, embed_chunks
from my_agent.tools.db_tools import store_document, store_embeddings
from my_agent.tools.knowledge_tools import search_knowledge_base, get_rag_context


def test_document_to_rag_pipeline():
    print("=== Testing Full Ingestion & RAG Pipeline ===")
    
    # 1. Create sample test resume file
    test_file = "/tmp/test_candidate_resume.txt"
    sample_text = """# John Doe - Senior Backend & Cloud Engineer
Email: john.doe@example.com | Phone: +1-555-0199
Location: San Francisco, CA

## Professional Summary
Experienced Software Engineer with 6+ years building distributed cloud systems using Python, FastAPI, React, PostgreSQL, and Kubernetes. Led machine learning infrastructure scaling to 10M DAU.

## Skills
- Programming: Python, TypeScript, Go, SQL, Bash
- Frameworks: FastAPI, React, Next.js, PyTorch
- Databases & Vector: PostgreSQL, Supabase, pgvector, Redis
- Cloud & DevOps: Docker, Kubernetes, AWS, Terraform, CI/CD

## Work Experience
### Senior Backend Engineer - CloudScale Inc (2022 - Present)
- Designed microservices architecture reducing API latency by 45%.
- Implemented RAG pipeline with pgvector handling 50,000 queries daily.
- Managed team of 4 engineers and optimized AWS cloud spending by $120k/yr.

### Software Engineer - DataTech Solutions (2019 - 2022)
- Built RESTful APIs using Python FastAPI and React frontend dashboards.
- Integrated automated PDF extraction and OCR data ingestion pipelines.
"""
    with open(test_file, "w", encoding="utf-8") as f:
        f.write(sample_text)

    # Step 1: Convert document
    doc_res = convert_document(test_file)
    assert doc_res["status"] == "success"
    assert doc_res["chunk_count"] > 0
    print(f"  Step 1 ✅ Converted document into {doc_res['chunk_count']} chunks")

    # Step 2: Store document
    doc_id = store_document(
        user_id="test-user-101",
        filename="test_candidate_resume.txt",
        doc_type="resume",
        raw_markdown=doc_res["markdown"],
        metadata={"chunk_count": doc_res["chunk_count"]}
    )
    assert doc_id is not None
    print(f"  Step 2 ✅ Document record stored with ID: {doc_id}")

    # Step 3: Embed chunks
    embedded = embed_chunks(doc_res["chunks"])
    assert all("embedding" in c for c in embedded)
    assert all(len(c["embedding"]) == 768 for c in embedded)
    print(f"  Step 3 ✅ Generated 768d embeddings for {len(embedded)} chunks")

    # Step 4: Store embeddings
    stored_count = store_embeddings(doc_id, "test-user-101", embedded)
    assert stored_count == len(embedded)
    print(f"  Step 4 ✅ Stored {stored_count} embedding vectors")

    # Step 5: Perform RAG Search & Context Retrieval
    query = "Python FastAPI and RAG pgvector experience"
    results = search_knowledge_base(query, user_id="test-user-101", top_k=3)
    assert len(results) > 0, "RAG search should return matching chunks"
    print(f"  Step 5 ✅ RAG Search returned {len(results)} matches (Top similarity: {results[0]['similarity']})")

    context = get_rag_context(query, user_id="test-user-101")
    assert "FastAPI" in context or "RAG" in context or "Python" in context
    print("  Step 6 ✅ Built RAG LLM Context Prompt cleanly")

    # Cleanup
    if os.path.exists(test_file):
        os.remove(test_file)

    print("🎉 FULL INGESTION & RAG PIPELINE TEST PASSED!")


if __name__ == "__main__":
    test_document_to_rag_pipeline()
