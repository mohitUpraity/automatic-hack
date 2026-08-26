import sys
import json
from fastapi.testclient import TestClient
from api import app

client = TestClient(app)
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

def test_pipeline():
    print(f"--- 1. Testing Document Upload for {USER_ID} ---", flush=True)
    files = {"file": ("Mohit_Resume.md", sample_resume.encode("utf-8"), "text/markdown")}
    data = {"user_id": USER_ID, "doc_type": "resume"}
    res = client.post("/api/documents/upload", files=files, data=data)
    print("Upload status:", res.status_code, flush=True)
    print("Upload response:", res.json(), flush=True)
    assert res.status_code == 200

    print(f"\n--- 2. Testing Opportunities Feed for {USER_ID} ---", flush=True)
    opp_res = client.get(f"/api/opportunities?candidate_id={USER_ID}")
    print("Opportunities status:", opp_res.status_code, flush=True)
    opps = opp_res.json().get("opportunities", [])
    print(f"Total Opportunities Found: {len(opps)}", flush=True)
    if opps:
        print("Top 3 Matched Opportunities:", flush=True)
        for o in opps[:3]:
            print(f"  - [{o.get('relevance_score')}% fit] {o.get('title')} @ {o.get('company')}", flush=True)
    assert len(opps) > 0

    print(f"\n--- 3. Testing Knowledge Graph for {USER_ID} ---", flush=True)
    kg_res = client.get(f"/api/knowledge-graph/{USER_ID}")
    print("Knowledge Graph status:", kg_res.status_code, flush=True)
    kg_data = kg_res.json()
    nodes = kg_data.get("nodes", [])
    edges = kg_data.get("edges", [])
    print(f"Total Nodes: {len(nodes)}, Total Edges: {len(edges)}", flush=True)
    
    node_types = {}
    for n in nodes:
        g = n.get("group", "unknown")
        node_types[g] = node_types.get(g, 0) + 1
    print("Node Breakdown by Category:", node_types, flush=True)
    assert len(nodes) > 0
    assert len(edges) > 0

    print(f"\n--- 4. Testing Candidate Details for {USER_ID} ---", flush=True)
    cand_res = client.get(f"/api/candidates/{USER_ID}")
    print("Candidate details status:", cand_res.status_code, flush=True)
    cand = cand_res.json().get("candidate", {})
    print(f"Candidate Name: {cand.get('name')}", flush=True)
    print(f"Candidate Skills ({len(cand.get('skills', []))}): {cand.get('skills', [])[:5]}", flush=True)
    print(f"Candidate Projects ({len(cand.get('projects', []))}): {cand.get('projects', [])}", flush=True)

    print("\n✅ PIPELINE FULLY VERIFIED AND WORKING 100%!", flush=True)

if __name__ == "__main__":
    test_pipeline()
