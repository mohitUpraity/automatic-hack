import json
import sqlite3
import os

from my_agent.tools.db_tools import store_document, store_embeddings, store_to_db, read_from_db
from my_agent.tools.resume_tools import extract_resume
from my_agent.tools.semantic_matcher import rank_and_match_opportunities_semantically
from api import CANDIDATES_REGISTRY, CURATED_CANDIDATE_OPPORTUNITIES, get_all_opportunities, get_knowledge_graph, extract_social_links_from_text

USER_ID = "google_1082736452918273"

sample_resume = """# Mohit Prasad Upraity
**Autonomous Agentic AI Engineer & System Architect**
mohit9568ai@gmail.com | Noida, Uttar Pradesh, India | +91-9568000000

## Professional Summary
System architect specialized in multi-agent orchestration, Graph RAG, vector embeddings, and autonomous high-throughput architectures.

## Technical Skills
- **Languages & Frameworks**: Python, FastAPI, React, Next.js, TypeScript, PyTorch, LangChain, LiteLLM
- **AI & Data Systems**: Graph RAG, Vector Search, ChromaDB, PostgreSQL, pgvector, Docling OCR, Firecrawl
- **Architecture**: Distributed Systems, Microservices, REST APIs, WebSockets, Docker, Kubernetes

## Projects
- **CareerOS Multi-Agent Hub**: Autonomous career intelligence platform orchestrating OCR, Graph RAG, and LLM tailoring.
- **IntelliGuard NGFW**: Next-generation firewall with high-throughput packet inspection and ML anomaly detection.
- **Wearable Gait IoT**: Sensor fusion system for Parkinsonian tremor and gait stability tracking.

## Experience
- **Lead AI Architect** at CareerOS (2024 - Present): Engineered autonomous agents for vector resume tailoring and real-time opportunity discovery.
- **Research Fellow** at DRDO (2023 - 2024): Developed next-generation packet inspection pipelines and high-throughput security tools.

## Education
- **B.Tech in Computer Science & Engineering** at Dr. APJ Abdul Kalam Technical University (2020 - 2024)
"""

print(f"--- 1. Testing Document Storage & Entity Extraction for {USER_ID} ---", flush=True)
doc_id = store_document(
    user_id=USER_ID,
    filename="Mohit_Resume.md",
    doc_type="resume",
    raw_markdown=sample_resume,
    metadata={"chunk_count": 4, "is_uploaded": True}
)
print("Stored Doc ID:", doc_id, flush=True)

extracted_resume = extract_resume(sample_resume)
social_links = extract_social_links_from_text(sample_resume)

skills_list = extracted_resume.get("skills", [])
proj_list = extracted_resume.get("projects", [])
exp_list = extracted_resume.get("experience", [])
edu_list = extracted_resume.get("education", [])
certs_list = extracted_resume.get("certifications", [])
cand_name = extracted_resume.get("name") or "Mohit Prasad Upraity"
cand_email = extracted_resume.get("email") or "mohit9568ai@gmail.com"

print(f"Extracted Name: {cand_name}", flush=True)
print(f"Extracted Skills ({len(skills_list)}): {skills_list[:6]}", flush=True)
print(f"Extracted Projects ({len(proj_list)}): {proj_list}", flush=True)
print(f"Extracted Experiences ({len(exp_list)}): {exp_list}", flush=True)

prof_payload = {
    "user_id": USER_ID,
    "name": cand_name,
    "role": "Autonomous Agentic AI Engineer & System Architect",
    "email": cand_email,
    "phone": "+91-9568000000",
    "location": "Noida, Uttar Pradesh, India",
    "skills": json.dumps(skills_list),
    "projects": json.dumps(proj_list),
    "experiences": json.dumps(exp_list),
    "education": json.dumps(edu_list),
    "raw_markdown": sample_resume
}
store_to_db("profiles", prof_payload)
print("Saved profile to DB successfully!", flush=True)

print(f"\n--- 2. Testing get_all_opportunities for {USER_ID} ---", flush=True)
opps_data = get_all_opportunities(candidate_id=USER_ID)
opps = opps_data.get("opportunities", [])
print(f"Total Opportunities Matched: {len(opps)}", flush=True)
for o in opps[:3]:
    print(f"  - [{o.get('relevance_score')}% fit] {o.get('title')} @ {o.get('company')} (Cosine: {o.get('semantic_cosine_similarity')})", flush=True)

print(f"\n--- 3. Testing get_knowledge_graph for {USER_ID} ---", flush=True)
import asyncio
kg_data = asyncio.run(get_knowledge_graph(user_id=USER_ID))
nodes = kg_data.get("nodes", [])
edges = kg_data.get("edges", [])
print(f"Total Nodes: {len(nodes)}, Total Edges: {len(edges)}", flush=True)

node_breakdown = {}
for n in nodes:
    g = n.get("group", "other")
    node_breakdown[g] = node_breakdown.get(g, 0) + 1
print("Node Breakdown:", node_breakdown, flush=True)

print("\n🎉 COMPLETE PIPELINE END-TO-END VERIFIED!")
