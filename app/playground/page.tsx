"use client";

import { usePlayground, PlottedDataset, PlottedChannelGroup } from "@/components/playground/PlaygroundContext";
import { SectionHeader } from "@/components/playground/SectionHeader";
import { TelemetryChart, CHART_PALETTE, getGlobalId } from "@/components/playground/TelemetryChart";
import { FullscreenPanel } from "@/components/playground/FullscreenPanel";
import { trpc } from "@/lib/trpc";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense, useMemo, useState } from "react";
import { FlaskConical, BarChart2, Cpu, Loader2, X, Database } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

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

// ─── Plotted dataset block ──────────────────────────────────────────────────

function PlottedDatasetBlock({ dataset }: { dataset: PlottedDataset }) {
  const { removePlot, virtualChannels } = usePlayground();

  // Local state for independent zoom/pan per dataset block
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [linked, setLinked] = useState(true);

  const setTimeRange = useCallback((s: number, e: number) => {
    setStartTime(s);
    setEndTime(e);
  }, []);

  const initTimeRange = useCallback((s: number, e: number) => {
    setStartTime(prev => prev === null ? s : prev);
    setEndTime(prev => prev === null ? e : prev);
  }, []);

  const toggleLinked = useCallback(() => setLinked(l => !l), []);

  // 1. Fetch channels for ALL groups in this block
  const channelsQueries = trpc.useQueries((t) =>
    dataset.groups.map((g) =>
      t.channels.getChannels({
        experimentId: g.experimentId,
        datasetId: g.datasetId,
      })
    )
  );

  // 2. Consolidate all available channels across all datasets in this block
  // We identify each uniquely as datasetId:channelId
  const allConsolidated = useMemo(() => {
    const list: any[] = [];
    dataset.groups.forEach((g, idx) => {
      const raw = channelsQueries[idx].data ?? [];
      const vcs = virtualChannels.filter(vc => vc.datasetId === g.datasetId);
      
      const combined = [
        ...raw.map(c => ({ 
          ...c, 
          datasetId: g.datasetId, 
          globalId: getGlobalId(g.datasetId, c.id), 
          datasetName: g.datasetName 
        })),
        ...vcs.map(vc => ({
          id: vc.id,
          globalId: getGlobalId(g.datasetId, vc.id),
          name: vc.name,
          datasetId: vc.datasetId,
          datasetName: g.datasetName,
          sensorName: "Virtual",
          unit: "Derived",
          dataType: "float8",
          hypertableColName: "virtual"
        }))
      ];
      list.push(...combined);
    });
    return list;
  }, [dataset.groups, channelsQueries, virtualChannels]);

  // 3. Filter down to the specific channels requested in each group
  const channels = useMemo(() => {
    return allConsolidated.filter(ch => {
      const g = dataset.groups.find(group => group.datasetId === ch.datasetId);
      if (!g) return false;
      // If no specific channels requested in the group, include all from that dataset
      if (!g.channelIds || g.channelIds.length === 0) return true;
      return g.channelIds.includes(ch.id);
    });
  }, [allConsolidated, dataset.groups]);

  // 4. Assign global colors (using globalId)
  const colorMap = useMemo(() => {
    const cm: Record<string, string> = {};
    allConsolidated.forEach((ch, i) => {
      cm[ch.globalId] = CHART_PALETTE[i % CHART_PALETTE.length];
    });
    return cm;
  }, [allConsolidated]);

  // 5. Labels with Dataset context if there are collisions across datasets
  const labelMap = useMemo(() => {
    const lm: Record<string, string> = {};
    const nameCounts = new Map<string, number>();
    channels.forEach(ch => nameCounts.set(ch.name, (nameCounts.get(ch.name) || 0) + 1));
    
    const multiDataset = dataset.groups.length > 1;

    channels.forEach(ch => {
      const isCollision = (nameCounts.get(ch.name) || 0) > 1;
      let label = ch.name;
      if (isCollision && ch.sensorName && ch.sensorName !== "Virtual") {
        label = `${ch.sensorName}.${ch.name}`;
      }
      // If we are comparing datasets, always prefix with dataset name to be clear
      if (multiDataset) {
        label = `[${ch.datasetName}] ${label}`;
      }
      lm[ch.globalId] = label;
    });
    return lm;
  }, [channels, dataset.groups.length]);

  const isOverlay = dataset.layout === "overlay";
  const isLoading = channelsQueries.some(q => q.isLoading);
  const displayTitle = dataset.groups.length > 1 
    ? `Comparison: ${dataset.groups.map(g => g.datasetName).join(" vs ")}`
    : dataset.groups[0]?.datasetName ?? "Plot";

  return (
    <div className="mb-8 rounded-lg border border-[#27272a] bg-[#0e0e0e] p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3 border-b border-[#27272a] pb-4">
        <Database className="h-4 w-4 shrink-0 text-[#f97316]" />
        <div className="flex-1">
          <h2 className="font-['Manrope',sans-serif] text-base font-semibold text-foreground leading-none lowercase">
            {displayTitle}
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
            {channels.length} channels • <span className={isOverlay ? "text-[#f97316]/70" : "text-sky-400/70"}>{dataset.layout}</span>
          </p>
        </div>
        <button
          onClick={() => removePlot(dataset.id)}
          className="flex items-center gap-1.5 rounded bg-[#1c1b1b] px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground ring-1 ring-[#27272a] transition hover:bg-destructive/10 hover:text-destructive hover:ring-destructive/20"
        >
          <X className="h-3.5 w-3.5" /> Remove
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-[#f97316]/50 mr-2" />
          <span className="text-sm font-medium">Synchronizing telemetry metadata…</span>
        </div>
      ) : channels.length === 0 ? (
        <p className="py-12 text-center font-mono text-xs text-muted-foreground/40">No channels selected</p>
      ) : isOverlay ? (
        <FullscreenChartWrapper
          groups={dataset.groups}
          colorMap={colorMap}
          labelMap={labelMap}
          height={600}
          startTime={startTime}
          endTime={endTime}
          linked={linked}
          setTimeRange={setTimeRange}
          initTimeRange={initTimeRange}
          toggleLinked={toggleLinked}
          syncGroupId={dataset.id}
        >
          <div className="mb-3 flex flex-wrap gap-3">
            {channels.map((ch) => (
              <div key={ch.globalId} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: colorMap[ch.globalId] }} />
                <span className="text-[11px] font-medium text-foreground">{labelMap[ch.globalId]}</span>
                {ch.unit && <span className="font-mono text-[9px] text-muted-foreground/40 italic">[{ch.unit}]</span>}
              </div>
            ))}
          </div>
        </FullscreenChartWrapper>
      ) : (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {channels.map((ch) => {
            // Filter groups to just this specific channel's dataset/id
            const specificGroup = [{
              datasetId: ch.datasetId,
              datasetName: ch.datasetName,
              experimentId: dataset.groups.find(g => g.datasetId === ch.datasetId)!.experimentId,
              channelIds: [ch.id]
            }];
            return (
              <FullscreenChartWrapper
                key={ch.globalId}
                groups={specificGroup}
                colorMap={colorMap}
                labelMap={labelMap}
                height={350}
                startTime={startTime}
                endTime={endTime}
                linked={linked}
                setTimeRange={setTimeRange}
                initTimeRange={initTimeRange}
                toggleLinked={toggleLinked}
                syncGroupId={dataset.id}
              >
                <div className="mb-2 flex items-center gap-2 px-2 pt-1">
                  <span className="h-3 w-3 rounded-sm shrink-0" style={{ background: colorMap[ch.globalId] }} />
                  <span className="font-['Manrope',sans-serif] text-sm font-bold text-foreground truncate">{labelMap[ch.globalId]}</span>
                  {ch.unit && <span className="ml-auto rounded bg-[#0e0e0e] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/60 border border-[#27272a]">{ch.unit}</span>}
                </div>
              </FullscreenChartWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * A helper that combines FullscreenPanel and TelemetryChart with the correct ref plumbing.
 */
function FullscreenChartWrapper({
  children,
  groups,
  colorMap,
  labelMap,
  height,
  startTime,
  endTime,
  linked,
  setTimeRange,
  initTimeRange,
  toggleLinked,
  syncGroupId,
}: {
  children?: React.ReactNode;
  groups: PlottedChannelGroup[];
  colorMap: Record<string, string>;
  labelMap: Record<string, string>;
  height: number;
  startTime: number | null;
  endTime: number | null;
  linked: boolean;
  setTimeRange: (start: number, end: number) => void;
  initTimeRange: (start: number, end: number) => void;
  toggleLinked: () => void;
  syncGroupId: string;
}) {
  const fsRef = useRef<{ toggle: () => void; isFullscreen: boolean }>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <FullscreenPanel
      ref={fsRef}
      hideTrigger
      onFullscreenChange={setIsFullscreen}
      className="rounded-lg ring-1 ring-[#27272a] overflow-hidden"
    >
      <div className={`bg-[#121212] p-4 transition hover:ring-[#f97316]/20 flex flex-col telemetry-card ${isFullscreen ? "h-full" : ""}`}>
        {children}
        <TelemetryChart
          groups={groups}
          colorMap={colorMap}
          labelMap={labelMap}
          height={isFullscreen ? undefined : height}
          onToggleFullscreen={() => fsRef.current?.toggle()}
          isFullscreen={isFullscreen}
          startTime={startTime}
          endTime={endTime}
          linked={linked}
          setTimeRange={setTimeRange}
          initTimeRange={initTimeRange}
          toggleLinked={toggleLinked}
          syncGroupId={syncGroupId}
        />
      </div>
    </FullscreenPanel>
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
      const isAlreadyPlotted = plottedDatasets.some((ds) => 
        ds.groups.some(g => g.datasetId === urlDsId)
      );
      if (!isAlreadyPlotted) {
        addPlot({
          groups: [{
            datasetId: urlDsId,
            datasetName: autoDsData.name,
            experimentId: urlExpId,
            channelIds: [], // Plot all if empty (handled by PlottedDatasetBlock)
          }],
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
