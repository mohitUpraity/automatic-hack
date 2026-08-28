"""Test resume tailoring and PDF generation engine."""

import os
from my_agent.tools.tailor_tools import generate_tailored_pdf, tailor_resume_for_opportunity


def test_pdf_generation_from_markdown():
    print("=== Testing WeasyPrint / HTML PDF Generation ===")
    sample_md = """# Jane Doe
Email: jane.doe@example.com | Phone: +1-555-0188

## Professional Summary
Senior AI & Full-Stack Engineer with 5+ years experience building intelligent applications using Python, React, Supabase, and LLMs.

## Core Technical Competencies
- Languages: Python, JavaScript, TypeScript, SQL
- Frameworks: FastAPI, React, Vite, Node.js
- AI & Vector: Gemini API, LangChain, pgvector, PyTorch

## Experience
### Lead AI Engineer - Agentic AI Solutions (2022 - Present)
- Designed and deployed multi-agent governance system with cryptographic keypairs.
- Built RAG vector retrieval pipeline using pgvector and Gemini Embedding 001.

## Education
- B.S. Computer Science - Stanford University
"""
    output_pdf = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temp_uploads", "test_tailored_resume.pdf")
    res = generate_tailored_pdf(sample_md, output_pdf)
    assert res["status"] == "success"
    assert os.path.exists(res["pdf_path"])
    print(f"  ✅ PDF/HTML rendered successfully at: {res['pdf_path']} (Engine: {res['engine']})")


def test_full_tailoring_pipeline():
    print("=== Testing Full Tailoring Pipeline ===")
    res = tailor_resume_for_opportunity(
        opportunity_title="Senior Full-Stack AI Engineer",
        company_name="ArmorIQ Technologies",
        requirements="5+ years Python, React, pgvector, multi-agent governance, Supabase",
        user_id="test-user-202"
    )
    assert res["status"] == "success"
    assert "ArmorIQ Technologies" in res["company_name"]
    assert len(res["tailored_markdown"]) > 100
    assert os.path.exists(res["pdf_path"])
    print(f"  ✅ Resume tailored and rendered at: {res['pdf_path']}")


if __name__ == "__main__":
    test_pdf_generation_from_markdown()
    test_full_tailoring_pipeline()
    print("🎉 ALL RESUME TAILORING TESTS PASSED!")
