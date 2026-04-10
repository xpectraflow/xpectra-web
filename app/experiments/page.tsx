"use client";

import Link from "next/link";
import { useState } from "react";
import { ExperimentList } from "@/components/experiments/ExperimentList";
import { Plus, Search } from 'lucide-react';
import { PageLayout } from "@/components/PageLayout";
import { trpc } from "@/lib/trpc";

export default function ExperimentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const utils = trpc.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const experimentsQuery = trpc.experiments.getExperiments.useQuery();
  const rulesQuery = trpc.rules.getRules.useQuery();
  
  const deleteMutation = trpc.experiments.deleteExperiment.useMutation({
    onSuccess: async () => {
      await utils.experiments.getExperiments.invalidate();
      setDeletingId(null);
    },
    onError: () => {
      setDeletingId(null);
    },
  });

  return (
    <PageLayout
      title="Experiments"
      description="Setup and view your experiments."
      action={
        <Link
          href="/experiments/create"
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 shadow-lg shadow-primary/10"
        >
          <Plus className="h-4 w-4 mr-1.5 inline-block" />
          New experiment
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search experiments by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>

        {(experimentsQuery.isLoading || rulesQuery.isLoading) && (
          <div className="space-y-4">
            <div className="h-32 w-full animate-pulse rounded-xl border border-border bg-muted/20" />
            <div className="h-32 w-full animate-pulse rounded-xl border border-border bg-muted/20" />
          </div>
        )}

        {experimentsQuery.error && (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
            Failed to load experiments: {experimentsQuery.error.message}
          </p>
        )}

        {experimentsQuery.data && (
          <ExperimentList
            experiments={experimentsQuery.data}
            allRules={rulesQuery.data ?? []}
            searchQuery={searchQuery}
            deletingId={deletingId}
            onDelete={(id) => {
              setDeletingId(id);
              deleteMutation.mutate({ id });
            }}
          />
        )}
      </div>
    </PageLayout>
  );
}

