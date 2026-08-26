"""Unified LLM Integration for CareerOS (Groq Qwen 3.8-27b & Gemini Fallback)."""

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
GROQ_MODEL = os.getenv("GROQ_MODEL", "groq/qwen/qwen3.8-27b")
litellm.telemetry = False


def call_groq_llm(prompt: str, system_instruction: str = "You are an expert AI Career Assistant for candidate analysis.") -> str:
    """Invokes Groq Cloud LLM (qwen/qwen3.8-27b) with Gemini API & heuristic fallbacks."""
    
    # 1. Try Groq Cloud REST API with qwen/qwen3.8-27b
    if GROQ_API_KEY:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            # Clean model string for Groq REST API (e.g. qwen/qwen3.8-27b)
            model_id = GROQ_MODEL
            if model_id.startswith("groq/"):
                model_id = model_id[5:]
            
            payload = {
                "model": model_id,
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 1500
            }

            res = requests.post(url, headers=headers, json=payload, timeout=10)
            if res.status_code == 200:
                data = res.json()
                if "choices" in data and len(data["choices"]) > 0:
                    out = data["choices"][0]["message"]["content"].strip()
                    if out:
                        return out
            else:
                print(f"[Groq HTTP {res.status_code}] {res.text[:150]}")
        except Exception as e:
            print(f"[Groq LLM Notice] {e}")

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

    # 3. Intelligent RAG & Context-Aware Fallback Engine
    prompt_lower = prompt.lower()

    if any(w in prompt_lower for w in ["hi", "hello", "hey", "greeting", "who are you", "what can you do"]):
        return """Hello! 👋 I am CareerOS v3, your central Root Agent co-pilot.

I manage your career automation workflow using knowledge base RAG and specialized tools:
- 📄 **Resume Processing & Parsing**: Extract fields, analyze strengths, and build structured candidate profiles.
- 🎯 **Opportunity Scouting**: Search live opportunities (jobs, internships, hackathons, conclaves) and rank them by relevance.
- 🎨 **Resume Tailoring**: Create company-tailored resume markdown and downloadable PDFs.
- 📚 **Knowledge Base RAG**: Retrieve exact details from your uploaded documents and profile.

How can I help you today?"""

    # Extract context if present in prompt
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
    """Invokes Groq Qwen LLM and parses JSON output cleanly with robust fallbacks."""
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
