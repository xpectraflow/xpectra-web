"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ExperimentDetails } from "@/components/experiments/ExperimentDetails";
import { PageLayout } from "@/components/PageLayout";
import { trpc } from "@/lib/trpc";

export default function ExperimentDetailsPage() {
  const params = useParams<{ experimentId: string }>();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

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
        <ExperimentDetails
          experiment={experimentQuery.data}
          isDeleting={isDeleting}
          onDelete={(id) => {
            setIsDeleting(true);
            deleteMutation.mutate({ id });
          }}
        />
      )}
    </PageLayout>
  );
}
