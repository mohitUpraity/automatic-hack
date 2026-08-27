"""MCP Server Tool for Sub-Agent 2: resume_analyzer."""

from ..tools.db_tools import read_from_db, store_to_db
from ..tools.analysis_tools import analyze_resume


def analyze_and_store_resume(resume_id: int) -> dict:
    """Reads resume from DB, analyzes candidate skills/experience, and stores analysis.

    Authorized Scope: 'resumes:read', 'analysis:write'
    """
    resumes = read_from_db("resumes", f"id = '{resume_id}'")
    records = resumes.get("records", [])
    if not records:
        return {"status": "error", "message": f"Resume ID {resume_id} not found in DB"}

    resume_record = records[0]
    analysis = analyze_resume(resume_record)

    analysis_data = {
        "resume_id": resume_id,
        "strengths": analysis.get("strengths", []),
        "weaknesses": analysis.get("weaknesses", []),
        "experience_level": analysis.get("experience_level", "fresher"),
        "domain_focus": analysis.get("domain_focus", "general"),
        "key_technologies": analysis.get("key_technologies", []),
        "summary": analysis.get("summary", ""),
    }

    db_result = store_to_db("resume_analysis", analysis_data)
    return {
        "status": "success",
        "analysis_id": db_result.get("id"),
        "resume_id": resume_id,
        "domain_focus": analysis_data["domain_focus"],
        "experience_level": analysis_data["experience_level"],
        "summary": analysis_data["summary"],
    }
