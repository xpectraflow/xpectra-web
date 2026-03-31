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
      <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/30 p-10 text-center">
        <p className="text-sm text-gray-400">
          No experiments yet. Create your first experiment to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60">
      <table className="min-w-full divide-y divide-gray-800 text-sm">
        <thead className="bg-gray-900">
          <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {experiments.map((experiment) => (
            <tr key={experiment.id} className="hover:bg-gray-900/80">
              <td className="px-4 py-3">
                <Link
                  href={`/experiments/${experiment.id}`}
                  className="font-medium text-white transition hover:text-blue-300"
                >
                  {experiment.name}
                </Link>
                {experiment.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                    {experiment.description}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-gray-700 px-2 py-0.5 text-xs text-gray-300">
                  {experiment.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400">
                {new Date(experiment.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/experiments/${experiment.id}/edit`}
                    className="rounded-md border border-gray-700 px-2.5 py-1 text-xs text-gray-300 transition hover:bg-gray-800 hover:text-white"
                  >
                    Edit
                  </Link>
                  {onDelete && (
                    <button
                      type="button"
                      disabled={deletingId === experiment.id}
                      onClick={() => onDelete(experiment.id)}
                      className="rounded-md border border-red-500/50 px-2.5 py-1 text-xs text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-70"
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
