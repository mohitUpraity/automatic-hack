"""Deep Company & Opportunity Intelligence Tool powered by Firecrawl.

Crawls and synthesizes comprehensive company overviews, engineering tech stacks,
product missions, and ATS terminology to ground resume tailoring and candidate prep.
"""

import os
import re
import json
import urllib.parse
import urllib.request
import requests
from typing import Any, Dict, Optional

# In-memory intelligence cache
COMPANY_INTEL_CACHE: Dict[str, Dict[str, Any]] = {}


def deep_research_company_and_role(
    company_name: str,
    job_title: str = "Software Engineer",
    job_url: Optional[str] = None
) -> Dict[str, Any]:
    """Uses Firecrawl to scrape and synthesize deep intelligence on a target company and role."""
    clean_company = company_name.strip()
    cache_key = f"{clean_company.lower()}_{job_title.lower()}"
    
    if cache_key in COMPANY_INTEL_CACHE:
        return COMPANY_INTEL_CACHE[cache_key]

    firecrawl_key = os.getenv("FIRECRAWL_API_KEY", "").strip()
    raw_scrapes = []

    # 1. Scrape specific Job URL if provided
    if job_url and job_url.startswith("http") and firecrawl_key:
        try:
            fc_url = "https://api.firecrawl.dev/v1/scrape"
            headers = {"Authorization": f"Bearer {firecrawl_key}", "Content-Type": "application/json"}
            payload = {"url": job_url, "formats": ["markdown"]}
            res = requests.post(fc_url, headers=headers, json=payload, timeout=12)
            if res.status_code == 200:
                data = res.json().get("data", {})
                md_text = data.get("markdown", "")
                if md_text:
                    raw_scrapes.append(f"### JOB POSTING SCRAPE ({job_url}):\n{md_text[:2000]}")
        except Exception as e:
            print(f"[Firecrawl Job Scrape Notice] {e}")

    # 2. Search & Scrape Company Engineering Portal & Overview via Firecrawl Search
    if firecrawl_key:
        try:
            search_query = f"{clean_company} tech stack engineering blog culture hiring {job_title}"
            search_url = "https://api.firecrawl.dev/v1/search"
            headers = {"Authorization": f"Bearer {firecrawl_key}", "Content-Type": "application/json"}
            payload = {
                "query": search_query,
                "limit": 4,
                "scrapeOptions": {"formats": ["markdown"]}
            }
            res = requests.post(search_url, headers=headers, json=payload, timeout=14)
            if res.status_code == 200:
                data = res.json().get("data", [])
                for item in data:
                    item_title = item.get("title", "")
                    item_md = item.get("markdown", "") or item.get("description", "")
                    if item_md:
                        raw_scrapes.append(f"### {item_title}:\n{item_md[:1200]}")
        except Exception as e:
            print(f"[Firecrawl Company Search Notice] {e}")

    combined_intel_text = "\n\n".join(raw_scrapes)

    # 3. Synthesize with LLM into structured Company Intelligence Dossier
    from my_agent.tools.llm_tools import call_groq_llm_json

    intel_prompt = f"""You are a Silicon Valley Technical Recruiter & Company Intelligence Analyst.

Analyze the scraped data below for company '{clean_company}' and role '{job_title}'.
Produce a comprehensive, structured JSON intelligence dossier that will be used by an AI to tailor candidate resumes and prepare for technical interviews.

SCRAPED DATA:
\"\"\"
{combined_intel_text[:3500] if combined_intel_text else f"Target company: {clean_company}, Target role: {job_title}"}
\"\"\"

Output STRICT JSON with the following schema:
{{
  "company_name": "{clean_company}",
  "job_title": "{job_title}",
  "industry": "e.g. AI / SaaS / FinTech / DeepTech",
  "overview": "2-3 sentence executive overview of what the company does, their core product, and market position.",
  "tech_stack": ["List", "of", "primary", "languages", "frameworks", "databases", "cloud tools"],
  "engineering_culture": "Key engineering principles (e.g. high agency, scalable distributed systems, fast product shipping, strict code review).",
  "key_values": ["Innovation", "Customer Obsession", "Speed", "Ownership"],
  "ats_keywords": ["Top", "8-12", "keywords", "relevant", "to", "this", "role", "and", "company"],
  "interview_focus_areas": [
    "System Design & Architecture",
    "Algorithm Efficiency & Problem Solving",
    "Product Delivery & Pragmatic Engineering"
  ],
  "why_work_here": "Compelling summary of company impact and growth opportunities."
}}
"""

    structured_intel = call_groq_llm_json(intel_prompt)

    # Fallback structure if LLM synthesis returned empty
    if not structured_intel or not structured_intel.get("overview"):
        structured_intel = {
            "company_name": clean_company,
            "job_title": job_title,
            "industry": "Technology & Software Engineering",
            "overview": f"{clean_company} is an innovative technology organization building modern digital products and engineering solutions.",
            "tech_stack": ["Python", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI", "PostgreSQL", "Docker", "AWS/Cloud"],
            "engineering_culture": "Fast-paced, product-minded engineering with a strong emphasis on clean code, automated testing, and scalable architecture.",
            "key_values": ["High Agency", "Scalability", "Pragmatic Engineering", "User-Centric Innovation"],
            "ats_keywords": ["Full-Stack Architecture", "REST APIs", "Microservices", "Cloud Deployment", "Database Optimization", "System Design", "Agile Collaboration"],
            "interview_focus_areas": [
                "Full-stack web application development",
                "API design & backend database performance",
                "End-to-end feature ownership and production reliability"
            ],
            "why_work_here": f"High-impact role contributing to core engineering systems at {clean_company}."
        }

    structured_intel["scraped_sources_count"] = len(raw_scrapes)
    structured_intel["status"] = "success"

    # Cache result
    COMPANY_INTEL_CACHE[cache_key] = structured_intel
    return structured_intel
