const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

async function fetchWithConfig(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 30000);
  
  const headers = { ...options.headers };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(id);
    return res;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function uploadDocument(file, docType = 'resume') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('doc_type', docType);

  const res = await fetchWithConfig(`${API_BASE}/api/documents/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return await res.json();
}

export async function uploadUrl(url, docType = 'resume') {
  const res = await fetchWithConfig(`${API_BASE}/api/documents/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, doc_type: docType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload URL failed' }));
    throw new Error(err.detail || 'Upload URL failed');
  }
  return await res.json();
}

export async function fetchCandidates() {
  const res = await fetchWithConfig(`${API_BASE}/api/candidates`);
  if (!res.ok) return { status: 'error', candidates: [] };
  return await res.json();
}

export async function fetchCandidateDetails(candidateId = 'candidate_mohit') {
  const res = await fetchWithConfig(`${API_BASE}/api/candidates/${candidateId}`);
  if (!res.ok) return { status: 'error', candidate: null };
  return await res.json();
}

export async function saveCandidateTemplate(candidateId, resumeMarkdown) {
  const res = await fetchWithConfig(`${API_BASE}/api/candidates/${candidateId}/save-template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_markdown: resumeMarkdown }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to save master template' }));
    throw new Error(err.detail || 'Failed to save master template');
  }
  return await res.json();
}


export async function fetchKnowledgeGraph(userId = 'default-user', candidateId = null) {
  const url = candidateId
    ? `${API_BASE}/api/knowledge-graph/${userId}?candidate_id=${encodeURIComponent(candidateId)}`
    : `${API_BASE}/api/knowledge-graph/${userId}`;
  const res = await fetchWithConfig(url);
  if (!res.ok) return { nodes: [], links: [] };
  return await res.json();
}

export async function fetchOpportunityById(id) {
  const res = await fetchWithConfig(`${API_BASE}/api/opportunities/${id}`);
  if (!res.ok) throw new Error('Failed to fetch opportunity');
  return await res.json();
}

export function createPipelineWebSocket(sessionId) {
  const wsBase = API_BASE.replace(/^http/, 'ws');
  return new WebSocket(`${wsBase}/ws/pipeline/${sessionId}`);
}

export function createAutoPilotWebSocket(sessionId) {
  const wsBase = API_BASE.replace(/^http/, 'ws');
  return new WebSocket(`${wsBase}/ws/autopilot/${sessionId}`);
}

export async function processResumePipeline(resumeText) {
  const formData = new FormData();
  formData.append('resume_text', resumeText);

  const res = await fetchWithConfig(`${API_BASE}/api/process-resume`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Pipeline execution failed' }));
    throw new Error(err.detail || 'Pipeline execution failed');
  }
  return await res.json();
}

export async function queryDbCandidate(question, profileId = null) {
  const res = await fetchWithConfig(`${API_BASE}/api/query-db`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, profile_id: profileId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'QA query failed' }));
    throw new Error(err.detail || 'QA query failed');
  }
  return await res.json();
}

export async function searchKnowledge(query, topK = 10) {
  const res = await fetchWithConfig(`${API_BASE}/api/knowledge/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k: topK }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Search failed' }));
    throw new Error(err.detail || 'Search failed');
  }
  return await res.json();
}

export async function tailorResume(arg1, arg2, arg3, arg4, arg5) {
  let payload = {};
  if (typeof arg1 === 'object' && arg1 !== null) {
    payload = {
      opportunity_title: arg1.opportunityTitle || arg1.opportunity_title || 'Target Role',
      company_name: arg1.companyName || arg1.company_name || 'Target Company',
      requirements: arg1.requirements || 'Technical excellence',
      candidate_id: arg1.candidateId || arg1.candidate_id || null,
      resume_markdown: arg1.resumeMarkdown || arg1.resume_markdown || null,
    };
  } else {
    payload = {
      opportunity_title: arg1,
      company_name: arg2,
      requirements: arg3,
      candidate_id: arg4 || null,
      resume_markdown: arg5 || null,
    };
  }

  const res = await fetchWithConfig(`${API_BASE}/api/tailor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Tailoring failed' }));
    throw new Error(err.detail || 'Tailoring failed');
  }
  return await res.json();
}

export async function triggerAttack(secured = true) {
  const res = await fetchWithConfig(`${API_BASE}/api/demo/trigger-attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secured }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Attack simulation failed' }));
    throw new Error(err.detail || 'Attack simulation failed');
  }
  return await res.json();
}

export async function fetchStats() {
  const res = await fetchWithConfig(`${API_BASE}/api/stats`);
  if (!res.ok) return { total_documents: 0, total_profiles: 0, total_opportunities: 0, total_audit_events: 0 };
  return await res.json();
}

