"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsInstance } from "echarts-for-react";
import * as echarts from "echarts";
import { Loader2, AlertCircle, BarChart2, Link2, Link2Off, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlaygroundTimeStore } from "@/stores/playgroundTime";
import { usePlayground } from "@/components/playground/PlaygroundContext";

// ─── Naive Radix-2 FFT ────────────────────────────────────────────────────────
function computeFFT(dataArray: number[], dtMs: number) {
  let n = dataArray.length;
  if (n < 2) return { freq: [], mag: [] };

  let power = Math.pow(2, Math.floor(Math.log2(n)));
  let real = dataArray.slice(0, power);
  let imag = new Array(power).fill(0);
  n = power;

  let i = 0, j = 0, k = 0, n2 = n / 2;
  for (i = 1, j = 0; i < n; i++) {
    let bit = n2;
    while (j >= bit) { j -= bit; bit /= 2; }
    j += bit;
    if (i < j) {
      let t = real[i]; real[i] = real[j]; real[j] = t;
      t = imag[i]; imag[i] = imag[j]; imag[j] = t;
    }
  }
  
  for (k = 1; k < n; k *= 2) {
    let theta = -Math.PI / k;
    let wReal = Math.cos(theta);
    let wImag = Math.sin(theta);
    for (i = 0; i < n; i += 2 * k) {
      let uReal = 1, uImag = 0;
      for (j = 0; j < k; j++) {
        let tReal = uReal * real[i + j + k] - uImag * imag[i + j + k];
        let tImag = uReal * imag[i + j + k] + uImag * real[i + j + k];
        real[i + j + k] = real[i + j] - tReal;
        imag[i + j + k] = imag[i + j] - tImag;
        real[i + j] += tReal;
        imag[i + j] += tImag;
        let nextUReal = uReal * wReal - uImag * wImag;
        let nextUImag = uReal * wImag + uImag * wReal;
        uReal = nextUReal; uImag = nextUImag;
      }
    }
  }
  
  let mag = [];
  let freq = [];
  let fs = 1000 / dtMs; // Sample freq in Hz
  
  for (i = 0; i < n / 2; i++) { // only positive frequencies
    mag.push(Math.sqrt(real[i]*real[i] + imag[i]*imag[i]) / n);
    freq.push(i * (fs / n));
  }
  
  return { freq, mag };
}

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
  const [chartMode, setChartMode] = useState<"time" | "frequency">("time");

  const { startTime, endTime, linked, setTimeRange, toggleLinked } = usePlaygroundTimeStore();
  const { virtualChannels } = usePlayground();

  // Pick out virtual vs physical
  const plottingVirtuals = virtualChannels.filter(vc => channelIds.includes(vc.id));
  const plottingPhysicals = channelIds.filter(id => !id.startsWith("vc_"));

  // Fetch channel metadata to resolve names in formulas
  const channelsMetaQuery = trpc.channels.getChannels.useQuery(
    { experimentId, datasetId },
    { enabled: plottingVirtuals.length > 0 }
  );

  const neededPhysicalIds = new Set(plottingPhysicals);
  if (channelsMetaQuery.data && plottingVirtuals.length > 0) {
    const allChannels = channelsMetaQuery.data;
    plottingVirtuals.forEach(vc => {
      const tokens = vc.expression.match(/[a-zA-Z0-9_\.]+/g) || [];
      tokens.forEach(token => {
        // Try exact match on sensor.channel or short channel name, normalized
        const match = allChannels.find(c => {
          const normalizedShort = c.name.replace(/[^a-zA-Z0-9_\.]+/g, "_");
          const normalizedFull = `${c.sensorName}.${c.name}`.replace(/[^a-zA-Z0-9_\.]+/g, "_");
          return normalizedShort === token || normalizedFull === token;
        });
        if (match) neededPhysicalIds.add(match.id);
      });
    });
  }

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
      channelIds: Array.from(neededPhysicalIds),
      startTime: startTime ?? 0,
      endTime: endTime ?? Date.now(),
    },
    {
      enabled: !!startTime && !!endTime && neededPhysicalIds.size > 0 && isInView.current,
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
          // Trigger re-fetch by invalidating manually if there are channels
          if (neededPhysicalIds.size > 0) {
            dataQuery.refetch();
          }
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
  const baseSeries = dataQuery.data?.series ?? [];
  const rangeMs = (endTime ?? 0) - (startTime ?? 0);

  // Generate resolved series (Evaluating Virtual Channels)
  const resolvedSeries = useMemo(() => {
    if (plottingVirtuals.length === 0) return baseSeries.filter(s => plottingPhysicals.includes(s.channelId));
    
    const allChannels = channelsMetaQuery.data ?? [];
    const idToData = new Map(baseSeries.map(s => [s.channelId, s.points]));

    const newSeries = baseSeries.filter(s => plottingPhysicals.includes(s.channelId));

    plottingVirtuals.forEach(vc => {
      try {
        const tokens = vc.expression.match(/[a-zA-Z0-9_\.]+/g) || [];
        const uniqueTokens = Array.from(new Set(tokens));
        
        // Map each token used in the expression to its data
        const tokenToData = new Map<string, any[]>();
        uniqueTokens.forEach(t => {
           const channelMatch = allChannels.find(c => {
             const normalizedShort = c.name.replace(/[^a-zA-Z0-9_\.]+/g, "_");
             const normalizedFull = `${c.sensorName}.${c.name}`.replace(/[^a-zA-Z0-9_\.]+/g, "_");
             return normalizedShort === t || normalizedFull === t;
           });
           if (channelMatch && idToData.has(channelMatch.id)) {
             tokenToData.set(t, idToData.get(channelMatch.id)!);
           }
        });

        if (tokenToData.size === 0) return;
        
        // Pre-process expression to make it valid JS (dots to underscores)
        // and map arguments to those safe names
        const sortedTokens = Array.from(tokenToData.keys()).sort((a,b) => b.length - a.length);
        let transformedExpr = vc.expression;
        const argNames: string[] = [];
        const argData: any[][] = [];

        sortedTokens.forEach((token, i) => {
           const safeName = `_arg_${i}`;
           // Replace only whole tokens
           const escapedToken = token.replace(/\./g, '\\.');
           const regex = new RegExp(`\\b${escapedToken}\\b`, 'g');
           transformedExpr = transformedExpr.replace(regex, safeName);
           argNames.push(safeName);
           argData.push(tokenToData.get(token)!);
        });
        
        const fn = new Function(...argNames, `return ${transformedExpr};`);
        const refPoints = argData[0];
        
        const vcPoints = refPoints.map((refPt, i) => {
          const args = argData.map(dataArr => dataArr[i]?.avg ?? 0);
          const val = fn(...args);
          return { t: refPt.t, min: val, max: val, avg: val, count: 1 };
        });

        newSeries.push({
          channelId: vc.id,
          channelName: vc.name,
          unit: "Derived",
          dataType: "float8",
          hypertableColName: "virtual",
          points: vcPoints
        });
      } catch (e) {
        console.error("Virtual channel eval error", e);
      }
    });

    return newSeries;
  }, [baseSeries, plottingVirtuals, plottingPhysicals, channelsMetaQuery.data]);

  const series = resolvedSeries;

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

    // Time Mode
    if (chartMode === "time") {
      return [
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
    }
    
    // Frequency Mode
    if (s.points.length > 2) {
       // Estimate delta t
       const dtMs = Math.max(1, s.points[1].t - s.points[0].t);
       const freqs = computeFFT(s.points.map(p => p.avg), dtMs);
       const fftData = freqs.freq.map((f, i) => [f, freqs.mag[i]]);
       return [
         {
           name: displayName + " (FFT)",
           type: "line",
           data: fftData,
           lineStyle: { color, width: 1.5 },
           itemStyle: { color },
           showSymbol: false,
           yAxisIndex,
           z: 2,
         }
       ]
    }
    return [];
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

    xAxis: chartMode === "time" ? {
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
    } : {
      type: "value",
      name: "Hz",
      axisLine: { lineStyle: { color: "#27272a" } },
      axisLabel: { color: "#71717a", fontSize: 10 },
      splitLine: { show: false },
    },

    yAxis: yAxes,

    dataZoom: chartMode === "time" ? [
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
    ] : [
      {
        type: "inside",
      },
      {
        type: "slider",
        bottom: 10,
        height: 24,
        borderColor: "#27272a",
        filterMode: "none",
        backgroundColor: "#131313",
        handleStyle: { color: "#f97316" },
        textStyle: { color: "#71717a", fontSize: 9 },
      }
    ],
    series: echartsSeries,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const isLoading = dataQuery.isFetching || timeRangeQuery.isLoading;
  const hasError  = dataQuery.isError;

  return (
    <div ref={containerRef} style={{ height: height ? `${height}px` : "100%" }} className="relative w-full overflow-hidden telemetry-chart-container">
      {/* Top right overlays */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
        <button
          onClick={() => setChartMode(chartMode === "time" ? "frequency" : "time")}
          className={`rounded px-1.5 py-1 text-[10px] uppercase font-mono tracking-widest transition flex items-center gap-1 ${
            chartMode === "frequency" ? "bg-[#f97316]/20 text-[#f97316]" : "text-muted-foreground hover:bg-[#1c1b1b] hover:text-foreground"
          }`}
          title="Toggle Time / Frequency Domain"
        >
          <Activity className="h-3 w-3" />
          {chartMode === "time" ? "Freq" : "Time"}
        </button>

        {chartMode === "time" && (
          <button
            onClick={toggleLinked}
            className="rounded p-1 text-muted-foreground hover:bg-[#1c1b1b] hover:text-foreground transition"
            title={linked ? "Zoom sync: ON (click to unlink)" : "Zoom sync: OFF (click to link)"}
          >
            {linked ? <Link2 className="h-3.5 w-3.5 text-[#f97316]" /> : <Link2Off className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

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
