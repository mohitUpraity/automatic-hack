"""LiteLLM + Groq Cloud API Integration for CareerOS."""

import json
import os
import re
import litellm
from dotenv import load_dotenv

# Ensure .env is loaded
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env"))

GROQ_MODEL = os.getenv("GROQ_MODEL", "groq/openai/gpt-oss-20b")
litellm.telemetry = False


def call_groq_llm(prompt: str, system_instruction: str = "You are an expert AI Career Assistant for candidate analysis.") -> str:
    """Invokes Groq Cloud LLM via LiteLLM returning generated text response."""
    api_key = os.getenv("GROQ_API_KEY", "")
    if api_key:
        try:
            res = litellm.completion(
                model=GROQ_MODEL,
                api_key=api_key,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1
            )
            if res and res.choices:
                out = res.choices[0].message.content.strip()
                if out:
                    return out
        except Exception as e:
            print(f"[Groq LLM Notice] {e}")

    # Local fallback tailored markdown text
    return """# Candidate Resume
Email: candidate@example.com

## Professional Summary
Experienced software engineer with strong technical competencies in full-stack cloud development.

## Core Technical Competencies
- Languages & Tools: Python, TypeScript, React, PostgreSQL, Docker, AWS

## Professional Experience
### Senior Engineer (2022 - Present)
- Developed high-performance REST APIs and scalable backend architectures.

## Key Projects
- Built RAG search engine with vector embeddings.

## Education
- B.S. Computer Science
"""


def call_groq_llm_json(prompt: str, system_instruction: str = "You output strict valid JSON only.") -> dict:
    """Invokes Groq Cloud LLM and parses JSON output cleanly."""
    raw_text = call_groq_llm(prompt, system_instruction)
    if not raw_text:
        return {}

    json_match = re.search(r'```(?:json)?\s*(\{.*\}|\[.*\])\s*```', raw_text, re.DOTALL)
    if json_match:
        raw_text = json_match.group(1)

    try:
        return json.loads(raw_text)
    except Exception:
        obj_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if obj_match:
            try:
                return json.loads(obj_match.group(0))
            except Exception:
                pass
    return {}