export async function fetchAuditLogs() {
  const res = await fetchWithConfig(`${API_BASE}/api/audit-logs`);
  if (!res.ok) return { status: 'error', logs: [] };
  return await res.json();
}

export async function fetchProfiles() {
  const res = await fetchWithConfig(`${API_BASE}/api/profiles`);
  if (!res.ok) return { status: 'error', profiles: [] };
  return await res.json();
}

export async function fetchDocuments() {
  const res = await fetchWithConfig(`${API_BASE}/api/documents`);
  if (!res.ok) return { status: 'error', documents: [] };
  return await res.json();
}

export async function fetchOpportunities(candidateId = null) {
  const url = candidateId && candidateId !== 'candidate_all'
    ? `${API_BASE}/api/opportunities?candidate_id=${encodeURIComponent(candidateId)}`
    : `${API_BASE}/api/opportunities`;
  const res = await fetchWithConfig(url);
  if (!res.ok) return { status: 'error', opportunities: [] };
  return await res.json();
}

export async function scoutProfileOpportunities(profileId) {
  const res = await fetchWithConfig(`${API_BASE}/api/profiles/${profileId}/scout`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Scout opportunities failed' }));
    throw new Error(err.detail || 'Scout opportunities failed');
  }
  return await res.json();
}

export async function fetchAdkGraph() {
  const res = await fetchWithConfig(`${API_BASE}/api/adk/graph`);
  if (!res.ok) return { name: 'my_agent', root_agent: { name: 'root_agent', sub_agents: [] } };
  return await res.json();
}

export async function executeAdkAgent(message, sessionId = null) {
  const res = await fetchWithConfig(`${API_BASE}/api/adk/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'ADK execution failed' }));
    throw new Error(err.detail || 'ADK execution failed');
  }
  return await res.json();
}

export async function runAutoPilot(inputType = 'profile_id', inputValue = '', categories = null) {
  const res = await fetchWithConfig(`${API_BASE}/api/autopilot/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input_type: inputType,
      input_value: inputValue,
      categories: categories,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Autopilot failed' }));
    throw new Error(err.detail || 'Autopilot pipeline execution failed');
  }
  return await res.json();
}

export async function refineResume(resumeMarkdown, action = 'ats_optimize', context = '') {
  const res = await fetchWithConfig(`${API_BASE}/api/resume/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resume_markdown: resumeMarkdown,
      action: action,
      context: context,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Resume refinement failed' }));
    throw new Error(err.detail || 'Resume refinement failed');
  }
  return await res.json();
}

export async function downloadResumePdf(pdfPath = null, markdown = null, filename = 'Tailored_Resume.pdf') {
  const res = await fetchWithConfig(`${API_BASE}/api/resume/download-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pdf_path: pdfPath,
      markdown: markdown,
    }),
  });
  if (!res.ok) {
    throw new Error('Failed to download PDF');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  return true;
}

export async function fetchTailoredResumes() {
  const res = await fetchWithConfig(`${API_BASE}/api/tailored-resumes`);
  if (!res.ok) return { status: 'error', tailored_resumes: [] };
  return await res.json();
}

export async function customSearchOpportunities(query, category = 'all', profileId = null) {
  const res = await fetchWithConfig(`${API_BASE}/api/opportunities/custom-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: query,
      category: category,
      profile_id: profileId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Custom search failed' }));
    throw new Error(err.detail || 'Custom search failed');
  }
  return await res.json();
}

export async function fetchUserProfile(candidateId = 'candidate_mohit') {
  const res = await fetchWithConfig(`${API_BASE}/api/user/profile?candidate_id=${encodeURIComponent(candidateId)}`);
  if (!res.ok) return { status: 'error', profile: null };
  return await res.json();
}

export async function updateUserProfile(profileData) {
  const res = await fetchWithConfig(`${API_BASE}/api/user/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update profile' }));
    throw new Error(err.detail || 'Failed to update profile');
  }
  return await res.json();
}

export async function uploadUserTemplate(file, candidateId = 'candidate_mohit') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('candidate_id', candidateId);

  const res = await fetchWithConfig(`${API_BASE}/api/user/upload-template`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Template upload failed' }));
    throw new Error(err.detail || 'Template upload failed');
  }
  return await res.json();
}

export async function extractSocialLinks(resumeMarkdown) {
  const res = await fetchWithConfig(`${API_BASE}/api/user/extract-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_markdown: resumeMarkdown }),
  });
  if (!res.ok) return { status: 'error', extracted: {} };
  return await res.json();
}


