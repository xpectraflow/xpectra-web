"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ExperimentDetails } from "@/components/experiments/ExperimentDetails";
import { PageLayout } from "@/components/PageLayout";
import { DatasetForm } from "@/components/datasets/DatasetForm";
import { DatasetList } from "@/components/datasets/DatasetList";
import { trpc } from "@/lib/trpc";

export default function ExperimentDetailsPage() {
  const params = useParams<{ experimentId: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingDatasetId, setDeletingDatasetId] = useState<string | null>(null);

  const experimentQuery = trpc.experiments.getExperimentById.useQuery({
    id: params.experimentId,
  });

  const deleteMutation = trpc.experiments.deleteExperiment.useMutation({
    onSuccess: () => {
      router.push("/experiments");
      router.refresh();
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const datasetsQuery = trpc.datasets.getDatasets.useQuery({
    experimentId: params.experimentId,
  });

  const createDatasetMutation = trpc.datasets.createDataset.useMutation({
    onSuccess: async () => {
      await utils.datasets.getDatasets.invalidate({ experimentId: params.experimentId });
    },
  });

  const deleteDatasetMutation = trpc.datasets.deleteDataset.useMutation({
    onSuccess: async () => {
      await utils.datasets.getDatasets.invalidate({ experimentId: params.experimentId });
      setDeletingDatasetId(null);
    },
    onError: () => {
      setDeletingDatasetId(null);
    },
  });

  return (
    <PageLayout
      title="Experiment details"
      description="Review and manage this experiment."
      action={
        <Link
          href="/experiments"
          className="rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
        >
          Back to experiments
        </Link>
      }
    >
      {experimentQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading experiment...</p>
      )}

      {experimentQuery.error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          Failed to load experiment: {experimentQuery.error.message}
        </p>
      )}

      {experimentQuery.data && (
        <div className="space-y-6">
          <ExperimentDetails
            experiment={experimentQuery.data}
            isDeleting={isDeleting}
            onDelete={(id) => {
              setIsDeleting(true);
              deleteMutation.mutate({ id });
            }}
          />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Datasets</h2>

            <DatasetForm
              submitLabel="Create dataset"
              isSubmitting={createDatasetMutation.isPending}
              onSubmit={async (values) => {
                await createDatasetMutation.mutateAsync({
                  experimentId: params.experimentId,
                  name: values.name,
                  status: values.status,
                });
              }}
            />

            {createDatasetMutation.error && (
              <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                Failed to create dataset: {createDatasetMutation.error.message}
              </p>
            )}

            {datasetsQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Loading datasets...</p>
            )}

            {datasetsQuery.error && (
              <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                Failed to load datasets: {datasetsQuery.error.message}
              </p>
            )}

            {datasetsQuery.data && (
              <DatasetList
                experimentId={params.experimentId}
                datasets={datasetsQuery.data}
                deletingId={deletingDatasetId}
                onDelete={(datasetId) => {
                  setDeletingDatasetId(datasetId);
                  deleteDatasetMutation.mutate({
                    experimentId: params.experimentId,
                    id: datasetId,
                  });
                }}
              />
            )}
          </section>
        </div>
      )}
    </PageLayout>
  );
}
