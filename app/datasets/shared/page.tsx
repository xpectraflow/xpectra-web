import { PageLayout } from '@/components/PageLayout';

export default function SharedDatasetsPage() {
  return (
    <PageLayout
      title="Shared with me"
      description="Datasets shared with you by other users"
    >
      <div className="rounded-lg border border-border bg-card/50 p-8">
        <p className="text-muted-foreground">
          View datasets that have been shared with you here.
        </p>
      </div>
    </PageLayout>
  );
}

