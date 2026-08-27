"""MCP Server Tool for Sub-Agent 3: profile_maker."""

from ..tools.db_tools import read_from_db, store_to_db
from ..tools.profile_tools import make_profile


def build_and_store_profile(resume_id: int) -> dict:
    """Reads resume and analysis from DB, builds candidate profile, and stores it.

    Authorized Scope: 'analysis:read', 'profiles:write'
    """
    resumes = read_from_db("resumes", f"id = '{resume_id}'")
    res_records = resumes.get("records", [])
    if not res_records:
        return {"status": "error", "message": f"Resume ID {resume_id} not found in DB"}

    analyses = read_from_db("resume_analysis", f"resume_id = '{resume_id}'")
    ana_records = analyses.get("records", [])
    if not ana_records:
        return {"status": "error", "message": f"Analysis for Resume ID {resume_id} not found in DB"}

    profile = make_profile(res_records[0], ana_records[0])

    profile_data = {
        "resume_id": resume_id,
        "tech_stack": profile.get("tech_stack", []),
        "interests": profile.get("interests", []),
        "career_goals": profile.get("career_goals", ""),
        "preferred_roles": profile.get("preferred_roles", []),
        "experience_summary": profile.get("experience_summary", ""),
        "search_keywords": profile.get("search_keywords", []),
    }

    db_result = store_to_db("profiles", profile_data)
    return {
        "status": "success",
        "profile_id": db_result.get("id"),
        "resume_id": resume_id,
        "tech_stack": profile_data["tech_stack"],
        "preferred_roles": profile_data["preferred_roles"],
        "search_keywords": profile_data["search_keywords"],
    }
