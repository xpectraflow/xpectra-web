"use client";

import Link from "next/link";
import { useState } from "react";
import { ExperimentList } from "@/components/experiments/ExperimentList";
import { PageLayout } from "@/components/PageLayout";
import { trpc } from "@/lib/trpc";

export default function ExperimentsPage() {
  const utils = trpc.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const experimentsQuery = trpc.experiments.getExperiments.useQuery();
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
      description="Track and manage your telemetry experiments."
      action={
        <Link
          href="/experiments/create"
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          New experiment
        </Link>
      }
    >
      {experimentsQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading experiments...</p>
      )}

      {experimentsQuery.error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          Failed to load experiments: {experimentsQuery.error.message}
        </p>
      )}

      {experimentsQuery.data && (
        <ExperimentList
          experiments={experimentsQuery.data}
          deletingId={deletingId}
          onDelete={(id) => {
            setDeletingId(id);
            deleteMutation.mutate({ id });
          }}
        />
      )}
    </PageLayout>
  );
}
