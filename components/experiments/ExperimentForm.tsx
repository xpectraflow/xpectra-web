"use client";

import { FormEvent, useState } from "react";

export type ExperimentFormValues = {
  name: string;
  description: string;
  status: "draft" | "active" | "archived";
};

type ExperimentFormProps = {
  title: string;
  submitLabel: string;
  initialValues?: Partial<ExperimentFormValues>;
  isSubmitting?: boolean;
  onSubmit: (values: ExperimentFormValues) => Promise<void> | void;
};

export function ExperimentForm({
  title,
  submitLabel,
  initialValues,
  isSubmitting = false,
  onSubmit,
}: ExperimentFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [status, setStatus] = useState<ExperimentFormValues["status"]>(
    initialValues?.status ?? "draft",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Experiment name must have at least 2 characters.");
      return;
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      status,
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-5 text-xl font-semibold text-card-foreground">{title}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-muted-foreground">Experiment name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring transition focus:ring-1"
            placeholder="Realtime telemetry benchmark"
            maxLength={120}
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted-foreground">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring transition focus:ring-1"
            placeholder="What are you trying to validate?"
            maxLength={2000}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ExperimentFormValues["status"])
            }
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring transition focus:ring-1"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        {error && (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </form>
    </div>
  );
}
