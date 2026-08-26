#!/usr/bin/env bash
# Shell test script for FastAPI CareerOS v3 Document Upload & RAG Search

API_URL="http://127.0.0.1:8000"

echo "=== CareerOS v3 API Server Upload Test ==="

# 1. Test root endpoint
echo "1. Checking Root API Status..."
curl -s "${API_URL}/" | grep -q "CareerOS v3" && echo "  ✅ Root endpoint responsive" || echo "  ❌ Server offline"

# 2. Test Document Upload (Multi-part form)
echo "2. Uploading Sample Resume Document..."
UPLOAD_RES=$(curl -s -X POST "${API_URL}/api/documents/upload" \
  -F "file=@tests/fixtures/sample_resume.txt" \
  -F "doc_type=resume")

echo "Response: $UPLOAD_RES"

# 3. Test Knowledge Search
echo "3. Querying Knowledge Base RAG Search..."
SEARCH_RES=$(curl -s -X POST "${API_URL}/api/knowledge/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "Python developer skills", "top_k": 3}')

echo "Response: $SEARCH_RES"

# 4. Test Resume Tailoring
echo "4. Testing Resume Tailoring Endpoint..."
TAILOR_RES=$(curl -s -X POST "${API_URL}/api/tailor" \
  -H "Content-Type: application/json" \
  -d '{"opportunity_title": "Backend Engineer", "company_name": "TechCorp", "requirements": "Python, FastAPI, Postgres"}')

echo "Response: $TAILOR_RES"

echo "🎉 API ENDPOINT TESTS COMPLETED!"
