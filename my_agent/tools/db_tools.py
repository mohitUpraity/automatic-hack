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

# SQLite fallback path
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "career_os.db")


def get_supabase() -> Optional[Client]:
    """Get initialized Supabase Client if environment variables are set."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if HAS_SUPABASE_LIB and url and key:
        return create_client(url, key)
    return None


def _get_sqlite_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    _ensure_sqlite_tables(conn)
    return conn


def _ensure_sqlite_tables(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT,
            name TEXT,
            avatar_url TEXT,
            target_roles TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            filename TEXT,
            doc_type TEXT,
            raw_markdown TEXT,
            metadata TEXT,
            file_url TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS embeddings (
            id TEXT PRIMARY KEY,
            document_id TEXT,
            user_id TEXT,
            chunk_text TEXT,
            chunk_index INTEGER,
            chunk_metadata TEXT,
            embedding TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS resumes (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            document_id TEXT,
            name TEXT,
            email TEXT,
            phone TEXT,
            education TEXT,
            experience TEXT,
            skills TEXT,
            projects TEXT,
            certifications TEXT,
            raw_text TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS resume_analysis (
            id TEXT PRIMARY KEY,
            resume_id TEXT,
            user_id TEXT,
            strengths TEXT,
            weaknesses TEXT,
            experience_level TEXT,
            domain_focus TEXT,
            key_technologies TEXT,
            summary TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            resume_id TEXT,
            tech_stack TEXT,
            interests TEXT,
            career_goals TEXT,
            preferred_roles TEXT,
            experience_summary TEXT,
            location_preference TEXT,
            search_keywords TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS opportunities (
            id TEXT PRIMARY KEY,
            profile_id TEXT,
            user_id TEXT,
            title TEXT,
            url TEXT,
            description TEXT,
            source TEXT,
            category TEXT,
            company_name TEXT,
            location TEXT,
            salary_range TEXT,
            deadline TEXT,
            raw_data TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS ranked_opportunities (
            id TEXT PRIMARY KEY,
            opportunity_id TEXT,
            profile_id TEXT,
            user_id TEXT,
            relevance_score INTEGER,
            match_reasons TEXT,
            rank INTEGER,
            category TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS tailored_resumes (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            profile_id TEXT,
            opportunity_id TEXT,
            tailored_markdown TEXT,
            pdf_url TEXT,
            ats_score INTEGER,
            keyword_matches TEXT,
            tailored_sections TEXT,
            company_alignment_notes TEXT,
            created_at TEXT
        );
    """)
    conn.commit()


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
        sb.table("documents").insert(record).execute()
        return doc_id

    # Fallback to SQLite
    conn = _get_sqlite_conn()
    try:
        conn.execute(
            "INSERT INTO documents (id, user_id, filename, doc_type, raw_markdown, metadata, file_url, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (doc_id, user_id, filename, doc_type, raw_markdown, json.dumps(metadata or {}), file_url, now)
        )
        conn.commit()
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
        sb.table("embeddings").insert(records).execute()
        return len(records)

    conn = _get_sqlite_conn()
    try:
        for r in records:
            conn.execute(
                "INSERT INTO embeddings (id, document_id, user_id, chunk_text, chunk_index, chunk_metadata, embedding, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (r["id"], document_id, user_id, r["chunk_text"], r["chunk_index"], json.dumps(r["chunk_metadata"]), json.dumps(r["embedding"]), now)
            )
        conn.commit()
    finally:
        conn.close()
    return len(records)


def store_to_db(table: str, data: Any) -> Dict[str, Any]:
    """Legacy & universal database table inserter."""
    try:
        record = json.loads(data) if isinstance(data, str) else dict(data)
    except Exception as e:
        return {"status": "error", "message": f"Invalid data: {str(e)}"}

    if "id" not in record or not record["id"]:
        record["id"] = str(uuid.uuid4())
    if "user_id" not in record:
        record["user_id"] = "default-user"
    record["created_at"] = datetime.now().isoformat()

    sb = get_supabase()
    if sb:
        try:
            res = sb.table(table).insert(record).execute()
            return {"status": "success", "id": record["id"], "table": table}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    conn = _get_sqlite_conn()
    try:
        table_info = conn.execute(f"PRAGMA table_info({table})").fetchall()
        valid_cols = {col["name"] for col in table_info}
        filtered = {k: v for k, v in record.items() if k in valid_cols}

        columns = ", ".join(filtered.keys())
        placeholders = ", ".join(["?"] * len(filtered))
        values = [json.dumps(v) if isinstance(v, (dict, list)) else v for v in filtered.values()]

        conn.execute(f"INSERT INTO {table} ({columns}) VALUES ({placeholders})", values)
        conn.commit()
        return {"status": "success", "id": record["id"], "table": table}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()


def read_from_db(table: str, query_filter: str = "") -> Dict[str, Any]:
    """Universal reader supporting both Supabase and SQLite."""
    sb = get_supabase()
    if sb:
        try:
            query = sb.table(table).select("*").order("created_at", desc=True)
            res = query.execute()
            return {"status": "success", "count": len(res.data), "records": res.data}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    conn = _get_sqlite_conn()
    try:
        sql = f"SELECT * FROM {table} ORDER BY rowid DESC"
        rows = conn.execute(sql).fetchall()
        results = []
        for row in rows:
            record = dict(row)
            for k, v in record.items():
                if isinstance(v, str):
                    try:
                        parsed = json.loads(v)
                        if isinstance(parsed, (list, dict)):
                            record[k] = parsed
                    except Exception:
                        pass
            results.append(record)
        return {"status": "success", "count": len(results), "records": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()
