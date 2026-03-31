"use client";

import Link from "next/link";

type ExperimentDetailsProps = {
  experiment: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  onDelete: (id: string) => void;
  isDeleting?: boolean;
};

export function ExperimentDetails({
  experiment,
  onDelete,
  isDeleting = false,
}: ExperimentDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-card-foreground">
              {experiment.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Created {new Date(experiment.createdAt).toLocaleString()}
            </p>
          </div>

          <span className="rounded-full border border-input px-2.5 py-1 text-xs text-muted-foreground">
            {experiment.status}
          </span>
        </div>

        <p className="whitespace-pre-wrap text-sm text-card-foreground">
          {experiment.description || "No description provided."}
        </p>

        <p className="mt-4 text-xs text-muted-foreground">
          Last updated {new Date(experiment.updatedAt).toLocaleString()}
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/experiments/${experiment.id}/edit`}
          className="rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
        >
          Edit experiment
        </Link>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => onDelete(experiment.id)}
          className="rounded-lg border border-destructive/50 px-3 py-2 text-sm text-destructive-foreground transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isDeleting ? "Deleting..." : "Delete experiment"}
        </button>
      </div>
    </div>
  );
}
