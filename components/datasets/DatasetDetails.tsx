"use client";

type DatasetDetailsProps = {
  dataset: {
    id: string;
    name: string;
    status: string;
    createdAt: Date | string;
  };
};

export function DatasetDetails({ dataset }: DatasetDetailsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-card-foreground">{dataset.name}</h2>
        <span className="rounded-full border border-input px-2.5 py-1 text-xs text-muted-foreground">
          {dataset.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Created {new Date(dataset.createdAt).toLocaleString()}
      </p>
    </div>
  );
}
