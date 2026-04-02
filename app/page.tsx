'use client';

import { PageLayout } from '@/components/PageLayout';
import { Plus, Database, Zap, ArrowRight, Server } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  return (
    <PageLayout
      title="Quickstart"
      description="Welcome to your data platform console"
    >
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="mb-3 text-3xl font-bold text-foreground">
            Get started in 3 steps
          </h1>
          <p className="text-lg text-muted-foreground">
            Model your sensors, organize datasets, and orchestrate compute.
          </p>
        </div>

        {/* Steps Section */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Step 1 */}
          <div className="rounded-lg border border-border bg-card/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-foreground">
                1
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Add a sensor
              </h2>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Describe a physical or virtual sensor and what it emits.
            </p>
            <button
              onClick={() => router.push('/sensors/new')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add Sensor
            </button>
          </div>

          {/* Step 2 */}
          <div className="rounded-lg border border-border bg-card/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-muted-foreground">
                2
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                View Datasets
              </h2>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Devices become datasets you can inspect and process.
            </p>
            <Link
              href="/datasets"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Database className="h-4 w-4" />
              View My Datasets
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Step 3 */}
          <div className="rounded-lg border border-border bg-card/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-muted-foreground">
                3
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Run Compute
              </h2>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Attach jobs and automations to process data.
            </p>
            <div className="space-y-2">
              <Link
                href="/jobs"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Zap className="h-4 w-4" />
                View Jobs
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/clusters"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Server className="h-4 w-4" />
                View Clusters
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Once defined, datasets can be linked to jobs, automations, and
            clusters.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}

