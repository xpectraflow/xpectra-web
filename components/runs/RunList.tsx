"use client";

import Link from "next/link";

type RunListItem = {
  id: string;
  name: string;
  status: string;
  createdAt: Date | string;
};

type RunListProps = {
  experimentId: string;
  runs: RunListItem[];
  onDelete?: (runId: string) => void;
  deletingId?: string | null;
};

export function RunList({
  experimentId,
  runs,
  onDelete,
  deletingId,
}: RunListProps) {
  if (runs.length === 0) {
    return <p className="text-sm text-gray-400">No runs created for this experiment.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60">
      <table className="min-w-full divide-y divide-gray-800 text-sm">
        <thead className="bg-gray-900 text-xs uppercase tracking-wider text-gray-400">
          <tr>
            <th className="px-4 py-3 text-left">Run</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Created</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {runs.map((run) => (
            <tr key={run.id} className="hover:bg-gray-900/80">
              <td className="px-4 py-3">
                <Link
                  href={`/experiments/${experimentId}/runs/${run.id}`}
                  className="font-medium text-white transition hover:text-blue-300"
                >
                  {run.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-300">{run.status}</td>
              <td className="px-4 py-3 text-gray-400">
                {new Date(run.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/experiments/${experimentId}/runs/${run.id}`}
                    className="rounded-md border border-gray-700 px-2.5 py-1 text-xs text-gray-300 transition hover:bg-gray-800"
                  >
                    Open
                  </Link>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(run.id)}
                      disabled={deletingId === run.id}
                      className="rounded-md border border-red-500/50 px-2.5 py-1 text-xs text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {deletingId === run.id ? "Deleting..." : "Delete"}
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
