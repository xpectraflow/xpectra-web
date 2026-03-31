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
      <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {experiment.name}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Created {new Date(experiment.createdAt).toLocaleString()}
            </p>
          </div>

          <span className="rounded-full border border-gray-700 px-2.5 py-1 text-xs text-gray-300">
            {experiment.status}
          </span>
        </div>

        <p className="whitespace-pre-wrap text-sm text-gray-300">
          {experiment.description || "No description provided."}
        </p>

        <p className="mt-4 text-xs text-gray-500">
          Last updated {new Date(experiment.updatedAt).toLocaleString()}
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/experiments/${experiment.id}/edit`}
          className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 transition hover:bg-gray-800"
        >
          Edit experiment
        </Link>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => onDelete(experiment.id)}
          className="rounded-lg border border-red-500/50 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isDeleting ? "Deleting..." : "Delete experiment"}
        </button>
      </div>
    </div>
  );
}
