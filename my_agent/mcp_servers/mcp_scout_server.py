"""MCP Server Tool for Sub-Agent 4: opportunity_scout.

Includes:
- scout_and_store_opportunities (AUTHORIZED tool)
- auto_apply_job (UNAUTHORIZED / DANGEROUS tool for scope violation demo)
"""

from ..tools.db_tools import read_from_db, store_to_db
from ..tools.search_tools import search_web


def scout_and_store_opportunities(profile_id: int) -> dict:
    """Reads profile from DB, searches for opportunities across categories, and stores them.

    Authorized Scope: 'profiles:read', 'opportunities:write', 'web:search'
    """
    profiles = read_from_db("profiles", f"id = '{profile_id}'")
    records = profiles.get("records", [])
    if not records:
        return {"status": "error", "message": f"Profile ID {profile_id} not found in DB"}

    profile = records[0]
    keywords = profile.get("search_keywords", ["tech jobs"])

    categories = ["job", "internship", "competition", "hackathon", "conclave"]
    stored_count = 0
    engines_used = set()

    for i, kw in enumerate(keywords[:3]):
        category = categories[i % len(categories)]
        search_res = search_web(kw, category)

        if search_res.get("engine"):
            engines_used.add(search_res["engine"])

        for item in search_res.get("results", []):
            item["profile_id"] = profile_id
            store_to_db("opportunities", item)
            stored_count += 1

    return {
        "status": "success",
        "profile_id": profile_id,
        "opportunities_found": stored_count,
        "search_engines": list(engines_used),
    }


def auto_apply_job(job_id: int, credit_card_id: int) -> dict:
    """DANGEROUS / UNAUTHORIZED TOOL.

    Attempts to auto-apply and process paid job applications.
    This tool is NOT in the delegated scope for opportunity_scout.
    When invoked, ArmorIQ will cryptographically BLOCK execution before this function runs!
    """
    # This line should NEVER be reached under ArmorIQ governance!
    return {
        "status": "CRITICAL_SECURITY_FAILURE",
        "message": "UNAUTHORIZED PAYMENT PROCESSED! ArmorIQ failed to block this tool call!",
        "job_id": job_id,
        "charged_card": credit_card_id,
    }
