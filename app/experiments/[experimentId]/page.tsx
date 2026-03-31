"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ExperimentDetails } from "@/components/experiments/ExperimentDetails";
import { PageLayout } from "@/components/PageLayout";
import { RunForm } from "@/components/runs/RunForm";
import { RunList } from "@/components/runs/RunList";
import { trpc } from "@/lib/trpc";

export default function ExperimentDetailsPage() {
  const params = useParams<{ experimentId: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);

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

  const runsQuery = trpc.runs.getRuns.useQuery({
    experimentId: params.experimentId,
  });

  const createRunMutation = trpc.runs.createRun.useMutation({
    onSuccess: async () => {
      await utils.runs.getRuns.invalidate({ experimentId: params.experimentId });
    },
  });

  const deleteRunMutation = trpc.runs.deleteRun.useMutation({
    onSuccess: async () => {
      await utils.runs.getRuns.invalidate({ experimentId: params.experimentId });
      setDeletingRunId(null);
    },
    onError: () => {
      setDeletingRunId(null);
    },
  });

  return (
    <PageLayout
      title="Experiment details"
      description="Review and manage this experiment."
      action={
        <Link
          href="/experiments"
          className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 transition hover:bg-gray-800"
        >
          Back to experiments
        </Link>
      }
    >
      {experimentQuery.isLoading && (
        <p className="text-sm text-gray-400">Loading experiment...</p>
      )}

      {experimentQuery.error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
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
            <h2 className="text-lg font-semibold text-white">Runs</h2>

            <RunForm
              submitLabel="Create run"
              isSubmitting={createRunMutation.isPending}
              onSubmit={async (values) => {
                await createRunMutation.mutateAsync({
                  experimentId: params.experimentId,
                  name: values.name,
                  status: values.status,
                });
              }}
            />

            {createRunMutation.error && (
              <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                Failed to create run: {createRunMutation.error.message}
              </p>
            )}

            {runsQuery.isLoading && (
              <p className="text-sm text-gray-400">Loading runs...</p>
            )}

            {runsQuery.error && (
              <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                Failed to load runs: {runsQuery.error.message}
              </p>
            )}

            {runsQuery.data && (
              <RunList
                experimentId={params.experimentId}
                runs={runsQuery.data}
                deletingId={deletingRunId}
                onDelete={(runId) => {
                  setDeletingRunId(runId);
                  deleteRunMutation.mutate({
                    experimentId: params.experimentId,
                    id: runId,
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
