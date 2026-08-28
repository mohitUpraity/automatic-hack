import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from my_agent.models.schemas import (
    ATSScoreRubricSchema,
    DeepCompanyJobIntelSchema,
    ATSIterationStepSchema,
    ATSGoalPipelineResponseSchema,
    ATSGoalPipelineRequestSchema,
)
from my_agent.tools.ats_goal_pipeline import (
    generate_hr_grade_company_job_intel,
    evaluate_resume_ats_detailed,
    surgical_in_place_tailor_step,
    run_ats_90_goal_pipeline,
)


def test_deep_company_job_intel_schema_and_generation():
    print("\n=== Testing Deep HR Company & JD Intelligence Generation ===")
    intel = generate_hr_grade_company_job_intel(
        company_name="Google DeepMind",
        job_title="Senior AI Research Engineer",
        job_url="https://deepmind.google/careers",
        raw_jd="Looking for Senior AI Research Engineers with strong Python, JAX, PyTorch, distributed systems, and LLM agent experience."
    )

    assert isinstance(intel, DeepCompanyJobIntelSchema)
    assert "Google DeepMind" in intel.company_name
    assert len(intel.engineering_tech_stack) > 0
    assert len(intel.ats_priority_keywords) > 0
    assert intel.company_overview
    assert len(intel.role_scope_and_responsibilities) > 0
    print(f"  ✓ Deep HR Intelligence verified for: {intel.company_name} ({intel.job_title})")
    print(f"  ✓ Tech stack: {intel.engineering_tech_stack[:6]}")
    print(f"  ✓ ATS Priority Keywords: {intel.ats_priority_keywords[:6]}")


def test_granular_ats_evaluation_rubric():
    print("\n=== Testing Granular 6-Factor ATS Recruiter Evaluation ===")
    sample_intel = DeepCompanyJobIntelSchema(
        company_name="Stripe",
        job_title="Staff Backend Engineer",
        industry="Financial Infrastructure & Payments",
        company_overview="Stripe builds economic infrastructure for the internet.",
        business_model_and_products="Payment processing APIs, Billing, Treasury",
        engineering_tech_stack=["Python", "Go", "Ruby", "PostgreSQL", "Kafka", "Distributed Systems", "AWS"],
        engineering_culture_and_values="Rigorous code review, low-latency high-reliability APIs.",
        key_values=["Users First", "Move Fast", "High Agency"],
        role_scope_and_responsibilities=["Design distributed payment ledgers with 99.999% uptime."],
        required_qualifications=["5+ years backend systems experience."],
        preferred_qualifications=["Financial transaction experience."],
        seniority_level="Staff Engineer",
        recruiter_evaluation_criteria=["API design mastery", "Fault-tolerant architecture"],
        common_interview_questions=["How to design idempotent payment APIs?"],
        ats_priority_keywords=["PostgreSQL", "Kafka", "Distributed Systems", "REST APIs", "High Concurrency", "Latency Optimization"],
        why_work_here="Global scale impact."
    )

    sample_resume = """# Jane Smith
Email: jane@example.com | Phone: +1-555-0199 | San Francisco, CA

## Professional Summary
Staff Backend Engineer with 7+ years of experience designing high-throughput distributed systems, REST APIs, and event-driven architectures with PostgreSQL, Kafka, and Python.

## Technical Skills
- Languages: Python, Go, SQL
- Technologies: PostgreSQL, Kafka, Redis, Distributed Systems, Docker, AWS, REST APIs

## Experience
### Lead Systems Engineer — FinTech Innovations (2021 - Present)
- Architected high-concurrency payment engine processing 50,000 requests/sec with sub-10ms latency.
- Implemented fault-tolerant Kafka event streaming pipeline handling $20M+ daily volume.
- Reduced PostgreSQL query latency by 45% using optimized indexing and connection pooling.

## Projects
### Distributed Ledger Engine (2023)
- Built idempotent transaction processor with zero data loss guarantees across 1M+ transactions.

## Education
- B.S. in Computer Science — Stanford University
"""

    rubric = evaluate_resume_ats_detailed(sample_resume, "Staff Backend Engineer at Stripe", sample_intel)

    assert isinstance(rubric, ATSScoreRubricSchema)
    assert 0 <= rubric.overall_score <= 100
    assert 0 <= rubric.keyword_score <= 25
    assert 0 <= rubric.role_relevance_score <= 20
    assert 0 <= rubric.impact_metrics_score <= 20
    assert 0 <= rubric.formatting_compatibility_score <= 15
    assert 0 <= rubric.culture_fit_score <= 10
    assert 0 <= rubric.action_verbs_score <= 10
    assert len(rubric.matched_keywords) > 0
    assert rubric.overall_score >= 80

    print(f"  ✓ Overall ATS Score: {rubric.overall_score}/100 (Goal Met: {rubric.goal_met})")
    print(f"  ✓ Matched Keywords: {rubric.matched_keywords}")
    print(f"  ✓ Actionable Critique: {rubric.actionable_critique}")


def test_full_ats_90_goal_pipeline():
    print("\n=== Testing Autonomous ATS 90+ Goal Looping Pipeline with ArmorIQ ===")
    res = run_ats_90_goal_pipeline(
        company_name="Vercel",
        opportunity_title="Senior Full-Stack AI Engineer",
        candidate_id="candidate_mohit",
        user_id="test-user-ats",
        job_description="Seeking a Senior Full-Stack AI Engineer with deep expertise in Next.js, React, TypeScript, FastAPI, AI Agents, and scalable cloud deployments.",
        target_score=90,
        max_iterations=3
    )

    assert isinstance(res, ATSGoalPipelineResponseSchema)
    assert res.target_company == "Vercel"
    assert res.opportunity_title == "Senior Full-Stack AI Engineer"
    assert res.final_ats_score >= 85
    assert len(res.iteration_trace) >= 1
    assert res.final_tailored_markdown
    assert res.pdf_path
    assert os.path.exists(res.pdf_path)
    assert res.armoriq_audit_trail_count > 0

    print(f"  ✓ Final ATS Score: {res.final_ats_score}/100")
    print(f"  ✓ Initial Score: {res.initial_ats_score} -> Final Score: {res.final_ats_score} (Iterations: {res.total_iterations})")
    print(f"  ✓ PDF generated at: {res.pdf_path}")
    print(f"  ✓ ArmorIQ Audit Trail Count: {res.armoriq_audit_trail_count}")


if __name__ == "__main__":
    test_deep_company_job_intel_schema_and_generation()
    test_granular_ats_evaluation_rubric()
    test_full_ats_90_goal_pipeline()
    print("\n🎉 ALL ATS 90+ GOAL PIPELINE TESTS PASSED SUCCESSFULLY!")
