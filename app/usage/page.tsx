import { PageLayout } from '@/components/PageLayout';

export default function UsagePage() {
  return (
    <PageLayout title="Usage" description="Platform usage statistics and metrics">
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8">
        <p className="text-gray-400">
          View your platform usage statistics and metrics here.
        </p>
      </div>
    </PageLayout>
  );
}
