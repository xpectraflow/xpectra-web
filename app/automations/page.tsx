import { PageLayout } from '@/components/PageLayout';

export default function AutomationsPage() {
  return (
    <PageLayout
      title="Automations"
      description="Configure automated workflows"
    >
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8">
        <p className="text-gray-400">
          Create and manage automated workflows here.
        </p>
      </div>
    </PageLayout>
  );
}
