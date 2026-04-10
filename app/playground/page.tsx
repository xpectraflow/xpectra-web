"use client";

import { usePlayground, PlottedDataset } from "@/components/playground/PlaygroundContext";
import { SectionHeader } from "@/components/playground/SectionHeader";
import { TelemetryChart, CHART_PALETTE } from "@/components/playground/TelemetryChart";
import { trpc } from "@/lib/trpc";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";
import { FlaskConical, BarChart2, Cpu, Loader2, X, Database } from "lucide-react";
import Link from "next/link";

// ─── Empty states ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#1c1b1b] text-[#f97316]/60">
        <FlaskConical className="h-8 w-8" />
      </div>
      <div>
        <h2 className="font-['Manrope',sans-serif] text-lg font-semibold text-foreground">
          Select an experiment
        </h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Pick an experiment from the sidebar, then right-click a dataset and choose{" "}
          <span className="text-foreground">Plot all channels</span> to start your analysis.
        </p>
      </div>
      <Link
        href="/experiments"
        className="mt-2 rounded bg-[#1c1b1b] px-4 py-2 text-xs font-medium text-muted-foreground ring-1 ring-[#27272a] transition hover:bg-[#201f1f] hover:text-foreground"
      >
        Browse experiments →
      </Link>
    </div>
  );
}

function NoDatasetsPlottedState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#1c1b1b] text-[#f97316]/60">
        <BarChart2 className="h-8 w-8" />
      </div>
      <div>
        <h2 className="font-['Manrope',sans-serif] text-lg font-semibold text-foreground">
          No datasets plotted
        </h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Right-click a dataset in the sidebar and select{" "}
          <span className="font-medium text-foreground">Plot all channels</span> to add it to
          the canvas.
        </p>
      </div>
    </div>
  );
}

// ─── Plotted dataset block ────────────────────────────────────────────────────

function PlottedDatasetBlock({ dataset }: { dataset: PlottedDataset }) {
  const { removePlottedDataset } = usePlayground();

  // Fetch channels so we know their IDs and can assign colors
  const channelsQuery = trpc.channels.getChannels.useQuery({
    experimentId: dataset.experimentId,
    datasetId: dataset.datasetId,
  });

  const channels = channelsQuery.data ?? [];

  // Assign a stable color per channel from the palette
  const colorMap: Record<string, string> = {};
  channels.forEach((ch, i) => {
    colorMap[ch.id] = CHART_PALETTE[i % CHART_PALETTE.length];
  });

  return (
    <div className="mb-8">
      {/* Dataset header */}
      <div className="mb-4 flex items-center gap-3">
        <Database className="h-4 w-4 shrink-0 text-[#f97316]" />
        <h2 className="font-['Manrope',sans-serif] text-base font-semibold text-foreground">
          {dataset.datasetName}
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
          {channels.length} channels
        </span>
        <button
          type="button"
          onClick={() => removePlottedDataset(dataset.datasetId)}
          className="ml-auto flex items-center gap-1.5 rounded bg-[#1c1b1b] px-2 py-1 font-mono text-[11px] text-muted-foreground ring-1 ring-[#27272a] transition hover:bg-[#201f1f] hover:text-foreground"
          title="Remove from canvas"
        >
          <X className="h-3 w-3" />
          Remove
        </button>
      </div>

      {channelsQuery.isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading channels…</span>
        </div>
      ) : channels.length === 0 ? (
        <p className="py-6 text-center font-mono text-xs text-muted-foreground/40">
          No channels registered for this dataset
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {channels.map((ch) => (
            <div key={ch.id} className="rounded bg-[#1c1b1b] p-4">
              {/* Chart header */}
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: colorMap[ch.id] }}
                />
                <span className="font-['Manrope',sans-serif] text-sm font-semibold text-foreground">
                  {ch.name}
                </span>
                {ch.unit && (
                  <span className="rounded bg-[#131313] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {ch.unit}
                  </span>
                )}
              </div>

              {/* The chart — one channel per panel, full smart-fetch */}
              <TelemetryChart
                experimentId={dataset.experimentId}
                datasetId={dataset.datasetId}
                channelIds={[ch.id]}
                colorMap={colorMap}
                height={200}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#27272a] bg-[#0e0e0e] px-6">
      <div className="flex items-center gap-3">
        <Cpu className="h-4 w-4 text-[#f97316]" />
        <div>
          <span className="font-['Manrope',sans-serif] text-sm font-semibold text-foreground">
            {title ?? "Mission Control"}
          </span>
          {subtitle && (
            <span className="ml-2 font-mono text-[11px] text-muted-foreground">· {subtitle}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[#27272a]" />
          IDLE
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const { selectedExperimentId, setSelectedExperimentId, plottedDatasets, plotAllChannels } = usePlayground();
  const hasAutoPlotted = useRef(false);

  const urlExpId = searchParams.get("experimentId");
  const urlDsId  = searchParams.get("datasetId");

  // Sync selectedExperimentId with URL if present
  useEffect(() => {
    if (urlExpId && urlExpId !== selectedExperimentId) {
      setSelectedExperimentId(urlExpId);
    }
  }, [urlExpId, selectedExperimentId, setSelectedExperimentId]);

  // Handle auto-plotting from URL
  const { data: autoDsData } = trpc.datasets.getDatasetById.useQuery(
    { experimentId: urlExpId!, id: urlDsId! },
    { enabled: !!urlExpId && !!urlDsId && !hasAutoPlotted.current }
  );

  useEffect(() => {
    if (autoDsData && urlExpId && urlDsId && !hasAutoPlotted.current) {
      const isAlreadyPlotted = plottedDatasets.some((ds) => ds.datasetId === urlDsId);
      if (!isAlreadyPlotted) {
        plotAllChannels({
          datasetId: urlDsId,
          datasetName: autoDsData.name,
          experimentId: urlExpId,
        });
      }
      hasAutoPlotted.current = true;
    }
  }, [autoDsData, urlExpId, urlDsId, plotAllChannels, plottedDatasets]);

  // Fetch experiment name for the top bar
  const experimentQuery = trpc.experiments.getExperimentById.useQuery(
    { id: selectedExperimentId! },
    { enabled: !!selectedExperimentId }
  );
  const expName = experimentQuery.data?.name;

  return (
    <>
      <TopBar
        title={expName ?? "Mission Control"}
        subtitle={
          selectedExperimentId
            ? `${plottedDatasets.length} dataset${plottedDatasets.length !== 1 ? "s" : ""} plotted`
            : undefined
        }
      />

      {/* Canvas */}
      {!selectedExperimentId ? (
        <EmptyState />
      ) : plottedDatasets.length === 0 ? (
        <NoDatasetsPlottedState />
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <SectionHeader
            title="Analysis Canvas"
            subtitle="Zoom any chart to re-fetch at higher resolution · Scroll syncs all charts"
            badge={`${plottedDatasets.length} dataset${plottedDatasets.length !== 1 ? "s" : ""}`}
          />

          <div className="mt-4 space-y-2">
            {plottedDatasets.map((ds) => (
              <PlottedDatasetBlock key={ds.datasetId} dataset={ds} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center bg-[#0e0e0e]">
        <Loader2 className="h-8 w-8 animate-spin text-[#f97316]/50" />
      </div>
    }>
      <PlaygroundContent />
    </Suspense>
  );
}
