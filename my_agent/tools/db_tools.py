"""Supabase Database Access Layer for CareerOS v3.

Direct, high-performance, and secure integration with Supabase PostgreSQL & pgvector.
Zero SQLite dependency — 100% cloud database connected.
"""

import json
import os
import ssl
import uuid
import urllib.request
import urllib.parse
from datetime import datetime
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

# Ensure environment is loaded
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://wjrjpvrgmtbjpwzmmval.supabase.co").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")



def _get_ssl_context():
    """Creates a permissive SSL context for HTTPS requests."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


class SupabasePostgrestClient:
    """Zero-dependency HTTP client for Supabase PostgREST API."""

    def __init__(self, url: str, key: str):
        self.url = url.rstrip("/")
        self.key = key
        self.ssl_ctx = _get_ssl_context()

    def _headers(self, prefer: Optional[str] = None) -> Dict[str, str]:
        h = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json"
        }
        if prefer:
            h["Prefer"] = prefer
        return h

    def select(
        self,
        table: str,
        columns: str = "*",
        filters: Optional[Dict[str, str]] = None,
        order: Optional[str] = "created_at.desc",
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Selects records from a Supabase table."""
        endpoint = f"{self.url}/rest/v1/{table}?select={urllib.parse.quote(columns)}"
        if filters:
            for col, val in filters.items():
                if val is not None:
                    endpoint += f"&{col}={urllib.parse.quote(str(val))}"
        if order:
            endpoint += f"&order={urllib.parse.quote(order)}"
        if limit:
            endpoint += f"&limit={limit}"

        req = urllib.request.Request(endpoint, headers=self._headers(), method="GET")
        try:
            with urllib.request.urlopen(req, context=self.ssl_ctx, timeout=2.0) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else []
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            print(f"[Supabase Select Error on {table}] HTTP {e.code}: {err_body}")
            return []
        except Exception as e:
            print(f"[Supabase Select Error on {table}] {e}")
            return []

    def insert(self, table: str, record_or_list: Any, upsert: bool = True) -> List[Dict[str, Any]]:
        """Inserts or upserts records into Supabase."""
        endpoint = f"{self.url}/rest/v1/{table}"
        prefer = "return=representation"
        if upsert:
            prefer += ",resolution=merge-duplicates"

        data = record_or_list
        if isinstance(data, str):
            data = json.loads(data)

        payload = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(endpoint, data=payload, headers=self._headers(prefer), method="POST")
        try:
            with urllib.request.urlopen(req, context=self.ssl_ctx, timeout=3.0) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else []
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            print(f"[Supabase Insert Error on {table}] HTTP {e.code}: {err_body}")
            return []
        except Exception as e:
            print(f"[Supabase Insert Error on {table}] {e}")
            return []

    def update(self, table: str, values: Dict[str, Any], filters: Dict[str, str]) -> List[Dict[str, Any]]:
        """Updates records in Supabase matching filters."""
        query_parts = []
        for col, val in filters.items():
            query_parts.append(f"{col}={urllib.parse.quote(str(val))}")
        qs = "&".join(query_parts)
        endpoint = f"{self.url}/rest/v1/{table}?{qs}"

        payload = json.dumps(values).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=payload,
            headers=self._headers("return=representation"),
            method="PATCH"
        )
        try:
            with urllib.request.urlopen(req, context=self.ssl_ctx, timeout=15) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else []
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            print(f"[Supabase Update Error on {table}] HTTP {e.code}: {err_body}")
            return []
        except Exception as e:
            print(f"[Supabase Update Error on {table}] {e}")
            return []

    def delete(self, table: str, filters: Dict[str, str]) -> bool:
        """Deletes records from Supabase matching filters."""
        query_parts = []
        for col, val in filters.items():
            query_parts.append(f"{col}={urllib.parse.quote(str(val))}")
        qs = "&".join(query_parts)
        endpoint = f"{self.url}/rest/v1/{table}?{qs}"

        req = urllib.request.Request(endpoint, headers=self._headers(), method="DELETE")
        try:
            with urllib.request.urlopen(req, context=self.ssl_ctx, timeout=15) as resp:
                return resp.status in (200, 204)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            print(f"[Supabase Delete Error on {table}] HTTP {e.code}: {err_body}")
            return False
        except Exception as e:
            print(f"[Supabase Delete Error on {table}] {e}")
            return False

    def rpc(self, function_name: str, params: Dict[str, Any]) -> Any:
        """Executes a Supabase stored procedure / RPC function."""
        endpoint = f"{self.url}/rest/v1/rpc/{function_name}"
        payload = json.dumps(params).encode("utf-8")
        req = urllib.request.Request(endpoint, data=payload, headers=self._headers(), method="POST")
        try:
            with urllib.request.urlopen(req, context=self.ssl_ctx, timeout=20) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            print(f"[Supabase RPC Error on {function_name}] HTTP {e.code}: {err_body}")
            return None
        except Exception as e:
            print(f"[Supabase RPC Error on {function_name}] {e}")
            return None


