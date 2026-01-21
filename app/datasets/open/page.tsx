import { PageLayout } from '@/components/PageLayout';

export default function OpenDataPage() {
  return (
    <PageLayout
      title="Open data"
      description="Browse publicly available open datasets"
    >
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8">
        <p className="text-gray-400">
          Browse and explore open datasets available on the platform.
        </p>
      </div>
    </PageLayout>
  );
}
