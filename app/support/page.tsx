import { PageLayout } from '@/components/PageLayout';

export default function SupportPage() {
  return (
    <PageLayout title="Support" description="Get help and support">
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8">
        <p className="text-gray-400">
          Contact support or browse help articles here.
        </p>
      </div>
    </PageLayout>
  );
}
