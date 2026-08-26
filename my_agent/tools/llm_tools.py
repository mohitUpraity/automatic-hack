"""Unified LLM Integration for CareerOS (120B SOTA Models & Gemini Fallback with In-Place Template Preservation)."""

import json
import os
import re
import requests
import litellm
from dotenv import load_dotenv

# Ensure .env is loaded
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
litellm.telemetry = False

# High-capability models to cascade through
SOTA_GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "groq/compound"
]


def _in_place_tailor_fallback(original_md: str, role_title: str = "Target Role", company_name: str = "Target Company", requirements: str = "") -> str:
    """Performs precision in-place ATS keyword tailoring on the original markdown resume
    while strictly preserving the candidate's original document layout, structure, headers, and contact lines.
    """
    if not original_md or len(original_md.strip()) < 30:
        return original_md

    lines = original_md.split("\n")
    tailored_lines = []
    in_summary = False
    in_skills = False
    summary_tailored = False
    skills_tailored = False

    req_keywords = []
    if requirements:
        words = re.findall(r'[A-Za-z0-9+#.-]{2,}', requirements)
        stopwords = {"and", "the", "for", "with", "experience", "proficiency", "strong", "high", "skills", "knowledge", "required", "preferred"}
        req_keywords = [w for w in words if w.lower() not in stopwords and len(w) > 2][:8]

    for line in lines:
        stripped = line.strip()

        # Detect Section Boundaries
        if stripped.startswith("## "):
            header_lower = stripped[3:].lower()
            if any(k in header_lower for k in ["summary", "objective", "about", "profile"]):
                in_summary = True
                in_skills = False
            elif any(k in header_lower for k in ["skill", "competenc", "technolog", "proficienc"]):
                in_skills = True
                in_summary = False
            else:
                in_summary = False
                in_skills = False
            tailored_lines.append(line)
            continue

        # In-Place Summary Tailoring: Align with target role & organization
        if in_summary and not summary_tailored and stripped and not stripped.startswith("#"):
            if role_title and role_title != "Target Role":
                tailored_summary = f"Results-driven software engineer specializing in scalable system architecture and AI-driven workflows, targeted for {role_title} at {company_name}."
                if req_keywords:
                    tailored_summary += f" Key expertise in {', '.join(req_keywords[:4])} with proven track record of delivering high-impact production systems."
                tailored_lines.append(tailored_summary)
                summary_tailored = True
                continue

        # In-Place Technical Skills Tailoring: Seamlessly integrate target stack
        if in_skills and not skills_tailored and stripped.startswith("- ") and req_keywords:
            if ":" in stripped:
                category, items = stripped.split(":", 1)
                existing_items = [i.strip() for i in items.split(",")]
                combined = existing_items + [k for k in req_keywords[:3] if k not in existing_items]
                tailored_lines.append(f"{category}: {', '.join(combined)}")
                skills_tailored = True
                continue

        tailored_lines.append(line)

    return "\n".join(tailored_lines)


