#!/usr/bin/env python3
"""Autonomous Resume Tailoring & High-Fidelity PDF Generator.

Reads a master Markdown resume, accepts a target Job Description (or URL),
contextually aligns keywords and bullets with ethical non-fabrication constraints,
and compiles ATS-friendly Markdown and publication-grade PDF outputs.
"""

import os
import sys
import argparse
import re
import requests
from dotenv import load_dotenv

# Load environment configuration
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from my_agent.tools.tailor_tools import generate_tailored_pdf, _build_native_pdf_binary
from my_agent.tools.llm_tools import call_groq_llm


def load_text_file(file_path: str) -> str:
    """Reads content from a text or markdown file."""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def save_text_file(file_path: str, content: str):
    """Writes content to a text or markdown file."""
    os.makedirs(os.path.dirname(os.path.abspath(file_path)) or ".", exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)


def fetch_jd_from_url(url: str) -> str:
    """Scrapes job description text from a job posting URL (LinkedIn, Indeed, Lever, Greenhouse, etc.)."""
    firecrawl_key = os.getenv("FIRECRAWL_API_KEY")
    if firecrawl_key:
        try:
            fc_url = "https://api.firecrawl.dev/v1/scrape"
            headers = {"Authorization": f"Bearer {firecrawl_key}", "Content-Type": "application/json"}
            payload = {"url": url, "formats": ["markdown"]}
            res = requests.post(fc_url, headers=headers, json=payload, timeout=15)
            if res.status_code == 200:
                data = res.json()
                md_text = data.get("data", {}).get("markdown", "")
                if md_text and len(md_text) > 100:
                    return md_text
        except Exception as e:
            print(f"[Firecrawl URL Fetch Notice] {e}")

    # Fallback to direct HTTP text extraction
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(res.text, "html.parser")
            for tag in soup(["script", "style", "nav", "footer"]):
                tag.decompose()
            return soup.get_text(separator="\n", strip=True)
    except Exception as e:
        print(f"[Direct HTTP Scrape Notice] {e}")

    return f"Target Job Opportunity at {url}"


def tailor_resume(resume_text: str, job_description: str) -> str:
    """Constructs a high-precision ATS optimization prompt and invokes the LLM with strict groundedness."""
    system_prompt = (
        "You are an expert resume optimizer and ATS specialist. Your task is to tailor a user's resume "
        "to perfectly align with a given job description.\n\n"
        "Strict Guidelines:\n"
        "1. DO NOT fabricate or invent any experience, skills, metrics, or company names.\n"
        "2. Rephrase existing accomplishments to use keywords and action verbs found in the job description.\n"
        "3. Reorder or highlight bullet points that directly address requirements in the job description.\n"
        "4. Retain the exact markdown formatting structure of the original resume (# Name, ## Section, - Bullets).\n"
        "5. Output ONLY the updated Markdown text without conversational introduction or wrap-up text."
    )

    user_prompt = f"### ORIGINAL RESUME:\n{resume_text}\n\n### TARGET JOB DESCRIPTION:\n{job_description[:2500]}"

    # 1. Try OpenAI API if OPENAI_API_KEY is available
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2
            )
            content = response.choices[0].message.content.strip()
            if content:
                return content
        except Exception as e:
            print(f"[OpenAI API Notice] {e}. Cascading to SOTA inference engine...")

    # 2. Try Groq SOTA (openai/gpt-oss-120b & qwen/qwen3.8-27b)
    output = call_groq_llm(prompt=user_prompt, system_instruction=system_prompt)
    if output:
        # Strip markdown fences if present
        if output.startswith("```markdown"):
            output = output[11:]
        if output.startswith("```"):
            output = output[3:]
        if output.endswith("```"):
            output = output[:-3]
        return output.strip()

    return resume_text


def main():
    parser = argparse.ArgumentParser(description="Tailor resume against job description using AI automation.")
    parser.add_argument("--resume", default="resume.md", help="Path to master resume markdown file (default: resume.md)")
    parser.add_argument("--jd", help="Target Job Description text")
    parser.add_argument("--url", help="URL of the target job posting to scrape")
    parser.add_argument("--out-md", default="tailored_resume.md", help="Output path for tailored markdown (default: tailored_resume.md)")
    parser.add_argument("--out-pdf", default="tailored_resume.pdf", help="Output path for tailored PDF (default: tailored_resume.pdf)")

    args = parser.parse_args()

    # 1. Load master resume
    if not os.path.exists(args.resume):
        print(f"Error: {args.resume} not found. Creating default master resume.md...")
        from my_agent.tools.db_tools import read_from_db
        prof_res = read_from_db("profiles")
        records = prof_res.get("records", [])
        default_md = records[0].get("raw_markdown") if records else "# Candidate Resume\n**Software Engineer**\n"
        save_text_file(args.resume, default_md)

    resume_content = load_text_file(args.resume)
    print(f"Loaded master resume from '{args.resume}' ({len(resume_content)} chars)")

    # 2. Acquire target Job Description
    jd_content = ""
    if args.url:
        print(f"Scraping job description from URL: {args.url}...")
        jd_content = fetch_jd_from_url(args.url)
    elif args.jd:
        jd_content = args.jd
    else:
        print("\nPlease paste the Job Description below.")
        print("Press Enter, then Ctrl+D (or Ctrl+Z on Windows) to submit:\n")
        try:
            jd_content = sys.stdin.read().strip()
        except KeyboardInterrupt:
            print("\nCancelled.")
            return

    if not jd_content:
        print("Job description cannot be empty.")
        return

    print("\n[1/3] Processing ATS keyword alignment via AI Engine...")
    tailored_md = tailor_resume(resume_content, jd_content)

    # 3. Save tailored markdown
    print(f"[2/3] Saving tailored markdown to '{args.out_md}'...")
    save_text_file(args.out_md, tailored_md)

    # 4. Generate high-fidelity publication-grade PDF
    print(f"[3/3] Compiling publication-grade ATS PDF to '{args.out_pdf}'...")
    pdf_res = generate_tailored_pdf(tailored_md, args.out_pdf)

    print(f"\n✨ [Success] Tailored resume successfully generated!")
    print(f"   📄 Markdown: {args.out_md}")
    print(f"   📑 PDF File: {pdf_res['pdf_path']} ({pdf_res['engine']})")


if __name__ == "__main__":
    main()
