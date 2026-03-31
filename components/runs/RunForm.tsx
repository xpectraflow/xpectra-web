"use client";

import { FormEvent, useState } from "react";

export type RunFormValues = {
  name: string;
  status: "queued" | "running" | "completed" | "failed";
};

type RunFormProps = {
  submitLabel: string;
  isSubmitting?: boolean;
  initialValues?: Partial<RunFormValues>;
  onSubmit: (values: RunFormValues) => Promise<void> | void;
};

export function RunForm({
  submitLabel,
  isSubmitting = false,
  initialValues,
  onSubmit,
}: RunFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [status, setStatus] = useState<RunFormValues["status"]>(
    initialValues?.status ?? "queued",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ name: name.trim(), status });
    if (!initialValues) {
      setName("");
      setStatus("queued");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <h3 className="text-sm font-semibold text-white">Run</h3>

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Baseline run"
        className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none ring-blue-500 transition focus:ring-1"
        maxLength={120}
        required
      />

      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as RunFormValues["status"])}
        className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none ring-blue-500 transition focus:ring-1"
      >
        <option value="queued">Queued</option>
        <option value="running">Running</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
      </select>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
