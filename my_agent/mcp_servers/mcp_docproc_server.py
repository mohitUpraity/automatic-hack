"""MCP Server Tool for Sub-Agent 1: document_processor."""

from ..tools.docling_tools import convert_document
from ..tools.embedding_tools import embed_chunks
from ..tools.db_tools import store_document, store_embeddings


def process_and_embed_document(file_path: str, user_id: str = "default-user", doc_type: str = "resume") -> dict:
    """Converts multi-format document, chunks, embeds, and stores in database.

    Authorized Scope: 'documents:write', 'embeddings:write'
    """
    doc_res = convert_document(file_path)
    if doc_res.get("status") == "error":
        return doc_res

    filename = file_path.split("/")[-1]
    doc_id = store_document(user_id, filename, doc_type, doc_res["markdown"], {"chunk_count": doc_res["chunk_count"]})
    embedded = embed_chunks(doc_res["chunks"])
    stored_count = store_embeddings(doc_id, user_id, embedded)

    return {
        "status": "success",
        "document_id": doc_id,
        "filename": filename,
        "chunk_count": doc_res["chunk_count"],
        "embedded_count": stored_count,
        "markdown_preview": doc_res["markdown"][:300]
    }
