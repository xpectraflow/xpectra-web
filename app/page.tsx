import { PageLayout } from '@/components/PageLayout';

export default function Home() {
  return (
    <PageLayout
      title="Dashboard"
      description="Welcome to your data platform console"
    >
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8">
        <p className="text-gray-400">
          Get started by exploring the sidebar navigation or check out the{' '}
          <a href="/quickstart" className="text-blue-400 hover:text-blue-300">
            Quickstart
          </a>{' '}
          guide.
        </p>
      </div>
    </PageLayout>
  );
}
