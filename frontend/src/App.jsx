import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import OpportunityPage from './pages/OpportunityPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import ObservatoryPage from './pages/ObservatoryPage';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage';
import ResumeStudioPage from './pages/ResumeStudioPage';
import ProfilePage from './pages/ProfilePage';
import { fetchStats } from './api/client';

export default function App() {
  const [stats, setStats] = useState({ total_documents: 0, total_profiles: 0 });

  useEffect(() => {
    fetchStats().then(setStats).catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
        <Sidebar stats={stats} />
        <main className="flex-1 md:ml-[260px] min-h-screen w-full">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/studio" element={<ResumeStudioPage />} />
            <Route path="/resume-studio" element={<ResumeStudioPage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/opportunity/:id" element={<OpportunityPage />} />
            <Route path="/observatory" element={<ObservatoryPage />} />
            <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
