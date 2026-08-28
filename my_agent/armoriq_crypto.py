"""Cryptographic keypair utility for ArmorIQ multi-agent governance.

Generates and manages Ed25519/HMAC keypairs for distinct agent identities:
- root_coordinator_agent
- document_processor (Sub-Agent 1)
- resume_extractor (Sub-Agent 2)
- resume_analyzer (Sub-Agent 3)
- profile_maker (Sub-Agent 4)
- opportunity_scout (Sub-Agent 5)
- opportunity_ranker (Sub-Agent 6)
- knowledge_builder (Sub-Agent 7)
- resume_tailor (Sub-Agent 8)
"""

import base64
import hashlib
import hmac
import os
import secrets
from typing import Dict, Tuple


class AgentKeypair:
    """Represents a cryptographic keypair identity for an agent."""

    def __init__(self, agent_id: str, secret_key: bytes = None):
        self.agent_id = agent_id
        self.secret_key = secret_key or secrets.token_bytes(32)
        # Public key is derived as SHA-256 hash of secret key
        self.public_key = hashlib.sha256(self.secret_key).digest()

    def get_public_key_hex(self) -> str:
        """Returns hex-encoded public key fingerprint."""
        return self.public_key.hex()[:16]

    def sign(self, message: str) -> str:
        """Signs a message payload using HMAC-SHA256."""
        signature = hmac.new(self.secret_key, message.encode('utf-8'), hashlib.sha256).digest()
        return base64.b64encode(signature).decode('utf-8')

    def verify(self, message: str, signature_b64: str) -> bool:
        """Verifies a signature against the message payload."""
        try:
            expected = hmac.new(self.secret_key, message.encode('utf-8'), hashlib.sha256).digest()
            actual = base64.b64decode(signature_b64.encode('utf-8'))
            return hmac.compare_digest(expected, actual)
        except Exception:
            return False


def generate_pipeline_keypairs() -> Dict[str, AgentKeypair]:
    """Generates distinct cryptographic keypairs for all pipeline agents.

    Returns:
        Dict mapping agent_id -> AgentKeypair instance.
    """
    agent_ids = [
        "root_coordinator_agent",
        "document_processor",
        "resume_extractor",
        "resume_analyzer",
        "profile_maker",
        "opportunity_scout",
        "opportunity_ranker",
        "knowledge_builder",
        "resume_tailor",
        "company_intel_scout",
        "ats_evaluator",
        "lead_hr_interviewer",
        "behavioral_observer",
        "technical_evaluator",
        "db_scribe",
        "panel_synthesizer",
    ]

    keypairs = {}
    for agent_id in agent_ids:
        keypairs[agent_id] = AgentKeypair(agent_id=agent_id)

    return keypairs
