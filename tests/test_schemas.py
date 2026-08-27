"""Test Pydantic data models validation."""

from my_agent.models.schemas import (
    UserSchema, DocumentSchema, CandidateProfileSchema,
    OpportunitySchema, TailoredResumeSchema, KnowledgeSearchRequest
)


def test_user_schema():
    user = UserSchema(id="u123", email="user@example.com", target_roles=["Backend Engineer"])
    assert user.id == "u123"
    assert user.email == "user@example.com"
    assert "Backend Engineer" in user.target_roles
    print("  ✅ test_user_schema passed")


def test_document_schema():
    doc = DocumentSchema(user_id="u123", filename="resume.pdf", doc_type="resume", raw_markdown="# Resume")
    assert doc.doc_type == "resume"
    assert doc.raw_markdown == "# Resume"
    print("  ✅ test_document_schema passed")


def test_tailored_resume_ats_validation():
    try:
        TailoredResumeSchema(user_id="u123", tailored_markdown="...", ats_score=150)
        assert False, "Should have raised validation error for ats_score > 100"
    except Exception:
        pass

    valid_resume = TailoredResumeSchema(user_id="u123", tailored_markdown="...", ats_score=92)
    assert valid_resume.ats_score == 92
    print("  ✅ test_tailored_resume_ats_validation passed")


def test_knowledge_search_request():
    req = KnowledgeSearchRequest(query="Python developer", top_k=5)
    assert req.query == "Python developer"
    assert req.top_k == 5
    print("  ✅ test_knowledge_search_request passed")


if __name__ == "__main__":
    print("=== Running Phase 1 Schema Tests ===")
    test_user_schema()
    test_document_schema()
    test_tailored_resume_ats_validation()
    test_knowledge_search_request()
    print("🎉 ALL PHASE 1 SCHEMA TESTS PASSED SUCCESSFULLY!")
