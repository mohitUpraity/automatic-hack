"""Ranking tool for CareerOS powered by LiteLLM & Groq Cloud LLM with Pydantic validation."""

import json
from .llm_tools import call_groq_llm_json
from ..models.schemas import RankedOpportunitySchema


def rank_results(profile_data: str, opportunities_data: str) -> dict:
    """Scores and ranks opportunities using Groq Cloud LLM AI Matcher with Pydantic schema validation."""
    try:
        profile = json.loads(profile_data) if isinstance(profile_data, str) else profile_data
    except json.JSONDecodeError:
        return {"status": "error", "message": "Invalid JSON in profile_data"}

    try:
        opportunities = json.loads(opportunities_data) if isinstance(opportunities_data, str) else opportunities_data
    except json.JSONDecodeError:
        return {"status": "error", "message": "Invalid JSON in opportunities_data"}

    if isinstance(opportunities, dict):
        opportunities = opportunities.get("records", [opportunities])

    tech_stack = profile.get("tech_stack", [])
    if isinstance(tech_stack, str):
        try:
            tech_stack = json.loads(tech_stack)
        except Exception:
            tech_stack = [tech_stack]

    preferred_roles = profile.get("preferred_roles", [])
    if isinstance(preferred_roles, str):
        try:
            preferred_roles = json.loads(preferred_roles)
        except Exception:
            preferred_roles = [preferred_roles]

    ranked = []
    opp_summaries = []
    for opp in opportunities[:10]:
        if isinstance(opp, dict):
            opp_summaries.append({
                "id": opp.get("id", 0),
                "title": opp.get("title", ""),
                "category": opp.get("category", ""),
                "source": opp.get("source", ""),
                "description": opp.get("description", "")[:150]
            })

    prompt = f"""
Evaluate candidate fit for each opportunity and return a JSON list of matches:
[
  {{
    "id": (number or string, opportunity id),
    "relevance_score": (number 0-100),
    "match_reasons": (list of 2-3 specific short strings explaining why this opportunity matches candidate skills)
  }}
]

CANDIDATE PROFILE:
Tech Stack: {', '.join([str(t) for t in tech_stack[:8]])}
Preferred Roles: {', '.join([str(r) for r in preferred_roles[:3]])}

OPPORTUNITIES:
{json.dumps(opp_summaries, indent=2)}
"""

    llm_matches = call_groq_llm_json(prompt, system_instruction="You are an AI Job Matching & Ranking Engine. Return a valid JSON list only.")

    llm_score_map = {}
    if isinstance(llm_matches, list):
        for item in llm_matches:
            if isinstance(item, dict) and "id" in item:
                llm_score_map[str(item["id"])] = item
    elif isinstance(llm_matches, dict) and "matches" in llm_matches:
        for item in llm_matches["matches"]:
            if isinstance(item, dict) and "id" in item:
                llm_score_map[str(item["id"])] = item

    unvalidated_ranked = []
    for opp in opportunities:
        if not isinstance(opp, dict):
            continue

        opp_id = str(opp.get("id", 0))
        opp_text = f"{opp.get('title', '')} {opp.get('description', '')} {opp.get('category', '')}".lower()
        
        # Check if Groq LLM provided a score
        if opp_id in llm_score_map:
            match_info = llm_score_map[opp_id]
            score = match_info.get("relevance_score", 80)
            reasons = match_info.get("match_reasons", ["Matched by Groq Cloud AI"])
        else:
            score = 60
            reasons = []
            tech_matches = [t for t in tech_stack if str(t).lower() in opp_text]
            if tech_matches:
                score += min(30, len(tech_matches) * 10)
                reasons.append(f"Tech match: {', '.join([str(tm) for tm in tech_matches[:3]])}")
            role_matches = [r for r in preferred_roles if str(r).lower() in opp_text]
            if role_matches:
                score += 10
                reasons.append(f"Role match: {role_matches[0]}")
            if not reasons:
                reasons.append(f"Category relevance: {opp.get('category', 'Job')}")

        score = min(100, max(10, int(score)))

        unvalidated_ranked.append({
            "opportunity_id": opp_id,
            "title": str(opp.get("title", "")),
            "url": str(opp.get("url", "")),
            "category": str(opp.get("category", "job")),
            "relevance_score": score,
            "match_reasons": [str(r) for r in reasons],
            "profile_id": str(profile.get("id", "prof-101")),
        })

    # Sort descending by relevance score
    unvalidated_ranked.sort(key=lambda x: x["relevance_score"], reverse=True)
    
    # Enforce Pydantic Model Validation for each ranked match
    validated_ranked = []
    for i, item in enumerate(unvalidated_ranked):
        pydantic_model = RankedOpportunitySchema(
            opportunity_id=item["opportunity_id"],
            profile_id=item["profile_id"],
            user_id="default-user",
            relevance_score=item["relevance_score"],
            match_reasons=item["match_reasons"],
            rank=i + 1,
            category=item["category"]
        )
        val_dict = pydantic_model.model_dump() if hasattr(pydantic_model, "model_dump") else pydantic_model.dict()
        val_dict["title"] = item["title"]
        val_dict["url"] = item["url"]
        validated_ranked.append(val_dict)

    return {
        "status": "success",
        "total_ranked": len(validated_ranked),
        "ranked_results": validated_ranked,
    }