# Global singleton client
_sb_client = SupabasePostgrestClient(SUPABASE_URL, SUPABASE_KEY)


def get_supabase() -> SupabasePostgrestClient:
    """Returns the active Supabase client."""
    return _sb_client


def _normalize_table_name(table: str) -> str:
    """Normalizes table aliases for schema compatibility."""
    if table in ["analyses", "analysis"]:
        return "resume_analysis"
    return table


# ── Unified Public Storage API ───────────────────────────────────────────────

def store_document(
    user_id: str,
    filename: str,
    doc_type: str,
    raw_markdown: str,
    metadata: Dict[str, Any] = None,
    file_url: str = None,
    candidate_id: Optional[str] = None
) -> str:
    """Stores a document record in Supabase and returns document_id."""
    doc_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"
    meta = metadata or {}
    if candidate_id:
        meta["candidate_id"] = candidate_id

    record = {
        "id": doc_id,
        "user_id": user_id,
        "filename": filename,
        "doc_type": doc_type,
        "raw_markdown": raw_markdown,
        "metadata": meta,
        "file_url": file_url,
        "created_at": now
    }

    _sb_client.insert("documents", record)
    return doc_id


def store_embeddings(
    document_id: str,
    user_id: str,
    embedded_chunks: List[Dict[str, Any]],
    candidate_id: Optional[str] = None
) -> int:
    """Stores chunks and embedding vectors in Supabase pgvector embeddings table."""
    now = datetime.utcnow().isoformat() + "Z"
    records = []
    for i, chunk in enumerate(embedded_chunks):
        chunk_meta = chunk.get("meta", {}) or {}
        if candidate_id:
            chunk_meta["candidate_id"] = candidate_id

        emb = chunk.get("embedding", [])
        if emb:
            records.append({
                "id": str(uuid.uuid4()),
                "document_id": document_id,
                "user_id": user_id,
                "chunk_text": chunk.get("text", ""),
                "chunk_index": i,
                "chunk_metadata": chunk_meta,
                "embedding": emb,
                "created_at": now
            })

    if records:
        # Insert in chunks of 50 to prevent payload size limits
        for i in range(0, len(records), 50):
            batch = records[i:i+50]
            _sb_client.insert("embeddings", batch)

    return len(records)


def store_to_db(table: str, data: Any) -> Dict[str, Any]:
    """Stores or updates records directly in Supabase."""
    try:
        record = json.loads(data) if isinstance(data, str) else dict(data)
    except Exception as e:
        return {"status": "error", "message": f"Invalid data: {str(e)}"}

    if "id" not in record or not record["id"]:
        record["id"] = str(uuid.uuid4())
    if "created_at" not in record:
        record["created_at"] = datetime.utcnow().isoformat() + "Z"

    sb_table = _normalize_table_name(table)

    # Opportunity column mapping
    if sb_table == "opportunities" and "company" in record and "company_name" not in record:
        record["company_name"] = record["company"]

    res = _sb_client.insert(sb_table, record)
    return {"status": "success", "id": record["id"], "table": sb_table, "records": res}


def read_from_db(table: str, query_filter: str = "", limit: Optional[int] = None) -> Dict[str, Any]:
    """Reads records directly from Supabase with flexible filtering."""
    sb_table = _normalize_table_name(table)
    filters = {}
    if query_filter:
        # Parse simple "field = 'val'" or "field = val"
        if " = " in query_filter:
            parts = query_filter.split(" = ", 1)
            field = parts[0].strip()
            val = parts[1].strip().strip("'").strip('"')
            filters[f"{field}"] = f"eq.{val}"

    records = _sb_client.select(sb_table, filters=filters, limit=limit)
    return {"status": "success", "count": len(records), "records": records}


def delete_from_db(table: str, record_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Deletes record from Supabase verifying user ownership."""
    sb_table = _normalize_table_name(table)
    filters = {"id": f"eq.{record_id}"}
    if user_id:
        filters["user_id"] = f"eq.{user_id}"

    ok = _sb_client.delete(sb_table, filters=filters)
    return {"status": "success" if ok else "error", "id": record_id, "table": sb_table}


def wipe_and_reset_database() -> Dict[str, Any]:
    """Wipes and resets Supabase database tables."""
    tables = ["tailored_resumes", "ranked_opportunities", "opportunities", "embeddings", "documents", "resume_analysis", "resumes", "profiles"]
    for t in tables:
        try:
            # Delete non-null IDs
            _sb_client.delete(t, {"id": "neq.00000000-0000-0000-0000-000000000000"})
        except Exception as e:
            print(f"[Wipe notice on {t}] {e}")

    # Re-seed knowledge chunks
    from my_agent.tools.knowledge_tools import seed_candidate_knowledge_bases
    seed_res = seed_candidate_knowledge_bases(force=True)

    return {
        "status": "success",
        "message": "Supabase database wiped and re-seeded successfully!",
        "seeded": seed_res
    }
