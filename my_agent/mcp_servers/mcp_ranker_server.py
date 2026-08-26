"""MCP Server Tool for Sub-Agent 5: opportunity_ranker."""

from ..tools.db_tools import read_from_db, store_to_db
from ..tools.ranking_tools import rank_results


def rank_and_store_opportunities(profile_id: int) -> dict:
    """Reads profile and raw opportunities from DB, ranks them, and stores scored results.

    Authorized Scope: 'opportunities:read', 'ranked:write'
    """
    profiles = read_from_db("profiles", f"id = '{profile_id}'")
    prof_records = profiles.get("records", [])
    if not prof_records:
        return {"status": "error", "message": f"Profile ID {profile_id} not found in DB"}

    opps = read_from_db("opportunities", f"profile_id = '{profile_id}'")
    opp_records = opps.get("records", [])
    if not opp_records:
        return {"status": "error", "message": f"No opportunities found for Profile ID {profile_id}"}

    ranked = rank_results(prof_records[0], opp_records)
    ranked_list = ranked.get("ranked_results", [])

    for r in ranked_list:
        store_to_db("ranked_opportunities", r)

    return {
        "status": "success",
        "profile_id": profile_id,
        "total_ranked": len(ranked_list),
        "top_ranked": ranked_list[:5],
    }
