import React, { useState } from 'react';
import DocumentUploader from './components/DocumentUploader';
import KnowledgeBase from './components/KnowledgeBase';
import ResumeTailor from './components/ResumeTailor';
import ArmorIQConsole from './components/ArmorIQConsole';
import { Shield, Sparkles, Database, FileText } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('ingest');

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-12">
      {/* Header Bar */}
      <header className="bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">CareerOS v3</h1>
              <p className="text-xs text-slate-400">ArmorIQ Multi-Agent Governance & Docling RAG Engine</p>
            </div>
          </div>

          <div className="flex gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('ingest')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'ingest' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Document Ingestion
            </button>
            <button
              onClick={() => setActiveTab('rag')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'rag' ? 'bg-purple-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Database className="w-4 h-4" />
              RAG Knowledge Search
            </button>
            <button
              onClick={() => setActiveTab('tailor')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'tailor' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Resume Tailoring
            </button>
            <button
              onClick={() => setActiveTab('armoriq')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'armoriq' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              ArmorIQ Shield
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        {activeTab === 'ingest' && <DocumentUploader />}
        {activeTab === 'rag' && <KnowledgeBase />}
        {activeTab === 'tailor' && <ResumeTailor />}
        {activeTab === 'armoriq' && <ArmorIQConsole />}
      </main>
    </div>
  );
}
