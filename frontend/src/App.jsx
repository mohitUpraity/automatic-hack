import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import OpportunityPage from './pages/OpportunityPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import ObservatoryPage from './pages/ObservatoryPage';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage';
import ResumeStudioPage from './pages/ResumeStudioPage';
import ProfilePage from './pages/ProfilePage';
import InterviewRoomPage from './pages/InterviewRoomPage';
import { fetchStats } from './api/client';

function AppLayout() {
  const [stats, setStats] = useState({ total_documents: 0, total_profiles: 0 });
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats().then(setStats).catch(console.error);
    }
  }, [isAuthenticated]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
      <Sidebar stats={stats} />
      <main className="flex-1 lg:ml-[260px] min-h-screen w-full">
        <Routes>
          <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/studio" element={<ProtectedRoute><ResumeStudioPage /></ProtectedRoute>} />
          <Route path="/resume-studio" element={<ProtectedRoute><ResumeStudioPage /></ProtectedRoute>} />
          <Route path="/opportunities" element={<ProtectedRoute><OpportunitiesPage /></ProtectedRoute>} />
          <Route path="/interview" element={<ProtectedRoute><InterviewRoomPage /></ProtectedRoute>} />
          <Route path="/interview/:id" element={<ProtectedRoute><InterviewRoomPage /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
          <Route path="/opportunity/:id" element={<ProtectedRoute><OpportunityPage /></ProtectedRoute>} />
          <Route path="/observatory" element={<ProtectedRoute><ObservatoryPage /></ProtectedRoute>} />
          <Route path="/knowledge-graph" element={<ProtectedRoute><KnowledgeGraphPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

