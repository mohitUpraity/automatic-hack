import { Shield } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import AgentWorkflowGraph from '../components/observatory/AgentWorkflowGraph';
import ExecutionTimeline from '../components/observatory/ExecutionTimeline';
import AuditTrail from '../components/observatory/AuditTrail';
import ShieldDemo from '../components/observatory/ShieldDemo';

export default function ObservatoryPage() {
  return (
    <PageShell
      title="ArmorIQ Observatory"
      subtitle="Real-time agent workflows, audit trail, and security governance"
      icon={Shield}
    >
      <div className="space-y-8">
        {/* Agent Workflow Graph */}
        <AgentWorkflowGraph />

        {/* Execution Timeline */}
        <ExecutionTimeline />

        {/* Two-column: Audit Trail + Shield Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AuditTrail />
          <ShieldDemo />
        </div>
      </div>
    </PageShell>
  );
}
