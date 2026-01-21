import { PageLayout } from '@/components/PageLayout';

export default function ClustersPage() {
  return (
    <PageLayout
      title="Clusters"
      description="Manage your compute clusters"
    >
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8">
        <p className="text-gray-400">
          View and manage your compute clusters here.
        </p>
      </div>
    </PageLayout>
  );
}
