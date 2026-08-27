"""ArmorIQ Governance Wrapper for Multi-Agent Security.

Implements Problem 2 ("Who authorized that?") requirements:
- capture_plan(agent_id, intent, allowed_tools)
- delegate(parent_id, sub_agent_id, keypair, allowed_scopes, allowed_tools, ttl)
- invoke(sub_agent_id, keypair, delegation_token, tool_name, tool_args, handler_func)

Enforces cryptographic identity verification, scope checking, TTL expiration,
and logs audit trail events.
"""

import base64
import json
import time
from typing import Any, Callable, Dict, List, Optional
from .armoriq_crypto import AgentKeypair


class ArmorIQScopeViolationError(Exception):
    """Raised when an agent attempts to invoke a tool outside its delegated scope."""

    def __init__(self, message: str, sub_agent_id: str, requested_tool: str, allowed_tools: List[str]):
        super().__init__(message)
        self.sub_agent_id = sub_agent_id
        self.requested_tool = requested_tool
        self.allowed_tools = allowed_tools


class ArmorIQTokenExpiredError(Exception):
    """Raised when an agent presents an expired delegation token."""
    pass


class ArmorIQInvalidSignatureError(Exception):
    """Raised when cryptographic signature verification fails."""
    pass


class ArmorIQPlan:
    """Represents an intent plan captured by the Root Coordinator."""

    def __init__(self, plan_id: str, agent_id: str, intent: str, allowed_tools: List[str]):
        self.plan_id = plan_id
        self.agent_id = agent_id
        self.intent = intent
        self.allowed_tools = allowed_tools
        self.created_at = time.time()


class ArmorIQDelegationToken:
    """Represents a cryptographically signed delegation token."""

    def __init__(
        self,
        token_id: str,
        parent_agent_id: str,
        sub_agent_id: str,
        allowed_scopes: List[str],
        allowed_tools: List[str],
        ttl_seconds: int,
        parent_keypair: AgentKeypair,
    ):
        self.token_id = token_id
        self.parent_agent_id = parent_agent_id
        self.sub_agent_id = sub_agent_id
        self.allowed_scopes = allowed_scopes
        self.allowed_tools = allowed_tools
        self.issued_at = time.time()
        self.expires_at = self.issued_at + ttl_seconds

        # Payload to be signed
        payload_data = {
            "token_id": self.token_id,
            "parent": self.parent_agent_id,
            "sub": self.sub_agent_id,
            "scopes": self.allowed_scopes,
            "tools": self.allowed_tools,
            "exp": self.expires_at,
        }
        self.payload_json = json.dumps(payload_data, sort_keys=True)
        self.signature = parent_keypair.sign(self.payload_json)

    def is_expired(self) -> bool:
        """Checks if the delegation token has expired."""
        return time.time() > self.expires_at

    def verify(self, parent_keypair: AgentKeypair) -> bool:
        """Cryptographically verifies token payload against parent keypair."""
        return parent_keypair.verify(self.payload_json, self.signature)


