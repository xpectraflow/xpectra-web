import { PageLayout } from '@/components/PageLayout';
import { SessionStatusCard } from "@/components/auth/SessionStatusCard";

export default function Home() {
  return (
    <PageLayout
      title="Dashboard"
      description="Welcome to your data platform console"
    >
      <div className="rounded-lg border border-border bg-card/50 p-8">
        <p className="text-muted-foreground">
          Get started by exploring the sidebar navigation or check out the{' '}
          <a href="/quickstart" className="text-primary hover:opacity-90">
            Quickstart
          </a>{' '}
          guide.
        </p>
        <div className="mt-6 rounded-lg border border-border bg-background/50 p-4">
          <h2 className="mb-2 text-sm font-medium text-foreground">
            tRPC auth bootstrap
          </h2>
          <SessionStatusCard />
        </div>
      </div>
    </PageLayout>
  );
}

