import { PageLayout } from '@/components/PageLayout';

export default function DocsPage() {
  return (
    <PageLayout title="Docs" description="Documentation and guides">
      <div className="rounded-lg border border-border bg-card/50 p-8">
        <p className="text-muted-foreground">
          Browse documentation and guides for the platform.
        </p>
      </div>
    </PageLayout>
  );
}

