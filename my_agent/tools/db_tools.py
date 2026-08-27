"""Supabase Client & Data Access Layer for CareerOS v3."""

import json
import os
import sqlite3
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

# Supabase imports
try:
    from supabase import create_client, Client
    HAS_SUPABASE_LIB = True
except ImportError:
    HAS_SUPABASE_LIB = False
    Client = Any

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "career_os.db")


def _get_sqlite_conn():
    """Returns SQLite database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_supabase() -> Optional[Client]:
    """Get initialized Supabase Client if environment variables are set."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if HAS_SUPABASE_LIB and url and key:
        try:
            return create_client(url, key)
        except Exception:
            return None
    return None


# ── Unified Public Storage API ───────────────────────────────────────────────

def store_document(
    user_id: str,
    filename: str,
    doc_type: str,
    raw_markdown: str,
    metadata: Dict[str, Any] = None,
    file_url: str = None
) -> str:
    """Stores a document record and returns document_id."""
    doc_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    record = {
        "id": doc_id,
        "user_id": user_id,
        "filename": filename,
        "doc_type": doc_type,
        "raw_markdown": raw_markdown,
        "metadata": metadata or {},
        "file_url": file_url,
        "created_at": now
    }

    sb = get_supabase()
    if sb:
        try:
            sb.table("documents").insert(record).execute()
            return doc_id
        except Exception as e:
            print(f"[Supabase Document Notice] {e}")

    # Fallback SQLite
    conn = _get_sqlite_conn()
    try:
        conn.execute(
            "INSERT INTO documents (id, user_id, filename, doc_type, raw_markdown, metadata, file_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (doc_id, user_id, filename, doc_type, raw_markdown, json.dumps(metadata or {}), file_url, now)
        )
        conn.commit()
    except Exception as e:
        print(f"[SQLite Document Notice] {e}")
    finally:
        conn.close()

    return doc_id


def store_embeddings(document_id: str, user_id: str, embedded_chunks: List[Dict[str, Any]]) -> int:
    """Stores chunks and embedding vectors in Supabase pgvector or SQLite."""
    now = datetime.now().isoformat()
    records = []
    for i, chunk in enumerate(embedded_chunks):
        records.append({
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "user_id": user_id,
            "chunk_text": chunk.get("text", ""),
            "chunk_index": i,
            "chunk_metadata": chunk.get("meta", {}),
            "embedding": chunk.get("embedding", []),
            "created_at": now
        })

    sb = get_supabase()
    if sb:
        try:
            sb.table("embeddings").insert(records).execute()
            return len(records)
        except Exception as e:
            print(f"[Supabase Embedding Notice] {e}")

    # Fallback SQLite
    conn = _get_sqlite_conn()
    try:
        for r in records:
            conn.execute(
                "INSERT INTO embeddings (id, document_id, user_id, chunk_text, chunk_index, chunk_metadata, embedding, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (r["id"], r["document_id"], r["user_id"], r["chunk_text"], r["chunk_index"], json.dumps(r["chunk_metadata"]), json.dumps(r["embedding"]), now)
            )
        conn.commit()
    except Exception as e:
        print(f"[SQLite Embedding Notice] {e}")
    finally:
        conn.close()

    return len(records)


def store_to_db(table: str, data: Any) -> Dict[str, Any]:
    """Universal database table inserter with automatic SQLite fallback."""
    try:
        record = json.loads(data) if isinstance(data, str) else dict(data)
    except Exception as e:
        return {"status": "error", "message": f"Invalid data: {str(e)}"}

    if "id" not in record or not record["id"]:
        record["id"] = str(uuid.uuid4())
    if "user_id" not in record:
        record["user_id"] = "default-user"
    if "created_at" not in record:
        record["created_at"] = datetime.now().isoformat()

    sb = get_supabase()
    if sb:
        try:
            res = sb.table(table).insert(record).execute()
            return {"status": "success", "id": record["id"], "table": table}
        except Exception as e:
            print(f"[Supabase Storage Notice] {e}")

    # Fallback SQLite
    conn = _get_sqlite_conn()
    try:
        columns = list(record.keys())
        placeholders = ", ".join(["?"] * len(columns))
        col_names = ", ".join(columns)
        values = [json.dumps(v) if isinstance(v, (dict, list)) else v for v in record.values()]
        conn.execute(f"INSERT OR REPLACE INTO {table} ({col_names}) VALUES ({placeholders})", values)
        conn.commit()
        return {"status": "success", "id": record["id"], "table": table}
    except Exception as e:
        return {"status": "error", "message": f"SQLite error: {str(e)}"}
    finally:
        conn.close()


def read_from_db(table: str, query_filter: str = "") -> Dict[str, Any]:
    """Universal reader supporting Supabase with SQLite fallback."""
    sb = get_supabase()
    if sb:
        try:
            query = sb.table(table).select("*").order("created_at", desc=True)
            if query_filter:
                if " = " in query_filter:
                    parts = query_filter.split(" = ", 1)
                    field = parts[0].strip()
                    val = parts[1].strip().strip("'").strip('"')
                    query = query.eq(field, val)
            res = query.execute()
            if res.data:
                return {"status": "success", "count": len(res.data), "records": res.data}
            return {"status": "success", "count": 0, "records": []}
        except Exception as e:
            print(f"[Supabase Read Notice] {e}")

    # Fallback SQLite
    conn = _get_sqlite_conn()
    try:
        sql = f"SELECT * FROM {table}"
        if query_filter:
            sql += f" WHERE {query_filter}"
        sql += " ORDER BY created_at DESC"
        cursor = conn.execute(sql)
        rows = [dict(r) for r in cursor.fetchall()]
        return {"status": "success", "count": len(rows), "records": rows}
    except Exception as e:
        return {"status": "error", "message": f"SQLite read error: {str(e)}", "records": []}
    finally:
        conn.close()
