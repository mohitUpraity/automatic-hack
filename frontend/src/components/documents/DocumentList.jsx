import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, UploadCloud, RefreshCw, FileText, Trash2, Eye, X, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchDocuments, deleteDocument } from '../../api/client';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function DocumentList({ refreshTrigger, selectedCandidateId = 'candidate_all' }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchDocuments();
      setDocuments(data?.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments, refreshTrigger]);

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${filename || 'this document'}"?`)) {
      return;
    }

    setDeletingId(docId);
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setStatusMessage({ type: 'success', text: `Document "${filename}" deleted successfully.` });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Delete document failed:', err);
      setStatusMessage({ type: 'error', text: `Failed to delete document: ${err.message || 'Server error'}` });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-indigo-400" />
          Ingested Documents & Provenance
          <Badge variant="primary" size="sm" className="ml-2">{documents.length}</Badge>
        </h2>
        
        <button 
          onClick={loadDocuments}
          disabled={isLoading}
          className="p-2 text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-50 cursor-pointer rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700"
          title="Refresh documents"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {statusMessage && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fade-in ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
            : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" text="Loading documents from database..." variant="primary" />
        </div>
      ) : documents.length === 0 ? (
        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center bg-slate-950/40">
          <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-3">
            <UploadCloud className="w-7 h-7 text-slate-500" />
          </div>
          <p className="text-slate-200 font-bold mb-1">No Ingested Documents Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Upload candidate resumes or job specifications above. Docling multi-modal OCR will extract sections and build vector provenance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc, idx) => {
            const isDeleting = deletingId === doc.id;
            const docType = doc.doc_type || doc.type || 'Resume';
            const filename = doc.filename || doc.name || `Document_${idx + 1}`;
            const created = doc.created_at ? new Date(doc.created_at).toLocaleDateString() : (doc.date || 'Recent');
            const previewText = doc.raw_markdown || doc.content || doc.summary || 'Document parsed and indexed into vector knowledge base.';

            return (
              <GlassCard key={doc.id || `doc-${idx}`} hover padding="md" className="flex flex-col h-full bg-slate-900/70 border-slate-800/80 group">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0 border border-indigo-500/20">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-xs text-slate-200 truncate" title={filename}>
                      {filename}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="secondary" size="sm">{docType}</Badge>
                  </div>
                </div>
                
                <div className="flex-grow mb-3">
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50">
                    {previewText.substring(0, 180)}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-400">{created}</span>
                    <Badge variant="success" size="sm" dot>Docling OCR</Badge>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition cursor-pointer"
                      title="Preview Document Markdown"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, filename)}
                      disabled={isDeleting}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer disabled:opacity-50"
                      title="Delete Document"
                    >
                      {isDeleting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-100">{previewDoc.filename || 'Document Preview'}</span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950/30">
              {previewDoc.raw_markdown || previewDoc.content || 'No text extracted.'}
            </div>
            <div className="p-3 border-t border-slate-800 flex justify-end bg-slate-950/60">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
