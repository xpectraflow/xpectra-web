import { PageLayout } from '@/components/PageLayout';

export default function JobsPage() {
  return (
    <PageLayout title="Jobs" description="Monitor and manage your jobs">
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8">
        <p className="text-gray-400">
          View the status and history of your jobs here.
        </p>
      </div>
    </PageLayout>
  );
}
