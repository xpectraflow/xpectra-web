import { PageLayout } from '@/components/PageLayout';

export default function DocsPage() {
  return (
    <PageLayout title="Docs" description="Documentation and guides">
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8">
        <p className="text-gray-400">
          Browse documentation and guides for the platform.
        </p>
      </div>
    </PageLayout>
  );
}
