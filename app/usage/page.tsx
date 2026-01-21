import { PageLayout } from '@/components/PageLayout';
import { UsageCard } from '@/components/UsageCard';

export default function UsagePage() {
  return (
    <PageLayout
      title="Subscription capacity"
      description="Usage and limits for the current billing period"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Row 1: 3 cards */}
        <UsageCard
          title="Submitted tasks"
          subtitle="In the last 30 days"
          value="0"
          footer="of 250 (0%)"
          progress={0}
          variant="default"
        />

        <UsageCard
          title="Data egress"
          subtitle="In the last 30 days"
          value="363.0 KiB"
          footer="of 500.0 MiB (0%)"
          progress={0.07}
          variant="accent"
        />

        <UsageCard
          title="Dataset storage"
          subtitle="Total used size in bytes"
          value="0 B"
          footer="of 500.0 MiB (0%)"
          progress={0}
          variant="default"
        />

        {/* Row 2: 2 cards */}
        <UsageCard
          title="Managed datasets"
          subtitle="Total number of created datasets"
          value="1"
          footer="of 2 (50%)"
          progress={50}
          variant="accent"
        />

        <UsageCard
          title="Collections"
          subtitle="Total number of dataset collections"
          value="0"
          footer="Unlimited"
          progress={0}
          variant="unlimited"
        />
      </div>
    </PageLayout>
  );
}
