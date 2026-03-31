import { PageLayout } from '@/components/PageLayout';

export default function DiscordPage() {
  return (
    <PageLayout title="Discord" description="Join our Discord community">
      <div className="rounded-lg border border-border bg-card/50 p-8">
        <p className="text-muted-foreground">
          Join our Discord community for discussions and updates.
        </p>
      </div>
    </PageLayout>
  );
}

