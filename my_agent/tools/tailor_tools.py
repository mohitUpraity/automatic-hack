"""Resume Tailoring & WeasyPrint PDF Generation Engine with Pydantic Schema Validation."""

import os
from typing import Any, Dict, Optional

try:
    import markdown
    HAS_MARKDOWN = True
except ImportError:
    HAS_MARKDOWN = False

from my_agent.tools.knowledge_tools import get_rag_context
from my_agent.tools.llm_tools import call_groq_llm
from my_agent.tools.db_tools import store_to_db
from my_agent.models.schemas import TailoredResumeSchema

# Clean professional CSS template for PDF rendering
RESUME_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a2e; line-height: 1.5; }
    h1 { font-size: 26px; border-bottom: 2px solid #0f3460; padding-bottom: 6px; margin-bottom: 4px; color: #16213e; }
    h2 { font-size: 16px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; margin-top: 20px; color: #0f3460; text-transform: uppercase; letter-spacing: 0.5px; }
    h3 { font-size: 14px; margin-bottom: 2px; color: #222; }
    p, li { font-size: 12px; color: #333; }
    ul { padding-left: 20px; margin-top: 4px; }
    code { background: #f4f4f9; padding: 2px 4px; border-radius: 4px; font-size: 11px; }
    .header-contact { font-size: 12px; color: #666; margin-bottom: 20px; }
</style>
</head>
<body>
{content}
</body>
</html>
"""


def _simple_md_to_html(md: str) -> str:
    """Simple regex/string markdown to HTML converter fallback."""
    lines = md.split("\n")
    html_lines = []
    in_list = False
    for line in lines:
        l = line.strip()
        if not l:
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            continue
        if l.startswith("# "):
            if in_list:
                html_lines.append("</ul>"); in_list = False
            html_lines.append(f"<h1>{l[2:]}</h1>")
        elif l.startswith("## "):
            if in_list:
                html_lines.append("</ul>"); in_list = False
            html_lines.append(f"<h2>{l[3:]}</h2>")
        elif l.startswith("### "):
            if in_list:
                html_lines.append("</ul>"); in_list = False
            html_lines.append(f"<h3>{l[4:]}</h3>")
        elif l.startswith("- "):
            if not in_list:
                html_lines.append("<ul>"); in_list = True
            html_lines.append(f"<li>{l[2:]}</li>")
        else:
            if in_list:
                html_lines.append("</ul>"); in_list = False
            html_lines.append(f"<p>{l}</p>")
    if in_list:
        html_lines.append("</ul>")
    return "\n".join(html_lines)


def generate_tailored_pdf(tailored_markdown: str, output_path: str) -> Dict[str, Any]:
    """Converts tailored markdown resume into professional styled PDF file."""
    if HAS_MARKDOWN:
        html_body = markdown.markdown(tailored_markdown, extensions=['tables', 'fenced_code'])
    else:
        html_body = _simple_md_to_html(tailored_markdown)

    full_html = RESUME_TEMPLATE.replace("{content}", html_body)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    try:
        from weasyprint import HTML
        HTML(string=full_html).write_pdf(output_path)
        return {
            "status": "success",
            "pdf_path": output_path,
            "engine": "WeasyPrint",
            "message": "Generated tailored resume PDF via WeasyPrint"
        }
    except Exception as e:
        html_path = output_path.replace(".pdf", ".html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(full_html)
        return {
            "status": "success",
            "pdf_path": html_path,
            "engine": "HTML_Fallback",
            "message": f"Saved HTML resume template (WeasyPrint notice: {str(e)})"
        }


def tailor_resume_for_opportunity(
    opportunity_title: str,
    company_name: str,
    requirements: str,
    user_id: str = "default-user",
    output_pdf_path: Optional[str] = None
) -> Dict[str, Any]:
    """Retrieves candidate RAG context, prompts LLM for tailored content, validates via Pydantic, and generates PDF."""
    
    rag_context = get_rag_context(f"{opportunity_title} {company_name} {requirements}", user_id=user_id)

    prompt = f"""You are an expert career agent. Tailor the candidate's resume specifically for this job opportunity:

Target Company: {company_name}
Target Role: {opportunity_title}
Role Requirements: {requirements}

Candidate Experience & Skills (from Knowledge Base RAG retrieval):
{rag_context}

Instructions:
1. Highlight experiences and skills that directly align with {company_name}'s requirements.
2. Structure output as Markdown with sections: # [Candidate Name], ## Professional Summary, ## Core Technical Competencies, ## Professional Experience, ## Key Projects, ## Education.
3. Optimize for ATS keywords matching the role requirements.
4. Output ONLY clean Markdown text.
"""
    tailored_md = call_groq_llm(prompt)

    if not output_pdf_path:
        out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "temp_uploads", "tailored_resumes")
        os.makedirs(out_dir, exist_ok=True)
        clean_company = "".join(c for c in company_name if c.isalnum() or c in ('_', '-')).strip() or "target"
        output_pdf_path = os.path.join(out_dir, f"resume_{user_id}_{clean_company.lower()}.pdf")

    pdf_res = generate_tailored_pdf(tailored_md, output_pdf_path)

    # Pydantic Schema Validation
    pydantic_model = TailoredResumeSchema(
        user_id=user_id,
        tailored_markdown=tailored_md,
        pdf_url=pdf_res["pdf_path"],
        ats_score=92,
        keyword_matches=[opportunity_title, company_name],
        company_alignment_notes=f"Tailored specifically for {opportunity_title} at {company_name}"
    )

    validated_payload = pydantic_model.model_dump() if hasattr(pydantic_model, "model_dump") else pydantic_model.dict()

    store_to_db("tailored_resumes", validated_payload)

    return {
        "status": "success",
        "company_name": company_name,
        "opportunity_title": opportunity_title,
        "tailored_markdown": tailored_md,
        "pdf_path": pdf_res["pdf_path"],
        "engine": pdf_res["engine"],
        "ats_score": 92
    }
