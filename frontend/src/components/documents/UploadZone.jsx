import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Link as LinkIcon, FileText, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadDocument, uploadUrl, processResumePipeline, createPipelineWebSocket } from '../../api/client';
import AutoPilotModal from '../autopilot/AutoPilotModal';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';

const DOC_TYPES = ['Resume', 'Cover Letter', 'Certificate', 'Job Posting'];

const PIPELINE_STAGES = [
  { id: 'extract', name: 'Text Extraction' },
  { id: 'clean', name: 'Data Cleaning' },
  { id: 'structure', name: 'Information Structuring' },
  { id: 'analyze', name: 'Semantic Analysis' },
  { id: 'embed', name: 'Vector Embedding' },
  { id: 'skills', name: 'Skills Extraction' },
  { id: 'match', name: 'Opportunity Matching' },
  { id: 'finalize', name: 'Finalization' }
];

export default function UploadZone({ onUploadSuccess, onPipelineComplete }) {
  const [mode, setMode] = useState('file'); // 'file', 'url', 'text'
  const [docType, setDocType] = useState('Resume');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showAutoPilot, setShowAutoPilot] = useState(false);
  
  // File state
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // URL state
  const [url, setUrl] = useState('');

  // Text state
  const [text, setText] = useState('');
  const [pipelineProgress, setPipelineProgress] = useState(
    PIPELINE_STAGES.reduce((acc, stage) => ({ ...acc, [stage.id]: 'pending' }), {})
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadDocument(file, docType);
      setUploadResult(res);
      if (onUploadSuccess) onUploadSuccess(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!url) return;
    setIsUploading(true);
    try {
      const res = await uploadUrl(url, docType);
      setUploadResult(res);
      if (onUploadSuccess) onUploadSuccess(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextProcess = async () => {
    if (!text) return;
    setIsUploading(true);
    
    // Reset pipeline progress
    setPipelineProgress(PIPELINE_STAGES.reduce((acc, stage) => ({ ...acc, [stage.id]: 'pending' }), {}));
    
    // Start websocket (mock implementation, adapt based on actual backend)
    const sessionId = Date.now().toString();
    const ws = createPipelineWebSocket(sessionId);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.stage && data.status) {
          setPipelineProgress(prev => ({
            ...prev,
            [data.stage]: data.status
          }));
        }
      } catch (e) {
        console.error('WS Error:', e);
      }
    };

    try {
      const res = await processResumePipeline(text);
      setUploadResult(res);
      if (onPipelineComplete) onPipelineComplete(res);
      ws.close();
    } catch (err) {
      console.error(err);
      ws.close();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <GlassCard className="w-full max-w-2xl mx-auto" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-indigo-400" />
          Upload Documents
        </h2>
        
        <div className="flex bg-slate-900/50 p-1 rounded-full border border-slate-700/50">
          <button
            onClick={() => setMode('file')}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${mode === 'file' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
          >
            File
          </button>
          <button
            onClick={() => setMode('url')}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${mode === 'url' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
          >
            URL
          </button>
          <button
            onClick={() => setMode('text')}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${mode === 'text' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Text
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'file' && (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">Document Type</label>
              <select 
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-900/30'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.docx,.txt,.png,.jpg"
              />
              <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-indigo-400' : 'text-slate-500'}`} />
              <p className="text-slate-300 mb-1">
                {file ? file.name : 'Drop files here or click to browse'}
              </p>
              <p className="text-sm text-slate-500">Supports .pdf, .docx, .txt, .png, .jpg</p>
            </div>

            <button
              onClick={handleFileUpload}
              disabled={!file || isUploading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </motion.div>
        )}

        {mode === 'url' && (
          <motion.div
            key="url"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">Document Type</label>
              <select 
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste LinkedIn, GitHub, or Job posting URL..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleUrlUpload}
              disabled={!url || isUploading}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkIcon className="w-5 h-5" />}
              {isUploading ? 'Importing...' : 'Import URL'}
            </button>
          </motion.div>
        )}

        {mode === 'text' && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your resume text or job description here..."
              className="w-full h-48 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-mono text-sm"
            />

            <button
              onClick={handleTextProcess}
              disabled={!text || isUploading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              {isUploading ? 'Processing...' : 'Process with Pipeline'}
            </button>
            
            {isUploading && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium text-slate-300">Pipeline Progress</h3>
                <div className="relative border-l-2 border-slate-800 ml-3 pl-4 space-y-4 py-2">
                  {PIPELINE_STAGES.map((stage) => (
                    <div key={stage.id} className="flex items-center gap-3">
                      <div className="absolute -left-[9px] bg-slate-950 rounded-full">
                        {pipelineProgress[stage.id] === 'complete' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        {pipelineProgress[stage.id] === 'running' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                        {pipelineProgress[stage.id] === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                        {pipelineProgress[stage.id] === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-slate-700" />}
                      </div>
                      <span className={`text-sm ${
                        pipelineProgress[stage.id] === 'complete' ? 'text-slate-300' :
                        pipelineProgress[stage.id] === 'running' ? 'text-indigo-400 font-medium' :
                        pipelineProgress[stage.id] === 'error' ? 'text-red-400' : 'text-slate-500'
                      }`}>
                        {stage.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {uploadResult && !isUploading && mode !== 'text' && (
        <motion.div 
          initial={{ opacity: 0, mt: 0, height: 0 }}
          animate={{ opacity: 1, mt: 16, height: 'auto' }}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-emerald-200 font-medium text-xs">Document Processed & Embedded</p>
              <p className="text-[11px] text-emerald-400/80">Docling OCR and Gemini 768-dim vector embeddings indexed.</p>
            </div>
          </div>
          <button
            onClick={() => setShowAutoPilot(true)}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Run Career Auto-Pilot
          </button>
        </motion.div>
      )}

      {showAutoPilot && (
        <AutoPilotModal
          isOpen={showAutoPilot}
          onClose={() => setShowAutoPilot(false)}
          onComplete={() => {
            if (onPipelineComplete) onPipelineComplete();
          }}
        />
      )}
    </GlassCard>
  );
}
