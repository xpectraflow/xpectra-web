import { PageLayout } from '@/components/PageLayout';

export default function SupportPage() {
  return (
    <PageLayout title="Support" description="Get help and support">
      <div className="rounded-lg border border-border bg-card/50 p-8">
        <p className="text-muted-foreground">
          Contact support or browse help articles here.
        </p>
      </div>
    </PageLayout>
  );
}

