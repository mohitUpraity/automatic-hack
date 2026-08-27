import React from 'react';
import { GitBranch } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import KnowledgeGraph from '../components/graph/KnowledgeGraph';

export default function KnowledgeGraphPage() {
  return (
    <PageShell
      title="Knowledge Graph"
      subtitle="Explore Obsidian-style graph connections across user skills, projects, and opportunities"
      icon={GitBranch}
    >
      <KnowledgeGraph userId="default-user" />
    </PageShell>
  );
}
