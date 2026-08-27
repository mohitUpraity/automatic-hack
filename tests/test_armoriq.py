"""Test ArmorIQ governance across all 8 sub-agents."""

from my_agent.armoriq_crypto import generate_pipeline_keypairs
from my_agent.armoriq_wrapper import (
    ArmorIQClient,
    ArmorIQScopeViolationError,
    ArmorIQTokenExpiredError
)


def test_keypair_generation_8_agents():
    keypairs = generate_pipeline_keypairs()
    assert len(keypairs) == 9  # root + 8 sub-agents
    assert "document_processor" in keypairs
    assert "knowledge_builder" in keypairs
    assert "resume_tailor" in keypairs
    print("  ✅ Keypair matrix created for 8 sub-agents + root agent")


def test_scope_violation_scout_auto_apply():
    armoriq = ArmorIQClient()
    keypairs = generate_pipeline_keypairs()
    root_kp = keypairs["root_coordinator_agent"]

    tok_scout = armoriq.delegate(
        parent_agent_id="root_coordinator_agent",
        parent_keypair=root_kp,
        sub_agent_id="opportunity_scout",
        allowed_scopes=["profiles:read", "opportunities:write"],
        allowed_tools=["mcp_scout.scout_and_store_opportunities"],
        ttl_seconds=300
    )

    try:
        armoriq.invoke(
            sub_agent_id="opportunity_scout",
            sub_agent_keypair=keypairs["opportunity_scout"],
            delegation_token=tok_scout,
            parent_keypair=root_kp,
            tool_name="mcp_scout.auto_apply_job",
            tool_args={"job_id": 99},
            tool_func=lambda **kw: {"applied": True}
        )
        assert False, "Should have thrown ArmorIQScopeViolationError"
    except ArmorIQScopeViolationError as exc_info:
        assert "auto_apply_job" in str(exc_info)
        print("  ✅ Scope violation auto_apply_job blocked correctly")


def test_scope_violation_tailor_delete_db():
    armoriq = ArmorIQClient()
    keypairs = generate_pipeline_keypairs()
    root_kp = keypairs["root_coordinator_agent"]

    tok_tailor = armoriq.delegate(
        parent_agent_id="root_coordinator_agent",
        parent_keypair=root_kp,
        sub_agent_id="resume_tailor",
        allowed_scopes=["knowledge:read", "resumes:write"],
        allowed_tools=["mcp_tailor.tailor_resume"],
        ttl_seconds=300
    )

    try:
        armoriq.invoke(
            sub_agent_id="resume_tailor",
            sub_agent_keypair=keypairs["resume_tailor"],
            delegation_token=tok_tailor,
            parent_keypair=root_kp,
            tool_name="mcp_tailor.delete_knowledge_base",
            tool_args={"all": True},
            tool_func=lambda **kw: None
        )
        assert False, "Should have thrown ArmorIQScopeViolationError"
    except ArmorIQScopeViolationError as exc_info:
        assert "delete_knowledge_base" in str(exc_info)
        print("  ✅ Scope violation delete_knowledge_base blocked correctly")


if __name__ == "__main__":
    print("=== Running ArmorIQ Governance Tests ===")
    test_keypair_generation_8_agents()
    test_scope_violation_scout_auto_apply()
    test_scope_violation_tailor_delete_db()
    print("🎉 ALL ARMORIQ GOVERNANCE TESTS PASSED!")
