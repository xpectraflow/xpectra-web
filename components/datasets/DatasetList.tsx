"use client";

import Link from "next/link";

type DatasetListItem = {
  id: string;
  name: string;
  status: string;
  createdAt: Date | string;
};

type DatasetListProps = {
  experimentId: string;
  datasets: DatasetListItem[];
  onDelete?: (datasetId: string) => void;
  deletingId?: string | null;
};

export function DatasetList({
  experimentId,
  datasets,
  onDelete,
  deletingId,
}: DatasetListProps) {
  if (datasets.length === 0) {
    return <p className="text-sm text-muted-foreground">No datasets created for this experiment.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Dataset</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Created</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {datasets.map((dataset) => (
            <tr key={dataset.id} className="hover:bg-accent/60">
              <td className="px-4 py-3">
                <Link
                  href={`/experiments/${experimentId}/datasets/${dataset.id}`}
                  className="font-medium text-card-foreground transition hover:text-primary"
                >
                  {dataset.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{dataset.status}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(dataset.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/experiments/${experimentId}/datasets/${dataset.id}`}
                    className="rounded-md border border-input px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                  >
                    Open
                  </Link>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(dataset.id)}
                      disabled={deletingId === dataset.id}
                      className="rounded-md border border-destructive/50 px-2.5 py-1 text-xs text-destructive-foreground transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {deletingId === dataset.id ? "Deleting..." : "Delete"}
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
