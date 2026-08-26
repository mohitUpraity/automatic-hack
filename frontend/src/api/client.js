const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function uploadDocument(file, docType = 'resume') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('doc_type', docType);

  const res = await fetch(`${API_BASE}/api/documents/upload`, {
    method: 'POST',
    // DO NOT set Content-Type header — browser sets boundary automatically
    body: formData,
  });
  return await res.json();
}

export async function searchKnowledge(query, topK = 10) {
  const res = await fetch(`${API_BASE}/api/knowledge/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k: topK }),
  });
  return await res.json();
}

export async function tailorResume(opportunityTitle, companyName, requirements) {
  const res = await fetch(`${API_BASE}/api/tailor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      opportunity_title: opportunityTitle,
      company_name: companyName,
      requirements: requirements,
    }),
  });
  return await res.json();
}

export async function triggerAttack(secured = true) {
  const res = await fetch(`${API_BASE}/api/demo/trigger-attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secured }),
  });
  return await res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE}/api/audit-logs`);
  return await res.json();
}

export async function fetchProfiles() {
  const res = await fetch(`${API_BASE}/api/profiles`);
  return await res.json();
}
