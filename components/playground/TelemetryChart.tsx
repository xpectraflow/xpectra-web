"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsInstance } from "echarts-for-react";
import * as echarts from "echarts";
import { Loader2, AlertCircle, BarChart2, Link2, Link2Off } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlaygroundTimeStore } from "@/stores/playgroundTime";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TelemetryChartProps {
  experimentId: string;
  datasetId: string;
  /** The specific channel IDs to plot in this panel */
  channelIds: string[];
  /** Map of channelId -> color for consistent palette */
  colorMap: Record<string, string>;
  /** Map of channelId -> display name (hierarchical disambiguation) */
  labelMap?: Record<string, string>;
  height?: number;
}

// ─── Color palette (matches the dark McLaren/mission-control aesthetic) ───────

export const CHART_PALETTE = [
  "#f97316", // orange  (brand)
  "#38bdf8", // sky blue
  "#a78bfa", // violet
  "#34d399", // emerald
  "#fb7185", // rose
  "#fbbf24", // amber
  "#22d3ee", // cyan
  "#c084fc", // purple
];

// ─── Time formatter ───────────────────────────────────────────────────────────

function autoTimeFormatter(rangeMs: number) {
  if (rangeMs < 60_000)        return "{HH}:{mm}:{ss}";
  if (rangeMs < 3_600_000)     return "{HH}:{mm}:{ss}";
  if (rangeMs < 86_400_000)    return "{MM}-{dd} {HH}:{mm}";
  return "{yyyy}-{MM}-{dd}";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TelemetryChart({
  experimentId,
  datasetId,
  channelIds,
  colorMap,
  labelMap,
  height = 200,
}: TelemetryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useRef(false);
  const [chartInstance, setChartInstance] = useState<EChartsInstance | null>(null);

  const { startTime, endTime, linked, setTimeRange, toggleLinked } = usePlaygroundTimeStore();

  // ── Initialize time range from dataset if not yet set ──────────────────────
  const timeRangeQuery = trpc.telemetry.getDatasetTimeRange.useQuery(
    { experimentId, datasetId },
    {
      enabled: true, // Always fetch/keep dataset bounds for absolute scale
      refetchOnWindowFocus: false,
    }
  );

  const { initTimeRange } = usePlaygroundTimeStore();
  useEffect(() => {
    if (timeRangeQuery.data?.startTime && timeRangeQuery.data?.endTime) {
      initTimeRange(timeRangeQuery.data.startTime, timeRangeQuery.data.endTime);
    }
  }, [timeRangeQuery.data, initTimeRange]);

  // ── Sync group connection (Hover/Tooltip sync) ──────────────────────────
  useEffect(() => {
    if (chartInstance && linked) {
      // Connect to the synchronized group
      chartInstance.group = "playground-sync";
      echarts.connect("playground-sync");
    } else if (chartInstance) {
      // Unlink from the group
      chartInstance.group = "";
    }
  }, [linked, chartInstance]);

  // ── Fetch bucketed data — re-fires on every startTime/endTime change ───────
  const dataQuery = trpc.telemetry.getChannelData.useQuery(
    {
      experimentId,
      datasetId,
      channelIds,
      startTime: startTime ?? 0,
      endTime: endTime ?? Date.now(),
    },
    {
      enabled: !!startTime && !!endTime && channelIds.length > 0 && isInView.current,
      refetchOnWindowFocus: false,
      staleTime: 0, // always re-fetch when time range changes
    }
  );

  // ── IntersectionObserver: fetch only when in viewport ─────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView.current) {
          isInView.current = true;
          // Trigger re-fetch by invalidating manually
          dataQuery.refetch();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle dataZoom → update global store (Tier 2: viewport-aware) ────────
  const handleDataZoom = useCallback(
    () => {
      // If we are linked, we want to update the global time store
      // so other charts can pick it up and re-fetch high-res data.
      if (!linked || !chartInstance) return;
      
      const option = chartInstance.getOption() as any;
      const dz = option.dataZoom?.[0];
      if (!dz) return;

      // startValue and endValue are the absolute domain values (timestamps)
      const newStart = dz.startValue;
      const newEnd = dz.endValue;

      if (typeof newStart === "number" && typeof newEnd === "number") {
        // Debounce or check for meaningful change to avoid infinite loops
        const currentStart = startTime ?? 0;
        const currentEnd = endTime ?? 0;
        
        if (Math.abs(newStart - currentStart) > 1 || Math.abs(newEnd - currentEnd) > 1) {
          setTimeRange(newStart, newEnd);
        }
      }
    },
    [linked, startTime, endTime, setTimeRange, chartInstance]
  );

  // ── Build ECharts option ──────────────────────────────────────────────────
  const series = dataQuery.data?.series ?? [];
  const rangeMs = (endTime ?? 0) - (startTime ?? 0);

  // ── Absolute scale calculation (for zoom out headroom) ─────────────────────
  const absMin = timeRangeQuery.data?.startTime;
  const absMax = timeRangeQuery.data?.endTime;
  const absRange = (absMax ?? 0) - (absMin ?? 0);
  // Add 2% padding so user can zoom out slightly beyond the data
  const bufferedMin = absMin ? absMin - absRange * 0.02 : (startTime ?? 0);
  const bufferedMax = absMax ? absMax + absRange * 0.02 : (endTime ?? 0);

  // Collect unique units for dual y-axes
  const unitAxes: string[] = [];
  series.forEach((s) => {
    if (s.unit && !unitAxes.includes(s.unit)) unitAxes.push(s.unit);
  });

  const yAxes = unitAxes.length > 0
    ? unitAxes.map((unit, i) => ({
        type: "value" as const,
        name: unit,
        position: i === 0 ? "left" : "right",
        nameTextStyle: { color: "#71717a", fontSize: 9 },
        axisLabel: { color: "#71717a", fontSize: 10 },
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: {
          lineStyle: { color: i === 0 ? "#27272a" : "transparent", type: "dashed" },
        },
      }))
    : [
        {
          type: "value" as const,
          axisLabel: { color: "#71717a", fontSize: 10 },
          axisLine: { lineStyle: { color: "#27272a" } },
          splitLine: { lineStyle: { color: "#27272a", type: "dashed" } },
        },
      ];

  const echartsSeries = series.flatMap((s) => {
    const color = colorMap[s.channelId] ?? "#f97316";
    const displayName = labelMap?.[s.channelId] ?? s.channelName;
    const yAxisIndex = s.unit ? Math.max(0, unitAxes.indexOf(s.unit)) : 0;

    return [
      // Min/max band
      {
        name: `${displayName} range`,
        type: "line",
        data: s.points.map((p) => [p.t, p.min, p.max]),
        lineStyle: { opacity: 0, width: 0 },
        areaStyle: { opacity: 0.12, color },
        itemStyle: { opacity: 0 },
        yAxisIndex,
        tooltip: { show: false },
        silent: true,
        showSymbol: false,
        z: 1,
      },
      // Avg line
      {
        name: displayName,
        type: "line",
        data: s.points.map((p) => [p.t, p.avg]),
        lineStyle: { color, width: 1.5 },
        itemStyle: { color },
        showSymbol: false,
        yAxisIndex,
        z: 2,
      },
    ];
  });

  const chartOption = {
    animation: false,
    backgroundColor: "transparent",

    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#1c1b1b",
          color: "#e4e4e7",
          fontSize: 10,
        },
      },
      backgroundColor: "#1c1b1b",
      borderColor: "#27272a",
      textStyle: { color: "#e4e4e7", fontSize: 11 },
      // Show values for all series in the tooltip
      confine: true,
    },

    axisPointer: {
      link: { xAxisIndex: "all" },
      show: true,
      type: "cross",
      snap: true,
      lineStyle: {
        color: "#f97316",
        width: 1,
        type: "dashed",
      },
      crossStyle: {
        color: "#f97316",
        width: 1,
        type: "dashed",
      },
      label: {
        show: true,
        backgroundColor: "#27272a",
        color: "#f97316",
        fontSize: 10,
      },
    },

    legend: {
      type: "scroll",
      bottom: 40,
      textStyle: { color: "#71717a", fontSize: 10 },
      // Only show avg series in legend, not bands
      data: series.map((s) => labelMap?.[s.channelId] ?? s.channelName),
    },

    grid: { left: 60, right: unitAxes.length > 1 ? 60 : 12, top: 10, bottom: 80 },

    xAxis: {
      type: "time",
      min: bufferedMin,
      max: bufferedMax,
      axisLine: { lineStyle: { color: "#27272a" } },
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        formatter: autoTimeFormatter(rangeMs),
      },
      splitLine: { show: false },
    },

    yAxis: yAxes,

    dataZoom: [
      {
        type: "inside",
        filterMode: "none",
        startValue: startTime ?? undefined,
        endValue: endTime ?? undefined,
        zoomOnMouseWheel: true,
        moveOnMouseWheel: false,
        preventDefaultMouseMove: false,
      },
      {
        type: "slider",
        filterMode: "none",
        startValue: startTime ?? undefined,
        endValue: endTime ?? undefined,
        bottom: 10,
        height: 24,
        borderColor: "#27272a",
        backgroundColor: "#131313",
        dataBackground: { lineStyle: { color: "#27272a" }, areaStyle: { color: "#1c1b1b" } },
        handleStyle: { color: "#f97316" },
        textStyle: { color: "#71717a", fontSize: 9 },
      },
    ],

    series: echartsSeries,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const isLoading = dataQuery.isFetching || timeRangeQuery.isLoading;
  const hasError  = dataQuery.isError;

  return (
    <div ref={containerRef} style={{ height }} className="relative w-full">
      {/* Sync toggle */}
      <button
        onClick={toggleLinked}
        className="absolute right-2 top-2 z-10 rounded p-1 text-muted-foreground hover:bg-[#1c1b1b] hover:text-foreground transition"
        title={linked ? "Zoom sync: ON (click to unlink)" : "Zoom sync: OFF (click to link)"}
      >
        {linked ? <Link2 className="h-3.5 w-3.5 text-[#f97316]" /> : <Link2Off className="h-3.5 w-3.5" />}
      </button>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#131313]/60 backdrop-blur-[1px]">
          <Loader2 className="h-4 w-4 animate-spin text-[#f97316]/70" />
        </div>
      )}

      {/* Bucket info badge */}
      {dataQuery.data?.bucketInterval && (
        <div className="absolute left-2 top-2 z-10 rounded bg-[#131313] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/50">
          Δ {dataQuery.data.bucketInterval}
        </div>
      )}

      {hasError ? (
        <div className="flex h-full items-center justify-center gap-2 text-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <span className="font-mono text-xs">Query failed</span>
        </div>
      ) : series.length === 0 && !isLoading ? (
        <div className="flex h-full items-center justify-center gap-2 text-muted-foreground/30">
          <BarChart2 className="h-4 w-4" />
          <span className="font-mono text-xs">No data in range</span>
        </div>
      ) : (
        <ReactECharts
          option={chartOption}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge={true}
          lazyUpdate={true}
          onEvents={{
            datazoom: handleDataZoom,
          }}
          onChartReady={(instance) => {
            setChartInstance(instance);
            // Add to the sync group for linked hover/crosshair
            instance.group = "playground-sync";
            echarts.connect("playground-sync");
          }}
        />
      )}
    </div>
  );
}
