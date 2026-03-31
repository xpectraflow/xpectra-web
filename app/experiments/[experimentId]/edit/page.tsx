"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ExperimentForm } from "@/components/experiments/ExperimentForm";
import { PageLayout } from "@/components/PageLayout";
import { trpc } from "@/lib/trpc";

export default function EditExperimentPage() {
  const params = useParams<{ experimentId: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();

  const experimentQuery = trpc.experiments.getExperimentById.useQuery({
    id: params.experimentId,
  });

  const updateMutation = trpc.experiments.updateExperiment.useMutation({
    onSuccess: async (experiment) => {
      await utils.experiments.getExperimentById.invalidate({
        id: experiment.id,
      });
      await utils.experiments.getExperiments.invalidate();
      router.push(`/experiments/${experiment.id}`);
      router.refresh();
    },
  });

  return (
    <PageLayout
      title="Edit experiment"
      description="Update experiment metadata and lifecycle status."
      action={
        <Link
          href={`/experiments/${params.experimentId}`}
          className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 transition hover:bg-gray-800"
        >
          Cancel
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
        <ExperimentForm
          title="Update experiment"
          submitLabel="Save changes"
          isSubmitting={updateMutation.isPending}
          initialValues={{
            name: experimentQuery.data.name,
            description: experimentQuery.data.description ?? "",
            status: experimentQuery.data.status as "draft" | "active" | "archived",
          }}
          onSubmit={async (values) => {
            await updateMutation.mutateAsync({
              id: params.experimentId,
              name: values.name,
              description: values.description || null,
              status: values.status,
            });
          }}
        />
      )}

      {updateMutation.error && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          Failed to update experiment: {updateMutation.error.message}
        </p>
      )}
    </PageLayout>
  );
}
