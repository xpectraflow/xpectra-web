import { PageLayout } from '@/components/PageLayout';

export default function DiscordPage() {
  return (
    <PageLayout title="Discord" description="Join our Discord community">
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8">
        <p className="text-gray-400">
          Join our Discord community for discussions and updates.
        </p>
      </div>
    </PageLayout>
  );
}
