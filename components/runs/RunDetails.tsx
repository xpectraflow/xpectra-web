"use client";

type RunDetailsProps = {
  run: {
    id: string;
    name: string;
    status: string;
    createdAt: Date | string;
  };
};

export function RunDetails({ run }: RunDetailsProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">{run.name}</h2>
        <span className="rounded-full border border-gray-700 px-2.5 py-1 text-xs text-gray-300">
          {run.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-400">
        Created {new Date(run.createdAt).toLocaleString()}
      </p>
    </div>
  );
}
