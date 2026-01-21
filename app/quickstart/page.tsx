import { PageLayout } from '@/components/PageLayout';

export default function QuickstartPage() {
  return (
    <PageLayout
      title="Quickstart"
      description="Get started with the data platform"
    >
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8">
        <p className="text-gray-400">
          This is the quickstart guide. Follow these steps to begin using the
          platform.
        </p>
      </div>
    </PageLayout>
  );
}
