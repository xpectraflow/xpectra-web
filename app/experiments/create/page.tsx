"use client";

import { useRouter } from "next/navigation";
import { ExperimentForm } from "@/components/experiments/ExperimentForm";
import { PageLayout } from "@/components/PageLayout";
import { trpc } from "@/lib/trpc";

export default function CreateExperimentPage() {
  const router = useRouter();
  const createMutation = trpc.experiments.createExperiment.useMutation({
    onSuccess: (experiment) => {
      router.push(`/experiments/${experiment.id}`);
      router.refresh();
    },
  });

  return (
    <PageLayout
      title="Create experiment"
      description="Define a new experiment to organize runs and telemetry."
    >
      <ExperimentForm
        title="New experiment"
        submitLabel="Create experiment"
        isSubmitting={createMutation.isPending}
        onSubmit={async (values) => {
          await createMutation.mutateAsync({
            name: values.name,
            description: values.description || null,
            status: values.status,
          });
        }}
      />

      {createMutation.error && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          Failed to create experiment: {createMutation.error.message}
        </p>
      )}
    </PageLayout>
  );
}
