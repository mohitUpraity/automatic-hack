import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function DocumentUploader({ onUploadSuccess, apiBaseUrl = "http://localhost:8000" }) {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('resume');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", docType);

      const response = await fetch(`${apiBaseUrl}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setResult(data);
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-4">
        <Upload className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">Upload Candidate Documents</h2>
      </div>

      <p className="text-slate-400 text-sm mb-6">
        Supports PDF, DOCX, PNG/JPG images (built-in OCR), and HTML. Powered by IBM Docling & Gemini Embeddings.
      </p>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="flex gap-4">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            Document Type:
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="resume">Resume / CV</option>
              <option value="cover_letter">Cover Letter</option>
              <option value="certificate">Certificate / Award</option>
              <option value="job_posting">Job Posting / JD</option>
              <option value="portfolio">Portfolio</option>
            </select>
          </label>
        </div>

        <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-8 text-center transition-colors">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt,.html"
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 text-slate-500" />
            <span className="text-sm font-medium text-slate-300">
              {file ? file.name : "Click to select or drag document here"}
            </span>
            <span className="text-xs text-slate-500">PDF, DOCX, PNG, JPG up to 10MB</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing with Docling & Gemini...
            </>
          ) : (
            <>Process Document & Embed</>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-950/50 border border-red-800/60 rounded-lg flex items-start gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-emerald-950/50 border border-emerald-800/60 rounded-lg flex items-start gap-3 text-emerald-300 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-emerald-200">Document Processed Successfully!</div>
            <div className="text-xs text-emerald-400 mt-1">
              Doc ID: {result.document_id} | Chunks: {result.chunk_count} | Embedded: {result.embedded_count}
            </div>
            {result.markdown_preview && (
              <div className="mt-2 p-2 bg-slate-950 rounded border border-emerald-900/40 text-slate-300 font-mono text-xs max-h-32 overflow-y-auto">
                {result.markdown_preview}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
