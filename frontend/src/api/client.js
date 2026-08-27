const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

const clientCache = new Map();

export function invalidateClientCache() {
  clientCache.clear();
}

async function fetchWithConfig(url, options = {}) {
  const token = authToken || localStorage.getItem('careeros_token');
  let currentUserId = null;
  try {
    const savedUser = localStorage.getItem('careeros_user');
    if (savedUser) {
      currentUserId = JSON.parse(savedUser)?.id;
    }
  } catch {}

  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (currentUserId) {
    headers['x-user-id'] = currentUserId;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });
    return res;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`[Network aborted] Request to ${url} cancelled.`);
    }
    throw error;
  }
}

export async function loginUser(credentials) {
  const res = await fetchWithConfig(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  return await res.json();
}

export async function registerUser(userData) {
  const res = await fetchWithConfig(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(err.detail || 'Registration failed');
  }
  return await res.json();
}

export async function resetDatabase() {
  const res = await fetchWithConfig(`${API_BASE}/api/database/reset`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Database reset failed' }));
    throw new Error(err.detail || 'Database reset failed');
  }
  return await res.json();
}

export async function loginWithGoogle(googleData) {
  const res = await fetchWithConfig(`${API_BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(googleData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Google login failed' }));
    throw new Error(err.detail || 'Google login failed');
  }
  return await res.json();
}

export async function uploadDocument(file, docType = 'resume', userId = null, candidateId = null, createNewPersona = false) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('doc_type', docType);
  if (userId) {
    formData.append('user_id', userId);
  }
  if (candidateId) {
    formData.append('candidate_id', candidateId);
  }
  if (createNewPersona) {
    formData.append('create_new_persona', 'true');
  }

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

export async function uploadUrl(url, docType = 'resume', userId = null) {
  const res = await fetchWithConfig(`${API_BASE}/api/documents/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, doc_type: docType, user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload URL failed' }));
    throw new Error(err.detail || 'Upload URL failed');
  }
  return await res.json();
}

export async function fetchCandidates(userId = null) {
  const url = userId ? `${API_BASE}/api/candidates?user_id=${encodeURIComponent(userId)}` : `${API_BASE}/api/candidates`;
  const res = await fetchWithConfig(url);
  if (!res.ok) return { status: 'error', candidates: [] };
  return await res.json();
}

export async function createCandidate(candidateData) {
  const res = await fetchWithConfig(`${API_BASE}/api/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidateData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create candidate persona' }));
    throw new Error(err.detail || 'Failed to create candidate persona');
  }
  return await res.json();
}

export async function deleteCandidate(candidateId) {
  const res = await fetchWithConfig(`${API_BASE}/api/candidates/${encodeURIComponent(candidateId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete candidate persona' }));
    throw new Error(err.detail || 'Failed to delete candidate persona');
  }
  return await res.json();
}

export async function reassignDocument(docId, candidateId) {
  const res = await fetchWithConfig(`${API_BASE}/api/documents/${encodeURIComponent(docId)}/reassign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidate_id: candidateId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to reassign document' }));
    throw new Error(err.detail || 'Failed to reassign document');
  }
  return await res.json();
}

export async function fetchCandidateDetails(candidateId = 'default-user') {
  const res = await fetchWithConfig(`${API_BASE}/api/candidates/${encodeURIComponent(candidateId)}`);
  if (!res.ok) return { status: 'error', candidate: null };
  return await res.json();
}

export async function saveCandidateTemplate(candidateId, resumeMarkdown) {
  const res = await fetchWithConfig(`${API_BASE}/api/candidates/${encodeURIComponent(candidateId)}/save-template`, {
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

export async function setActiveCandidateTemplate(candidateId, documentId) {
  const res = await fetchWithConfig(`${API_BASE}/api/candidates/${encodeURIComponent(candidateId)}/set-active-template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to set active template' }));
    throw new Error(err.detail || 'Failed to set active template');
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

export async function deepResearchOpportunity(oppId) {
  const res = await fetchWithConfig(`${API_BASE}/api/opportunities/${oppId}/deep-research`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Deep research failed' }));
    throw new Error(err.detail || 'Deep research failed');
  }
  return await res.json();
}

export async function deepResearchCompany(companyName, jobTitle = 'Software Engineer', jobUrl = null) {
  const res = await fetchWithConfig(`${API_BASE}/api/company/deep-research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_name: companyName, job_title: jobTitle, job_url: jobUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Company research failed' }));
    throw new Error(err.detail || 'Company research failed');
  }
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
      job_url: arg1.jobUrl || arg1.job_url || null,
      company_intel: arg1.companyIntel || arg1.company_intel || null,
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

export async function fetchStats(userId = null) {
  const url = userId ? `${API_BASE}/api/stats?user_id=${encodeURIComponent(userId)}` : `${API_BASE}/api/stats`;
  const res = await fetchWithConfig(url);
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

export async function fetchDocuments(userId = null) {
  const url = userId
    ? `${API_BASE}/api/documents?user_id=${encodeURIComponent(userId)}`
    : `${API_BASE}/api/documents`;
  const res = await fetchWithConfig(url);
  if (!res.ok) return { status: 'error', documents: [] };
  return await res.json();
}

export async function deleteDocument(docId) {
  const res = await fetchWithConfig(`${API_BASE}/api/documents/${docId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete document' }));
    throw new Error(err.detail || 'Failed to delete document');
  }
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

export async function executeAdkAgent(message, sessionId = null, userId = null) {
  const res = await fetchWithConfig(`${API_BASE}/api/adk/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId, user_id: userId }),
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

export async function fetchUserProfile(candidateId = null) {
  const query = candidateId ? `?candidate_id=${encodeURIComponent(candidateId)}` : '';
  const res = await fetchWithConfig(`${API_BASE}/api/user/profile${query}`);
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

export async function uploadUserTemplate(file, candidateId = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (candidateId) {
    formData.append('candidate_id', candidateId);
  }

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


