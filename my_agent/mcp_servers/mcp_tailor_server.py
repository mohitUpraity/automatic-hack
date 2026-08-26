"""MCP Server Tool for Sub-Agent 8: resume_tailor."""

from ..tools.tailor_tools import tailor_resume_for_opportunity


def tailor_resume(
    opportunity_title: str,
    company_name: str,
    requirements: str,
    user_id: str = "default-user"
) -> dict:
    """Generates tailored resume markdown & professional PDF for target opportunity.

    Authorized Scope: 'knowledge:read', 'profiles:read', 'resumes:write'
    """
    return tailor_resume_for_opportunity(opportunity_title, company_name, requirements, user_id=user_id)
