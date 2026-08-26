"""Automated verification test for the Autonomous Career & Resume Studio Pipeline."""

import os
import sys
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import app
from my_agent.tools.autopilot_tools import run_career_autopilot, refine_resume_markdown

SAMPLE_RESUME = """
# Samantha Reed
Senior Full Stack & AI Engineer | San Francisco, CA | samantha@example.com | 555-0199

## Summary
Experienced software engineer specializing in scalable web systems, React, Python, and generative AI agents.

## Experience
- Senior Software Engineer at TechVelocity (2022 - Present)
  - Built high-performance backend microservices in FastAPI and PostgreSQL.
  - Implemented multi-agent workflow systems with real-time UI dashboards in React.
- Software Engineer at DataStream (2020 - 2022)
  - Developed REST APIs and cloud infrastructure on AWS.

## Skills
Python, TypeScript, React, Next.js, FastAPI, PostgreSQL, Docker, Kubernetes, PyTorch, LLM Agents

## Education
B.S. Computer Science, UC Berkeley, 2020
"""


def test_autopilot_direct():
    print("\n--- Testing run_career_autopilot Direct ---")
    res = run_career_autopilot(
        input_type="text",
        input_value=SAMPLE_RESUME,
        user_id="test-autopilot-user",
        target_categories=["job", "hackathon", "competition"]
    )
    assert res["status"] == "success"
    assert res.get("profile_id") is not None
    assert res.get("total_scouted", 0) > 0
    assert len(res.get("timeline_steps", [])) >= 5
    print(f"✓ Direct Autopilot passed: Found {res['total_scouted']} opportunities, generated {len(res.get('tailored_resumes', []))} tailored resumes.")


def test_resume_refinement_direct():
    print("\n--- Testing refine_resume_markdown Direct ---")
    res = refine_resume_markdown(
        resume_markdown=SAMPLE_RESUME,
        action="ats_optimize",
        context="Senior AI Engineer at OpenAI",
        user_id="test-refine-user"
    )
    assert res["status"] == "success"
    assert "refined_markdown" in res
    assert len(res["refined_markdown"]) > 100
    assert res.get("ats_score", 0) >= 90
    print(f"✓ Direct Resume Refinement passed: ATS score {res.get('ats_score')}")


def test_api_endpoints():
    print("\n--- Testing FastAPI Automation Endpoints ---")
    client = TestClient(app)

    # 1. Test Custom Search
    res_search = client.post("/api/opportunities/custom-search", json={
        "query": "React AI Engineer",
        "category": "job"
    })
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert search_data["status"] == "success"
    assert len(search_data.get("opportunities", [])) > 0
    print(f"✓ /api/opportunities/custom-search passed with {len(search_data['opportunities'])} results.")

    # 2. Test Resume Refine Endpoint
    res_refine = client.post("/api/resume/refine", json={
        "resume_markdown": SAMPLE_RESUME,
        "action": "quantify_metrics",
        "context": "Fintech Senior Engineer"
    })
    assert res_refine.status_code == 200
    refine_data = res_refine.json()
    assert refine_data["status"] == "success"
    assert "refined_markdown" in refine_data
    print("✓ /api/resume/refine passed.")

    # 3. Test Download PDF Endpoint
    res_pdf = client.post("/api/resume/download-pdf", json={
        "markdown": SAMPLE_RESUME
    })
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert len(res_pdf.content) > 100
    print(f"✓ /api/resume/download-pdf passed ({len(res_pdf.content)} bytes).")

    # 4. Test Autopilot API Endpoint
    res_auto = client.post("/api/autopilot/run", json={
        "input_type": "text",
        "input_value": SAMPLE_RESUME,
        "categories": ["job", "competition"]
    })
    assert res_auto.status_code == 200
    auto_data = res_auto.json()
    assert auto_data["status"] == "success"
    print(f"✓ /api/autopilot/run passed: profile_id={auto_data.get('profile_id')}.")


if __name__ == "__main__":
    test_autopilot_direct()
    test_resume_refinement_direct()
    test_api_endpoints()
    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
