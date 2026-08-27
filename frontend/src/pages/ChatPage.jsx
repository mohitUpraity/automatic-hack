import { MessageSquare } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import ChatInterface from '../components/chat/ChatInterface';

export default function ChatPage() {
  return (
    <PageShell title="AI Chat Hub" subtitle="Chat with your AI career assistant powered by RAG" icon={MessageSquare}>
      <ChatInterface />
    </PageShell>
  );
}
