"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/PageLayout";
import { trpc } from "@/lib/trpc";
import { Search, Plus, X, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

type SelectedSensor = { sensorId: string; channelIndices: number[] | null };

export default function CreateExperimentPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "archived">("draft");
  const [sensorSearch, setSensorSearch] = useState("");
  const [selectedSensors, setSelectedSensors] = useState<SelectedSensor[]>([]);
  const [expandedSensors, setExpandedSensors] = useState<Set<string>>(new Set());

  const { data: sensors = [], isLoading: sensorsLoading } = trpc.sensors.getSensors.useQuery();

  const createMutation = trpc.experiments.createExperiment.useMutation({
    onSuccess: (experiment) => {
      toast.success("Experiment created successfully");
      router.push(`/experiments/${experiment.id}`);
    },
    onError: (err) => {
      toast.error(`Failed: ${err.message}`);
    },
  });

  const filteredSensors = sensors.filter(
    (s) =>
      s.name.toLowerCase().includes(sensorSearch.toLowerCase()) ||
      s.serialNumber?.toLowerCase().includes(sensorSearch.toLowerCase())
  );

  const isSelected = (sensorId: string) =>
    selectedSensors.some((s) => s.sensorId === sensorId);

  const toggleSensor = (sensorId: string) => {
    setSelectedSensors((prev) =>
      isSelected(sensorId)
        ? prev.filter((s) => s.sensorId !== sensorId)
        : [...prev, { sensorId, channelIndices: null }]
    );
  };

  const toggleExpand = (sensorId: string) => {
    setExpandedSensors((prev) => {
      const next = new Set(prev);
      next.has(sensorId) ? next.delete(sensorId) : next.add(sensorId);
      return next;
    });
  };

  const removeSensor = (sensorId: string) => {
    setSelectedSensors((prev) => prev.filter((s) => s.sensorId !== sensorId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Experiment name must be at least 2 characters.");
      return;
    }
    await createMutation.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      sensors: selectedSensors.length > 0 ? selectedSensors : undefined,
    });
  };

  const selectedSensorDetails = selectedSensors
    .map((s) => sensors.find((sensor) => sensor.id === s.sensorId))
    .filter(Boolean);

  return (
    <PageLayout
      title="Create Experiment"
      description="Group sensors into an experiment to capture telemetry runs."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-card-foreground">Experiment Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Experiment Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="e.g. Bridge Load Test Jul 2026"
                maxLength={120}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                placeholder="What are you testing?"
                maxLength={2000}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sensor Picker */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-card-foreground">Sensors</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add sensors to capture data from in this experiment.
              </p>
            </div>
            {selectedSensors.length > 0 && (
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {selectedSensors.length} selected
              </span>
            )}
          </div>

          {/* Selected Sensors Summary */}
          {selectedSensorDetails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSensorDetails.map((sensor) => (
                sensor && (
                  <div
                    key={sensor.id}
                    className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    <Activity className="h-3 w-3" />
                    {sensor.name}
                    <button
                      type="button"
                      onClick={() => removeSensor(sensor.id)}
                      className="ml-1 rounded-full hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sensors..."
              value={sensorSearch}
              onChange={(e) => setSensorSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Sensor Cards */}
          {sensorsLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading sensors...</p>
          ) : filteredSensors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {sensors.length === 0
                ? "No sensors found. Create a sensor first."
                : "No sensors match your search."}
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredSensors.map((sensor) => {
                const selected = isSelected(sensor.id);
                const expanded = expandedSensors.has(sensor.id);

                return (
                  <div
                    key={sensor.id}
                    className={`rounded-lg border transition-colors ${
                      selected
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-card/50 hover:bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSensor(sensor.id)}
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {selected && <Plus className="h-3 w-3 rotate-45" />}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">{sensor.name}</span>
                          {sensor.serialNumber && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">#{sensor.serialNumber}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">{sensor.channelCount} ch</span>
                          {sensor.calibratedAt && (
                            <span className="text-xs text-muted-foreground">
                              Cal: {new Date(sensor.calibratedAt).toLocaleDateString()}
                            </span>
                          )}
                          {sensor.description && (
                            <span className="text-xs text-muted-foreground truncate">{sensor.description}</span>
                          )}
                        </div>
                      </div>

                      {/* Expand toggle */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(sensor.id)}
                        className="flex-shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Expanded: sensor matrix info */}
                    {expanded && (
                      <div className="border-t border-border px-4 pb-3 pt-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Calibration Matrix ({sensor.channelCount}×{sensor.channelCount})
                        </p>
                        {sensor.calibrationMatrix ? (
                          <div className="overflow-x-auto">
                            <table className="text-xs font-mono">
                              <tbody>
                                {(sensor.calibrationMatrix as number[][]).map((row, ri) => (
                                  <tr key={ri}>
                                    {row.map((val, ci) => (
                                      <td
                                        key={ci}
                                        className="px-2 py-0.5 text-right text-foreground/80 border border-border/50 bg-muted/30"
                                      >
                                        {val.toFixed(4)}
                                      </td>
                                    ))}
                                    <td className="px-2 py-0.5 text-right text-primary/80 border border-border/50 bg-primary/5 font-medium">
                                      +{(sensor.bias as number[])?.[ri]?.toFixed(4) ?? "0.0000"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <p className="text-xs text-muted-foreground mt-1">↑ Last column = bias</p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No calibration matrix defined.</p>
                        )}

                        {sensor.sensorSheetUrl && (
                          <a
                            href={sensor.sensorSheetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs text-primary hover:underline"
                          >
                            View data sheet →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {createMutation.isPending ? "Creating..." : "Create Experiment"}
          </button>
        </div>
      </form>
    </PageLayout>
  );
}
