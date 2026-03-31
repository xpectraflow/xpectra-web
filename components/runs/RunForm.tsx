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
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-card-foreground">Run</h3>

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Baseline run"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring transition focus:ring-1"
        maxLength={120}
        required
      />

      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as RunFormValues["status"])}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring transition focus:ring-1"
      >
        <option value="queued">Queued</option>
        <option value="running">Running</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
      </select>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
