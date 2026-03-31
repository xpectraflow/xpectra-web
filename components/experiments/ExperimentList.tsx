"use client";

import Link from "next/link";

type ExperimentListItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date | string;
};

type ExperimentListProps = {
  experiments: ExperimentListItem[];
  deletingId?: string | null;
  onDelete?: (id: string) => void;
};

export function ExperimentList({
  experiments,
  deletingId,
  onDelete,
}: ExperimentListProps) {
  if (experiments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No experiments yet. Create your first experiment to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted">
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {experiments.map((experiment) => (
            <tr key={experiment.id} className="hover:bg-accent/60">
              <td className="px-4 py-3">
                <Link
                  href={`/experiments/${experiment.id}`}
                  className="font-medium text-card-foreground transition hover:text-primary"
                >
                  {experiment.name}
                </Link>
                {experiment.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {experiment.description}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-input px-2 py-0.5 text-xs text-muted-foreground">
                  {experiment.status}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(experiment.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/experiments/${experiment.id}/edit`}
                    className="rounded-md border border-input px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                  >
                    Edit
                  </Link>
                  {onDelete && (
                    <button
                      type="button"
                      disabled={deletingId === experiment.id}
                      onClick={() => onDelete(experiment.id)}
                      className="rounded-md border border-destructive/50 px-2.5 py-1 text-xs text-destructive-foreground transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {deletingId === experiment.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