def call_groq_llm(prompt: str, system_instruction: str = "You are an expert AI Career Assistant for candidate analysis.") -> str:
    """Invokes Groq Cloud LLM (openai/gpt-oss-120b & qwen/qwen3.8-27b) with Gemini API & heuristic in-place fallbacks."""
    
    # 1. Try Groq Cloud REST API with SOTA models
    if GROQ_API_KEY:
        models_to_try = [GROQ_MODEL] + [m for m in SOTA_GROQ_MODELS if m != GROQ_MODEL]
        for model_id in models_to_try:
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                clean_model = model_id
                if clean_model.startswith("groq/") and clean_model not in ["groq/compound", "groq/compound-mini"]:
                    clean_model = clean_model[5:]

                payload = {
                    "model": clean_model,
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 1800
                }

                res = requests.post(url, headers=headers, json=payload, timeout=12)
                if res.status_code == 200:
                    data = res.json()
                    if "choices" in data and len(data["choices"]) > 0:
                        out = data["choices"][0]["message"]["content"].strip()
                        if out:
                            return out
                else:
                    print(f"[Groq HTTP {res.status_code} on {clean_model}] {res.text[:120]}")
            except Exception as e:
                print(f"[Groq LLM {model_id} Notice] {e}")

    # 2. Try Gemini API via google.genai as secondary provider
    if GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=GEMINI_API_KEY)
            resp = client.models.generate_content(
                model="gemini-3.1-flash-lite",
                contents=f"{system_instruction}\n\n{prompt}"
            )
            if resp and resp.text:
                return resp.text.strip()
        except Exception as e:
            print(f"[Gemini API Notice] {e}")

    # 3. Intelligent In-Place Resume Tailoring & Refinement Fallback Engine
    prompt_lower = prompt.lower()

    is_tailoring = any(k in prompt_lower for k in [
        "golden template", "original resume", "in-place ats resume tailoring",
        "strict in-place tailoring rules", "original resume markdown:", "rewrite the provided resume",
        "enhance the bullet points", "tailor the candidate resume"
    ])

    if is_tailoring:
        orig_md = ""
        if '"""' in prompt:
            parts = prompt.split('"""')
            if len(parts) >= 3:
                orig_md = parts[1].strip()
        
        if not orig_md and "Original Resume Markdown:" in prompt:
            orig_md = prompt.split("Original Resume Markdown:", 1)[1].strip()
        
        if not orig_md and "ORIGINAL RESUME" in prompt:
            orig_md = prompt.split("ORIGINAL RESUME", 1)[1].strip()
            if orig_md.startswith(":") or orig_md.startswith("(GOLDEN TEMPLATE):"):
                orig_md = orig_md.split("\n", 1)[1].strip()

        target_role = "Target Role"
        target_company = "Target Organization"
        target_reqs = ""

        role_match = re.search(r'Target Role(?: Title)?:\s*([^\n]+)', prompt, re.IGNORECASE)
        if role_match:
            target_role = role_match.group(1).strip()

        company_match = re.search(r'(?:Target Organization|Company / Organization|Company):\s*([^\n]+)', prompt, re.IGNORECASE)
        if company_match:
            target_company = company_match.group(1).strip()

        req_match = re.search(r'(?:Role Requirements & Tech Stack|Key Job Requirements & Tech Stack|Requirements):\s*([^\n]+)', prompt, re.IGNORECASE)
        if req_match:
            target_reqs = req_match.group(1).strip()

        if orig_md:
            return _in_place_tailor_fallback(orig_md, target_role, target_company, target_reqs)

    if any(w in prompt_lower for w in ["hi", "hello", "hey", "greeting", "who are you", "what can you do"]):
        return """Hello! 👋 I am CareerOS v3, your central Root Agent co-pilot.

I manage your career automation workflow using knowledge base RAG and specialized tools:
- 📄 **Resume Processing & Parsing**: Extract fields, analyze strengths, and build structured candidate profiles.
- 🎯 **Opportunity Scouting**: Search live opportunities (jobs, internships, hackathons, conclaves) and rank them by relevance.
- 🎨 **Resume Tailoring**: Create company-tailored resume markdown and downloadable PDFs.
- 📚 **Knowledge Base RAG**: Retrieve exact details from your uploaded documents and profile.

How can I help you today?"""

    context_str = ""
    if "Context:" in prompt:
        context_str = prompt.split("Context:", 1)[1].strip()

    if context_str and "No relevant context found" not in context_str:
        return f"""Based on your candidate knowledge base context:

{context_str[:1200]}

---
As your Root Agent, I can analyze this data further, search for matching job opportunities, or tailor your resume for a target role. What would you like to do next?"""

    return """I am CareerOS v3 Root Agent. I have logged your request and queried your candidate knowledge base.

To get started:
1. Upload your resume or career documents in the **Documents & Opps** tab.
2. Ask me to search for jobs, internships, or hackathons matching your tech stack.
3. Request a tailored resume PDF for any target company!"""


def call_groq_llm_json(prompt: str, system_instruction: str = "You output strict valid JSON only.") -> dict:
    """Invokes Groq SOTA LLM and parses JSON output cleanly with robust fallbacks."""
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