class ArmorIQClient:
    """Core ArmorIQ Governance Client for Multi-Agent Policy Enforcement."""

    def __init__(self):
        self.plans: Dict[str, ArmorIQPlan] = {}
        self.audit_logs: List[Dict[str, Any]] = []

    def capture_plan(self, agent_id: str, intent: str, allowed_tools: List[str]) -> ArmorIQPlan:
        """Registers an authorized intent plan for the root coordinator agent.

        Args:
            agent_id: The ID of the root coordinator.
            intent: High-level natural language intent statement.
            allowed_tools: Full list of tools authorized under this plan.

        Returns:
            An ArmorIQPlan instance.
        """
        plan_id = f"plan_{int(time.time() * 1000)}"
        plan = ArmorIQPlan(plan_id, agent_id, intent, allowed_tools)
        self.plans[plan_id] = plan

        self._log_audit({
            "event": "PLAN_CAPTURED",
            "plan_id": plan_id,
            "agent_id": agent_id,
            "intent": intent,
            "allowed_tools": allowed_tools,
            "status": "AUTHORIZED",
            "timestamp": time.time(),
        })

        return plan

    def delegate(
        self,
        parent_agent_id: str,
        parent_keypair: AgentKeypair,
        sub_agent_id: str,
        allowed_scopes: List[str],
        allowed_tools: List[str],
        ttl_seconds: int = 300,
    ) -> ArmorIQDelegationToken:
        """Cryptographically delegates scoped authority from parent agent to sub-agent.

        Args:
            parent_agent_id: ID of the delegating parent agent.
            parent_keypair: Cryptographic keypair of parent agent for signing.
            sub_agent_id: ID of the recipient sub-agent.
            allowed_scopes: List of authorized resource scopes (e.g. ['profiles:read']).
            allowed_tools: List of authorized tool names.
            ttl_seconds: Time-to-live in seconds (token expiration).

        Returns:
            A signed ArmorIQDelegationToken instance.
        """
        token_id = f"tok_{sub_agent_id}_{int(time.time())}"
        token = ArmorIQDelegationToken(
            token_id=token_id,
            parent_agent_id=parent_agent_id,
            sub_agent_id=sub_agent_id,
            allowed_scopes=allowed_scopes,
            allowed_tools=allowed_tools,
            ttl_seconds=ttl_seconds,
            parent_keypair=parent_keypair,
        )

        self._log_audit({
            "event": "AUTHORITY_DELEGATED",
            "token_id": token_id,
            "parent_agent": parent_agent_id,
            "sub_agent": sub_agent_id,
            "allowed_scopes": allowed_scopes,
            "allowed_tools": allowed_tools,
            "ttl_seconds": ttl_seconds,
            "status": "DELEGATED",
            "timestamp": time.time(),
        })

        return token

    def invoke(
        self,
        sub_agent_id: str,
        sub_agent_keypair: AgentKeypair,
        delegation_token: ArmorIQDelegationToken,
        parent_keypair: AgentKeypair,
        tool_name: str,
        tool_args: Dict[str, Any],
        tool_func: Callable[..., Any],
    ) -> Any:
        """Executes a tool call on behalf of a sub-agent with cryptographic governance checks.

        Enforces:
        1. Cryptographic token signature verification
        2. Token TTL expiration check
        3. Delegated tool scope permission check

        If any check fails, execution is BLOCKED and logged.

        Returns:
            The tool result if allowed.
        Raises:
            ArmorIQScopeViolationError, ArmorIQTokenExpiredError, ArmorIQInvalidSignatureError
        """
        log_entry = {
            "event": "TOOL_INVOCATION_ATTEMPT",
            "sub_agent": sub_agent_id,
            "token_id": delegation_token.token_id,
            "requested_tool": tool_name,
            "tool_args": tool_args,
            "timestamp": time.time(),
        }

        # Check 1: Cryptographic signature verification
        if not delegation_token.verify(parent_keypair):
            log_entry.update({"event": "INVOCATION_BLOCKED", "reason": "INVALID_SIGNATURE", "status": "BLOCKED"})
            self._log_audit(log_entry)
            raise ArmorIQInvalidSignatureError("Delegation token signature verification failed.")

        # Check 2: Token TTL expiration
        if delegation_token.is_expired():
            log_entry.update({"event": "INVOCATION_BLOCKED", "reason": "TOKEN_EXPIRED", "status": "BLOCKED"})
            self._log_audit(log_entry)
            raise ArmorIQTokenExpiredError(
                f"Delegation token {delegation_token.token_id} for sub-agent '{sub_agent_id}' has expired."
            )

        # Check 3: Scope & tool boundary verification
        if tool_name not in delegation_token.allowed_tools:
            log_entry.update({
                "event": "SCOPE_VIOLATION_BLOCKED",
                "reason": "TOOL_NOT_IN_DELEGATED_SCOPE",
                "allowed_tools": delegation_token.allowed_tools,
                "status": "BLOCKED_SECURITY_VIOLATION",
            })
            self._log_audit(log_entry)
            raise ArmorIQScopeViolationError(
                message=(
                    f"🛑 ArmorIQ Scope Violation Blocked! Agent '{sub_agent_id}' requested tool '{tool_name}' "
                    f"which is NOT authorized in its delegation scope {delegation_token.allowed_tools}."
                ),
                sub_agent_id=sub_agent_id,
                requested_tool=tool_name,
                allowed_tools=delegation_token.allowed_tools,
            )

        # All checks passed — execute tool
        log_entry.update({"event": "TOOL_INVOCATION_ALLOWED", "status": "ALLOWED_EXECUTED"})
        self._log_audit(log_entry)

        return tool_func(**tool_args)

    def log_hold_for_approval(self, sub_agent_id: str, tool_name: str, tool_args: Dict[str, Any], risk_score: int, reason: str) -> str:
        """Logs a high-stakes action held for supervisor approval."""
        action_id = f"hold_{sub_agent_id}_{int(time.time() * 1000)}"
        self._log_audit({
            "event": "HELD_FOR_HUMAN_APPROVAL",
            "action_id": action_id,
            "sub_agent": sub_agent_id,
            "requested_tool": tool_name,
            "tool_args": tool_args,
            "risk_score": risk_score,
            "reason": reason,
            "status": "HELD_APPROVAL",
            "timestamp": time.time(),
        })
        return action_id

    def log_approval_resolution(self, action_id: str, approved: bool, supervisor_id: str = "supervisor_admin") -> None:
        """Logs supervisor decision on a held action."""
        self._log_audit({
            "event": "APPROVAL_RESOLUTION",
            "action_id": action_id,
            "supervisor": supervisor_id,
            "decision": "APPROVED_BY_HUMAN" if approved else "REJECTED_BY_HUMAN",
            "status": "ALLOWED_EXECUTED" if approved else "BLOCKED_BY_SUPERVISOR",
            "timestamp": time.time(),
        })

    def _log_audit(self, entry: Dict[str, Any]) -> None:
        """Appends entry to audit trail."""
        self.audit_logs.append(entry)

    def get_audit_trail(self) -> List[Dict[str, Any]]:
        return self.audit_logs

    def seed_initial_audit_trail(self, keypairs: Dict[str, AgentKeypair]) -> None:
        """Populates initial realistic cryptographic audit trail for Observatory demo."""
        if len(self.audit_logs) > 0:
            return

        root_kp = keypairs.get("root_coordinator_agent")
        if not root_kp:
            return

        now = time.time()
        # 1. Plan captured
        self.capture_plan(
            agent_id="root_coordinator_agent",
            intent="Autonomous end-to-end multi-agent candidate career intelligence and document processing pipeline",
            allowed_tools=[
                "mcp_docproc.process_and_embed_document",
                "mcp_extractor.extract_and_store_resume",
                "mcp_analyzer.analyze_and_store_resume",
                "mcp_profiler.build_and_store_profile",
                "mcp_scout.scout_and_store_opportunities",
                "mcp_ranker.rank_and_store_opportunities",
                "mcp_knowledge.build_knowledge_base",
                "mcp_tailor.tailor_resume"
            ]
        )

        # 2. Delegations to sub-agents with 300s TTL
        sub_configs = [
            ("document_processor", ["documents:write", "embeddings:write"], ["mcp_docproc.process_and_embed_document"]),
            ("resume_extractor", ["resumes:write"], ["mcp_extractor.extract_and_store_resume"]),
            ("resume_analyzer", ["resumes:read", "analysis:write"], ["mcp_analyzer.analyze_and_store_resume"]),
            ("profile_maker", ["analysis:read", "profiles:write"], ["mcp_profiler.build_and_store_profile"]),
            ("opportunity_scout", ["profiles:read", "opportunities:write", "web:search"], ["mcp_scout.scout_and_store_opportunities"]),
            ("opportunity_ranker", ["opportunities:read", "ranked:write"], ["mcp_ranker.rank_and_store_opportunities"]),
            ("knowledge_builder", ["embeddings:read", "knowledge:write"], ["mcp_knowledge.build_knowledge_base"]),
            ("resume_tailor", ["knowledge:read", "profiles:read", "resumes:write"], ["mcp_tailor.tailor_resume"])
        ]

        for sub_id, scopes, tools in sub_configs:
            self.delegate(
                parent_agent_id="root_coordinator_agent",
                parent_keypair=root_kp,
                sub_agent_id=sub_id,
                allowed_scopes=scopes,
                allowed_tools=tools,
                ttl_seconds=300
            )

        # 3. Successful tool executions
        self._log_audit({
            "event": "TOOL_INVOCATION_ALLOWED",
            "sub_agent": "document_processor",
            "token_id": f"tok_document_processor_{int(now - 120)}",
            "requested_tool": "mcp_docproc.process_and_embed_document",
            "tool_args": {"doc_id": "doc_resume_master", "format": "PDF", "chunks": 6},
            "status": "ALLOWED_EXECUTED",
            "timestamp": now - 110,
        })
        self._log_audit({
            "event": "TOOL_INVOCATION_ALLOWED",
            "sub_agent": "resume_extractor",
            "token_id": f"tok_resume_extractor_{int(now - 100)}",
            "requested_tool": "mcp_extractor.extract_and_store_resume",
            "tool_args": {"candidate_name": "Mohit Upraity", "skills_extracted": 14},
            "status": "ALLOWED_EXECUTED",
            "timestamp": now - 95,
        })
        self._log_audit({
            "event": "TOOL_INVOCATION_ALLOWED",
            "sub_agent": "opportunity_scout",
            "token_id": f"tok_opportunity_scout_{int(now - 60)}",
            "requested_tool": "mcp_scout.scout_and_store_opportunities",
            "tool_args": {"keywords": ["Fullstack", "Distributed Systems"], "domain": "jobs"},
            "status": "ALLOWED_EXECUTED",
            "timestamp": now - 50,
        })
        # 4. Blocked Scope Violation (Proof of governance)
        self._log_audit({
            "event": "SCOPE_VIOLATION_BLOCKED",
            "sub_agent": "opportunity_scout",
            "token_id": f"tok_opportunity_scout_{int(now - 30)}",
            "requested_tool": "mcp_scout.auto_apply_job",
            "tool_args": {"job_id": 99, "credit_card_id": 999},
            "allowed_tools": ["mcp_scout.scout_and_store_opportunities"],
            "reason": "TOOL_NOT_IN_DELEGATED_SCOPE",
            "status": "BLOCKED_SECURITY_VIOLATION",
            "timestamp": now - 30,
        })
