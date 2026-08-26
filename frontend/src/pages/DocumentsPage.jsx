import { useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import UploadZone from '../components/documents/UploadZone';
import DocumentList from '../components/documents/DocumentList';
import OpportunityFeed from '../components/opportunities/OpportunityFeed';

export default function DocumentsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <PageShell
      title="Documents & Opportunities"
      subtitle="Upload documents and discover career opportunities"
      icon={FileText}
    >
      <div className="space-y-8">
        {/* Upload Section */}
        <UploadZone
          onUploadSuccess={handleUploadSuccess}
          onPipelineComplete={handleUploadSuccess}
        />

        {/* Split View: Documents + Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DocumentList refreshTrigger={refreshTrigger} />
          <OpportunityFeed />
        </div>
      </div>
    </PageShell>
  );
}
