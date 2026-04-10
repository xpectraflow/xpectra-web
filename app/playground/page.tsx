"use client";

import { usePlayground, PlottedDataset } from "@/components/playground/PlaygroundContext";
import { SectionHeader } from "@/components/playground/SectionHeader";
import { TelemetryChart, CHART_PALETTE } from "@/components/playground/TelemetryChart";
import { FullscreenPanel } from "@/components/playground/FullscreenPanel";
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
          Select dataset from the sidebar
        </h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Pick an experiment in the sidebar, then right-click a dataset and choose{" "}
          <span className="text-foreground">Plot channels</span> to visualize your telemetry data.
        </p>
      </div>
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
  const { removePlot, virtualChannels } = usePlayground();

  // Fetch channels so we know their IDs and can assign colors
  const channelsQuery = trpc.channels.getChannels.useQuery({
    experimentId: dataset.experimentId,
    datasetId: dataset.datasetId,
  });

  const rawChannels = channelsQuery.data ?? [];
  const datasetVirtuals = virtualChannels.filter(vc => vc.datasetId === dataset.datasetId);

  // Merge physical and virtual lists
  const allAvailableChannels = [
    ...rawChannels,
    ...datasetVirtuals.map(vc => ({
      id: vc.id,
      name: vc.name,
      sensorName: "Virtual",
      unit: "Derived",
      dataType: "float8",
      hypertableColName: "virtual"
    }))
  ];

  // Filter channels if a specific subset was requested
  const channels = dataset.channelIds
    ? allAvailableChannels.filter(ch => dataset.channelIds?.includes(ch.id))
    : allAvailableChannels;

  // Assign a stable color per channel from the palette
  const colorMap: Record<string, string> = {};
  allAvailableChannels.forEach((ch, i) => {
    colorMap[ch.id] = CHART_PALETTE[i % CHART_PALETTE.length];
  });

  const isOverlay = dataset.layout === "overlay";

  // ── Hierarchical Label Disambiguation ──────────────────────────────────────
  // Detect if any channel names collide (multiple sensors having same named channels).
  // Prefix with sensor name only on collision.
  const nameCounts = new Map<string, number>();
  channels.forEach((ch) => {
    nameCounts.set(ch.name, (nameCounts.get(ch.name) || 0) + 1);
  });

  const labelMap: Record<string, string> = {};
  channels.forEach((ch) => {
    const isCollision = (nameCounts.get(ch.name) || 0) > 1;
    labelMap[ch.id] = isCollision && ch.sensorName && ch.sensorName !== "Virtual"
      ? `${ch.sensorName}.${ch.name}`
      : ch.name;
  });

  return (
    <div className="mb-8 rounded-lg border border-[#27272a] bg-[#0e0e0e] p-6 shadow-sm">
      {/* Dataset header */}
      <div className="mb-4 flex items-center gap-3 border-b border-[#27272a] pb-4">
        <Database className="h-4 w-4 shrink-0 text-[#f97316]" />
        <div className="flex-1">
          <h2 className="font-['Manrope',sans-serif] text-base font-semibold text-foreground leading-none">
            {dataset.datasetName}
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
            {channels.length} {dataset.channelIds ? "selected" : "total"} channels •{" "}
            <span className={isOverlay ? "text-[#f97316]/70" : "text-sky-400/70"}>
              {dataset.layout.toUpperCase()} MODE
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => removePlot(dataset.id)}
          className="flex items-center gap-1.5 rounded bg-[#1c1b1b] px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground ring-1 ring-[#27272a] transition hover:bg-destructive/10 hover:text-destructive hover:ring-destructive/20"
          title="Remove plot from canvas"
        >
          <X className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>

      {channelsQuery.isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-[#f97316]/50" />
          <span className="text-sm font-medium">Synchronizing telemetry data…</span>
        </div>
      ) : channels.length === 0 ? (
        <p className="py-12 text-center font-mono text-xs text-muted-foreground/40">
          {dataset.channelIds ? "Requested channels not available" : "No telemetry channels found"}
        </p>
      ) : isOverlay ? (
        /* OVERLAY MODE: All channels in one chart */
        <FullscreenPanel className="rounded-lg ring-1 ring-[#27272a] overflow-hidden">
          <div className="bg-[#121212] p-4 flex flex-col telemetry-card">
            <div className="mb-3 flex flex-wrap gap-3">
              {channels.map((ch) => (
                <div key={ch.id} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: colorMap[ch.id] }}
                  />
                  <span className="text-[11px] font-medium text-foreground">{labelMap[ch.id]}</span>
                  {ch.unit && (
                    <span className="font-mono text-[9px] text-muted-foreground/40 italic">
                      [{ch.unit}]
                    </span>
                  )}
                </div>
              ))}
            </div>
            <TelemetryChart
              experimentId={dataset.experimentId}
              datasetId={dataset.datasetId}
              channelIds={channels.map((c) => c.id)}
              colorMap={colorMap}
              labelMap={labelMap}
              height={600}
            />
          </div>
        </FullscreenPanel>
      ) : (
        /* SEPARATE MODE: Grid of individual charts */
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
          {channels.map((ch) => (
            <FullscreenPanel key={ch.id} className="rounded-lg ring-1 ring-[#27272a] overflow-hidden">
              <div className="group bg-[#121212] p-2 transition hover:ring-[#f97316]/20 flex flex-col telemetry-card">
                <div className="mb-2 flex items-center gap-2 px-2 pt-1">
                  <span
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ background: colorMap[ch.id] }}
                  />
                  <span className="font-['Manrope',sans-serif] text-sm font-bold text-foreground truncate">
                    {labelMap[ch.id]}
                  </span>
                  {ch.unit && (
                    <span className="ml-auto rounded bg-[#0e0e0e] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/60 border border-[#27272a]">
                      {ch.unit}
                    </span>
                  )}
                </div>
                <TelemetryChart
                  experimentId={dataset.experimentId}
                  datasetId={dataset.datasetId}
                  channelIds={[ch.id]}
                  colorMap={colorMap}
                  labelMap={labelMap}
                  height={350}
                />
              </div>
            </FullscreenPanel>
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
            <span className="ml-2 font-mono text-[11px] text-muted-foreground uppercase tracking-tighter opacity-60">· {subtitle}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {/* LIVE STREAM ACTIVE */}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const { selectedExperimentId, setSelectedExperimentId, plottedDatasets, addPlot } = usePlayground();
  const hasAutoPlotted = useRef(false);

  const urlExpId = searchParams.get("experimentId");
  const urlDsId = searchParams.get("datasetId");

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
        addPlot({
          datasetId: urlDsId,
          datasetName: autoDsData.name,
          experimentId: urlExpId,
          layout: "separate",
        });
      }
      hasAutoPlotted.current = true;
    }
  }, [autoDsData, urlExpId, urlDsId, addPlot, plottedDatasets]);

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
        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          <SectionHeader
            title="Analysis Canvas"
            subtitle="Zoom any chart to re-fetch at higher resolution · Scroll syncs all charts"
            badge={`${plottedDatasets.length} dataset${plottedDatasets.length !== 1 ? "s" : ""}`}
          />

          <div className="mt-2 space-y-4">
            {plottedDatasets.map((ds) => (
              <PlottedDatasetBlock key={ds.id} dataset={ds} />
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
