import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, UploadCloud, RefreshCw, FileText } from 'lucide-react';
import { fetchDocuments } from '../../api/client';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function DocumentList({ refreshTrigger }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchDocuments();
      setDocuments(data?.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      // fallback mock for UI testing if API fails
      setDocuments([
        { id: '1', filename: 'Resume_2026.pdf', type: 'Resume', chunks: 14, date: '2026-08-26', content: '# Software Engineer\n\nExperienced full stack developer with 5+ years of experience building modern web applications.' },
        { id: '2', filename: 'AWS_Certificate.png', type: 'Certificate', chunks: 2, date: '2026-08-25', content: 'AWS Certified Solutions Architect - Associate.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments, refreshTrigger]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-indigo-400" />
          Uploaded Documents
          <Badge variant="primary" size="sm" className="ml-2">{documents.length}</Badge>
        </h2>
        
        <button 
          onClick={loadDocuments}
          disabled={isLoading}
          className="p-2 text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-50"
          title="Refresh documents"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" text="Loading documents..." variant="primary" />
        </div>
      ) : documents.length === 0 ? (
        <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-300 font-medium mb-1">No documents uploaded yet</p>
          <p className="text-sm text-slate-500">Upload a resume or job description to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {documents.map((doc, idx) => (
            <GlassCard key={doc.id || `doc-${idx}-${doc.filename || ''}`} hover padding="md" className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-200 truncate" title={doc.filename}>
                    {doc.filename}
                  </h3>
                </div>
                <Badge variant="secondary" size="sm">{doc.type}</Badge>
              </div>
              
              <div className="flex-grow mb-4">
                <p className="text-sm text-slate-400 line-clamp-2">
                  {doc.content?.substring(0, 150) || 'No preview available.'}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span>{doc.chunks || 0} chunks</span>
                  <span>{doc.date}</span>
                </div>
                <Badge variant="success" size="sm" dot>Ready</Badge>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
