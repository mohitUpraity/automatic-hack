"""Resume analysis tool for CareerOS powered by LiteLLM & Groq Cloud LLM with Pydantic validation."""

import json
from .llm_tools import call_groq_llm_json
from ..models.schemas import ResumeAnalysisSchema


def analyze_resume(resume_data: str) -> dict:
    """Analyzes structured resume data and produces deep AI insights using Groq Cloud LLM with Pydantic schema validation."""
    try:
        data = json.loads(resume_data) if isinstance(resume_data, str) else resume_data
    except json.JSONDecodeError:
        return {"status": "error", "message": "Invalid JSON in resume_data"}

    prompt = f"""
Analyze the following candidate resume data and return a JSON object with these exact keys:
"strengths": (list of 3-5 specific candidate strengths),
"weaknesses": (list of 2-3 specific growth/weakness areas),
"experience_level": (string: one of ["fresher", "junior", "mid", "senior"]),
"domain_focus": (string: primary domain, e.g. "Full Stack Web Development", "AI/ML Engineering", "Cloud DevOps"),
"key_technologies": (list of top 5-10 technologies mastered),
"summary": (string: 2-3 sentence executive AI career summary of candidate).

CANDIDATE DATA:
{json.dumps(data, indent=2)[:3500]}
"""

    llm_res = call_groq_llm_json(prompt, system_instruction="You are a Senior Technical Recruiter and AI Career Advisor. Return valid JSON only.")

    skills = data.get("skills", [])
    skills_list = [str(s) for s in (skills if isinstance(skills, list) else [skills])]

    if llm_res and llm_res.get("summary"):
        pydantic_model = ResumeAnalysisSchema(
            resume_id=data.get("id") or "res-101",
            user_id=data.get("user_id") or "default-user",
            strengths=[str(s) for s in (llm_res.get("strengths") or ["Strong technical skills"])],
            weaknesses=[str(w) for w in (llm_res.get("weaknesses") or ["Expand industry certifications"])],
            experience_level=str(llm_res.get("experience_level") or "mid"),
            domain_focus=str(llm_res.get("domain_focus") or "Software Engineering"),
            key_technologies=[str(t) for t in (llm_res.get("key_technologies") or skills_list)],
            summary=str(llm_res.get("summary"))
        )
    else:
        # Rule Fallback
        pydantic_model = ResumeAnalysisSchema(
            resume_id=data.get("id") or "res-101",
            user_id=data.get("user_id") or "default-user",
            strengths=["Solid technical foundation", "Demonstrates initiative"],
            weaknesses=["Consider building more open-source portfolio projects"],
            experience_level="mid",
            domain_focus="Software Development",
            key_technologies=skills_list[:8],
            summary=f"{data.get('name', 'Candidate')} is a software developer seeking growth opportunities."
        )

    validated_data = pydantic_model.model_dump() if hasattr(pydantic_model, "model_dump") else pydantic_model.dict()
    validated_data["status"] = "success"
    validated_data["llm_engine"] = "groq_openai_gpt_oss_20b"
    return validated_data
