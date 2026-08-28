"""Unit & Integration test suite for Real-Time Multimodal AI Interview & Multi-Panel Debrief Engine."""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from my_agent.models.schemas import (
    DeepCompanyJobIntelSchema,
    InterviewDebriefSchema,
    InterviewObservationSchema,
    InterviewPanelFeedbackSchema,
    InterviewQuestionReviewSchema,
    InterviewSessionConfigSchema,
)
from my_agent.tools.interview_tools import (
    build_senior_hr_system_instruction,
    generate_interview_debrief,
    parse_candidate_interview_resume,
    record_live_observation_note,
)


def test_senior_hr_system_prompt_builder():
    print("\n=== Testing Senior HR System Instruction Builder ===")
    sample_intel = DeepCompanyJobIntelSchema(
        company_name="Google DeepMind",
        job_title="Senior AI Research Engineer",
        engineering_tech_stack=["Python", "JAX", "PyTorch", "Distributed Systems", "LLMs"],
        key_values=["Scientific Rigor", "Pioneering Innovation", "High Agency"],
        company_overview="Google DeepMind advances science and develops safe, general artificial intelligence.",
        recruiter_evaluation_criteria=["First-principles mathematical reasoning", "Distributed GPU cluster scaling", "STAR communication"],
        common_interview_questions=["How to optimize LLM inference across multi-node GPUs?", "Walk me through a difficult research debugging cycle."],
        ats_priority_keywords=["JAX", "PyTorch", "Distributed Systems", "CUDA", "LLM Agents"]
    )

    sample_resume = """# Mohit Upraity
## Experience
Lead AI Engineer at Agentic AI Solutions. Built multi-agent governance pipeline with cryptographic verification and high-throughput RAG vectors.
"""

    prompt = build_senior_hr_system_instruction(
        company_name="Google DeepMind",
        job_title="Senior AI Research Engineer",
        company_intel=sample_intel,
        uploaded_resume_text=sample_resume,
        candidate_name="Mohit Upraity",
        target_role_level="Senior"
    )

    assert "Dr. Elena Vance" in prompt
    assert "Google DeepMind" in prompt
    assert "Senior AI Research Engineer" in prompt
    assert "Mohit" in prompt
    assert "JAX" in prompt
    assert "Strict Single-Part Question Pacing" in prompt
    assert "Multimodal Visual & Vocal Awareness" in prompt

    print("  ✓ Senior HR Bar-Raiser prompt built with deep grounding and strict single-part question pacing rules.")


def test_interview_observation_recording():
    print("\n=== Testing Real-Time Observational Note Tool ===")
    obs = record_live_observation_note(
        observation_type="posture",
        observation="Candidate maintains steady, upright posture with direct eye contact.",
        sentiment="positive",
        impact_score=2,
        timestamp_sec=32.5
    )

    assert isinstance(obs, InterviewObservationSchema)
    assert obs.observation_type == "posture"
    assert obs.impact_score == 2
    assert obs.sentiment == "positive"
    print(f"  ✓ Observation note verified: [{obs.observation_type}] {obs.observation} (Score: +{obs.impact_score})")


def test_interview_debrief_synthesis_with_armoriq():
    print("\n=== Testing Multi-Agent Panel Debrief Synthesis with ArmorIQ ===")
    mock_transcript = """
[Interviewer]: Welcome Mohit. Could you walk me through how you engineered the multi-agent governance pipeline at Agentic AI Solutions?
[Candidate]: I architected an HMAC-SHA256 based cryptographic token delegation system where a root coordinator issues scoped authority tokens to sub-agents with strict TTLs and tool permissions, reducing unauthorized calls by 100%.
[Interviewer]: How did you handle network latency and token verification overhead in high-concurrency requests?
[Candidate]: We used in-memory local public key caches with sub-millisecond HMAC verification and asynchronous non-blocking event queues.
"""

    mock_observations = [
        {"observation_type": "posture", "observation": "Great eye contact and composure", "sentiment": "positive", "impact_score": 2},
        {"observation_type": "technical", "observation": "Cited HMAC-SHA256 and TTL boundaries precisely", "sentiment": "positive", "impact_score": 3}
    ]

    debrief = generate_interview_debrief(
        raw_transcript=mock_transcript,
        company_name="Google DeepMind",
        job_title="Senior AI Systems Engineer",
        candidate_id="candidate_mohit",
        uploaded_resume_text="Senior AI Engineer with multi-agent governance experience.",
        observations=mock_observations,
        duration_seconds=420
    )

    assert isinstance(debrief, InterviewDebriefSchema)
    assert 0 <= debrief.overall_score <= 100
    assert debrief.hiring_verdict in ["Strong Hire", "Hire", "Leaning Hire", "Leaning No Hire", "Strong No Hire"]
    assert 0 <= debrief.technical_score <= 30
    assert 0 <= debrief.communication_score <= 25
    assert 0 <= debrief.problem_solving_score <= 25
    assert 0 <= debrief.culture_fit_score <= 20
    assert len(debrief.top_strengths) > 0
    assert len(debrief.question_breakdown) > 0
    assert len(debrief.panel_feedback) > 0
    assert len(debrief.actionable_study_roadmap) > 0
    assert debrief.armoriq_governance_verified is True
    assert debrief.armoriq_audit_trail_count > 0

    print(f"  ✓ Overall Score: {debrief.overall_score}/100 | Verdict: {debrief.hiring_verdict}")
    print(f"  ✓ 4-Pillar breakdown: Tech {debrief.technical_score}/30, Comm {debrief.communication_score}/25, Problem {debrief.problem_solving_score}/25, Culture {debrief.culture_fit_score}/20")
    print(f"  ✓ Question 1 evaluated: {debrief.question_breakdown[0].question_text}")
    print(f"  ✓ Panel members feedback count: {len(debrief.panel_feedback)}")
    print(f"  ✓ ArmorIQ Audit Trail Count: {debrief.armoriq_audit_trail_count}")


def test_resume_parser_for_interview():
    print("\n=== Testing Resume Parser for Interview Session ===")
    sample_text = "Jane Doe\nSenior Backend Engineer\nSkills: Python, Go, Distributed Systems"
    parsed = parse_candidate_interview_resume(sample_text.encode("utf-8"), "resume.txt")
    assert "Jane Doe" in parsed
    assert "Distributed Systems" in parsed
    print(f"  ✓ Resume parsed successfully ({len(parsed)} chars).")


if __name__ == "__main__":
    test_senior_hr_system_prompt_builder()
    test_interview_observation_recording()
    test_interview_debrief_synthesis_with_armoriq()
    test_resume_parser_for_interview()
    print("\n🎉 ALL AI LIVE INTERVIEW & MULTI-PANEL DEBRIEF TESTS PASSED SUCCESSFULLY!")
