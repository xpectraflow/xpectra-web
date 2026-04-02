"use client";

import Link from "next/link";
import { Eye, Copy, Trash2, ClipboardCopy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SensorConfig = {
  sensors?: Array<{ sensorId: string; channelIndices: number[] | null }>;
  charts?: unknown[];
};

type ExperimentListItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date | string;
  sensorConfig?: SensorConfig | null;
};

type ExperimentListProps = {
  experiments: ExperimentListItem[];
  searchQuery?: string;
  deletingId?: string | null;
  onDelete?: (id: string) => void;
};

export function ExperimentList({
  experiments,
  searchQuery = "",
  deletingId,
  onDelete,
}: ExperimentListProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const duplicateMutation = trpc.experiments.duplicateExperiment.useMutation({
    onSuccess: (exp) => {
      toast.success(`"${exp.name}" created`);
      utils.experiments.getExperiments.invalidate();
      router.push(`/experiments/create?duplicate=${exp.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const copyToClipboard = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("Experiment ID copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy ID");
    }
  };

  const filtered = experiments.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          {experiments.length === 0
            ? "No experiments yet. Create your first experiment to get started."
            : "No experiments match your search."}
        </p>
      </div>
    );
  }

  const statusBadge: Record<string, string> = {
    draft:    "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    active:   "bg-green-500/10 text-green-600 border-green-500/30",
    archived: "bg-muted/50 text-muted-foreground border-border",
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Sensors</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filtered.map((experiment) => {
            const sensorCount = experiment.sensorConfig?.sensors?.length ?? 0;

            return (
              <tr key={experiment.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/experiments/${experiment.id}`}
                    className="font-medium text-card-foreground transition hover:text-primary"
                  >
                    {experiment.name}
                  </Link>
                  {experiment.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {experiment.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                      statusBadge[experiment.status] ?? statusBadge.archived
                    }`}
                  >
                    {experiment.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {sensorCount > 0 ? `${sensorCount} sensor${sensorCount !== 1 ? "s" : ""}` : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(experiment.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Link
                      href={`/experiments/${experiment.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </Link>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(experiment.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground title=Copy ID"
                    >
                      <ClipboardCopy className="h-3.5 w-3.5" /> ID
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateMutation.mutate({ id: experiment.id })}
                      disabled={duplicateMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                    >
                      <Copy className="h-3.5 w-3.5" /> Duplicate
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        disabled={deletingId === experiment.id}
                        onClick={() => onDelete(experiment.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive-foreground transition hover:bg-destructive/10 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === experiment.id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
