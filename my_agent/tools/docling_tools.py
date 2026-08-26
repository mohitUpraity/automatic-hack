"""Docling Multi-Format Document Processor & Chunker."""

import os
from typing import Any, Dict, List


def convert_document(file_path: str) -> Dict[str, Any]:
    """Converts ANY document (PDF, DOCX, Images, PPTX, HTML, TXT) to structured Markdown + Chunks.
    
    Uses Docling's DocumentConverter and HierarchicalChunker with fallback for simple text files.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    # Fallback for plain text files
    if ext in [".txt", ".md"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        
        # Simple semantic chunking for raw text (512 char chunks)
        lines = text.split("\n\n")
        chunks = []
        for i, paragraph in enumerate(lines):
            if paragraph.strip():
                chunks.append({
                    "text": paragraph.strip(),
                    "meta": {"heading": f"Section {i+1}", "page": 1}
                })

        return {
            "status": "success",
            "markdown": text,
            "chunk_count": len(chunks),
            "chunks": chunks
        }

    try:
        from docling.document_converter import DocumentConverter
        from docling_core.transforms.chunker import HierarchicalChunker

        converter = DocumentConverter()
        result = converter.convert(file_path)
        doc = result.document

        markdown = doc.export_to_markdown()

        chunker = HierarchicalChunker(
            max_tokens=512,
            overlap_tokens=50
        )
        raw_chunks = list(chunker.chunk(doc))

        chunks = []
        for chunk in raw_chunks:
            heading = ""
            if hasattr(chunk, "heading") and chunk.heading:
                heading = chunk.heading
            elif hasattr(chunk, "meta") and hasattr(chunk.meta, "headings") and chunk.meta.headings:
                heading = " > ".join(chunk.meta.headings)

            page = getattr(chunk, "page_no", None)

            chunks.append({
                "text": chunk.text,
                "meta": {
                    "heading": heading or "General",
                    "page": page
                }
            })

        return {
            "status": "success",
            "markdown": markdown,
            "chunk_count": len(chunks),
            "chunks": chunks
        }

    except Exception as e:
        # Fallback to pypdf or text reading if docling fails or is not ready
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            extracted_text = ""
            chunks = []
            for i, page in enumerate(reader.pages):
                ptext = page.extract_text() or ""
                extracted_text += f"\n--- Page {i+1} ---\n" + ptext
                if ptext.strip():
                    chunks.append({
                        "text": ptext.strip(),
                        "meta": {"heading": f"Page {i+1}", "page": i+1}
                    })
            return {
                "status": "success",
                "markdown": extracted_text,
                "chunk_count": len(chunks),
                "chunks": chunks,
                "note": f"Processed via pypdf fallback (Docling error: {str(e)})"
            }
        except Exception as fallback_err:
            raise RuntimeError(f"Failed to process document {file_path}: {str(e)} | Fallback error: {str(fallback_err)}")
