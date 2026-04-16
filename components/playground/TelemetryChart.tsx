"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsInstance } from "echarts-for-react";
import * as echarts from "echarts";
import { Loader2, AlertCircle, BarChart2, Link2, Link2Off, Activity, MoreVertical, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePlaygroundTimeStore } from "@/stores/playgroundTime";
import { usePlayground, PlottedChannelGroup, VirtualChannel } from "@/components/playground/PlaygroundContext";
import { useContextMenu, ContextMenuItem, ContextMenu } from "@/components/playground/ContextMenu";

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
    mag.push(Math.sqrt(real[i] * real[i] + imag[i] * imag[i]) / n);
    freq.push(i * (fs / n));
  }

  return { freq, mag };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TelemetryChartProps {
  /** Channels grouped by dataset to plot in this panel */
  groups: PlottedChannelGroup[];
  /** Map of globalId -> color */
  colorMap: Record<string, string>;
  /** Map of globalId -> display name */
  labelMap?: Record<string, string>;
  height?: number;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

// ─── Color palette ────────────────────────────────────────────────────────────

export const CHART_PALETTE = [
  "#f97316", // orange
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
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const millis = Math.floor((ms % 1000) / 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis}`;
  };
  return (val: number) => formatTime(val);
}

/** Utility to create a globally unique ID for a channel in a plot */
export const getGlobalId = (datasetId: string, channelId: string) => `${datasetId}:${channelId}`;

// ─── Component ────────────────────────────────────────────────────────────────

export function TelemetryChart({
  groups,
  colorMap,
  labelMap,
  height,
  onToggleFullscreen,
  isFullscreen,
}: TelemetryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useRef(false);
  const [chartInstance, setChartInstance] = useState<EChartsInstance | null>(null);
  const [chartMode, setChartMode] = useState<"time" | "frequency">("time");

  const { startTime, endTime, linked, setTimeRange, toggleLinked } = usePlaygroundTimeStore();
  const { virtualChannels } = usePlayground();

  // 1. Fetch channel metadata for each group (needed for virtual channel resolution)
  const metaQueries = trpc.useQueries((t) =>
    groups.map((g) =>
      t.channels.getChannels({
        experimentId: g.experimentId,
        datasetId: g.datasetId,
      })
    )
  );

  // 1.5 Fetch time ranges for ALL datasets to establish baselines
  const timeRanges = trpc.useQueries((t) =>
    groups.map((g) =>
      t.telemetry.getDatasetTimeRange({
        experimentId: g.experimentId,
        datasetId: g.datasetId,
      })
    )
  );

  // 2. Determine exactly which physical channels we need to fetch for each dataset.
  // This includes physical channels being plotted AND those needed as inputs for virtual channels.
  const resolvedGroups = useMemo(() => {
    return groups.map((g, idx) => {
      const allChannels = metaQueries[idx].data ?? [];
      const isPlotAll = !g.channelIds || g.channelIds.length === 0;
      
      const datasetVirtuals = virtualChannels.filter(vc => vc.datasetId === g.datasetId);
      const plottingVirtualIds = new Set(g.channelIds.filter(id => id.startsWith("vc_")));
      
      if (isPlotAll) {
         datasetVirtuals.forEach(vc => plottingVirtualIds.add(vc.id));
      }

      const neededPhysicalIds = new Set<string>();
      const resolvedVirtuals: VirtualChannel[] = [];
      const visited = new Set<string>();
      const resolving = new Set<string>();

      const trace = (vcId: string) => {
        if (visited.has(vcId)) return;
        if (resolving.has(vcId)) {
          console.warn("Circular dependency detected for VC:", vcId);
          return;
        }

        resolving.add(vcId);
        const vc = datasetVirtuals.find(v => v.id === vcId);
        if (vc) {
          const tokens = vc.expression.match(/[a-zA-Z0-9_\.]+/g) || [];
          tokens.forEach(token => {
            // Check if it's a physical channel
            const physical = allChannels.find(c => c.name === token || `${c.sensorName}.${c.name}` === token);
            if (physical) {
              neededPhysicalIds.add(physical.id);
            } else {
              // Check if it's another virtual channel (by name)
              const nestedVC = datasetVirtuals.find(v => v.name === token);
              if (nestedVC) {
                trace(nestedVC.id);
              }
            }
          });
          resolvedVirtuals.push(vc);
        }
        resolving.delete(vcId);
        visited.add(vcId);
      };

      // Trace each explicitly plotted VC
      plottingVirtualIds.forEach(id => trace(id));

      // Physical channels to plot
      const plottingPhysicals = isPlotAll 
        ? allChannels.map(c => c.id)
        : g.channelIds.filter(id => !id.startsWith("vc_"));
      
      plottingPhysicals.forEach(id => neededPhysicalIds.add(id));

      return {
        ...g,
        plottingVirtuals: datasetVirtuals.filter(vc => plottingVirtualIds.has(vc.id)),
        orderedVirtuals: resolvedVirtuals, // This is topologically sorted
        plottingPhysicals,
        neededPhysicalIds: Array.from(neededPhysicalIds),
        meta: allChannels,
      };
    });
  }, [groups, metaQueries, virtualChannels]);

  // 3. Multi-dataset telemetry fetch
  const dataQueries = trpc.useQueries((t) =>
    resolvedGroups.map((rg, idx) => {
      const baseTime = timeRanges[idx].data?.startTime ?? 0;
      return {
        ...t.telemetry.getChannelData({
          experimentId: rg.experimentId,
          datasetId: rg.datasetId,
          channelIds: rg.neededPhysicalIds,
          startTime: (startTime ?? 0) + baseTime,
          endTime: (endTime ?? Date.now()) + baseTime,
        }),
        enabled: startTime !== null && endTime !== null && isInView.current && timeRanges[idx].status === "success",
      };
    })
  );

  // IntersectionObserver to enable fetching only when visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([ent]) => {
      if (ent.isIntersecting && !isInView.current) {
        isInView.current = true;
        dataQueries.forEach(q => q.refetch());
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [dataQueries]);

  // Primary dataset (first one) provides initial duration if none set
  const { initTimeRange } = usePlaygroundTimeStore();
  useEffect(() => {
    const firstRange = timeRanges[0]?.data;
    if (firstRange?.startTime && firstRange?.endTime && !startTime) {
      const duration = firstRange.endTime - firstRange.startTime;
      initTimeRange(0, duration);
    }
  }, [timeRanges, initTimeRange, startTime]);

  // Merge results into a unified series list
  const allSeries = useMemo(() => {
    const combined: any[] = [];
    resolvedGroups.forEach((rg, idx) => {
      const query = dataQueries[idx];
      const metadata = timeRanges[idx].data;
      if (!query.data || !metadata) return;

      const baseTime = metadata.startTime ?? 0;
      const res = query.data;

      // Add physical channels
      res.series.filter((s: any) => rg.plottingPhysicals.includes(s.channelId)).forEach((s: any) => {
        const fallbackName = s.sensorName ? `${s.sensorName}.${s.channelName}` : s.channelName;
        combined.push({
          ...s,
          points: s.points.map((p: any) => ({ ...p, t: p.t - baseTime })),
          globalId: getGlobalId(rg.datasetId, s.channelId),
          displayName: labelMap?.[getGlobalId(rg.datasetId, s.channelId)] ?? fallbackName
        });
      });

      // Evaluate all needed virtual channels in topological order
      const valMap = new Map<string, any>();
      res.series.forEach((s: any) => {
        valMap.set(s.channelName, s);
        valMap.set(`${s.sensorName}.${s.channelName}`, s);
      });

      const samplesCount = res.series[0]?.points.length ?? 0;
      
      rg.orderedVirtuals.forEach(vc => {
        // Get unique tokens and sort by length descending to prevent partial replacements
        const rawTokens = vc.expression.match(/[a-zA-Z0-9_\.]+/g) || [];
        const tokens = Array.from(new Set(rawTokens)).sort((a, b) => b.length - a.length);
        const virtualPoints: any[] = [];
        
        if (samplesCount > 0) {
          for (let i = 0; i < samplesCount; i++) {
            // Strip '@' and replace tokens
            let expr = vc.expression.replace(/@/g, "");
            tokens.forEach((t: string) => {
              const s = valMap.get(t);
              const val = s?.points[i]?.avg ?? 0;
              // Escape special characters (like dots)
              const escapedT = t.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
              // Use lookbehind and lookahead to ensure exact token match, including dots
              expr = expr.replace(new RegExp(`(?<![a-zA-Z0-9_.])` + escapedT + `(?![a-zA-Z0-9_.])`, "g"), val.toString());
            });
            
            try {
              // eslint-disable-next-line no-eval
              const result = eval(expr);
              virtualPoints.push({
                t: res.series[0].points[i].t,
                avg: result, min: result, max: result
              });
            } catch {
              virtualPoints.push({ t: res.series[0].points[i].t, avg: 0, min: 0, max: 0 });
            }
          }
        }

        const vcSeries = {
          channelId: vc.id,
          channelName: vc.name,
          globalId: getGlobalId(rg.datasetId, vc.id),
          points: virtualPoints.map((p: any) => ({ ...p, t: p.t - baseTime })), // Normalize time
          unit: "Derived",
          displayName: labelMap?.[getGlobalId(rg.datasetId, vc.id)] ?? vc.name
        };

        // Add to map so other VCs can use it
        valMap.set(vc.name, { ...vcSeries, points: virtualPoints }); // Keep unnormalized time for calculations
        
        // Add to return if it's one of the requested plot IDs
        if (rg.plottingVirtuals.some(pv => pv.id === vc.id)) {
          combined.push(vcSeries);
        }
      });
    });
    return combined;
  }, [dataQueries, resolvedGroups, labelMap, timeRanges]);

  // --- Debounced Time Sync ---
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  // Track the most recent "intended" range locally to prevent React snapping back to stale store values
  const lastIntendedRange = useRef<{ start: number; end: number } | null>(null);
  
  const debouncedSetTimeRange = useCallback((start: number, end: number) => {
    lastIntendedRange.current = { start, end };
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setTimeRange(start, end);
      lastIntendedRange.current = null; // Clear once store is updated
    }, 500);
  }, [setTimeRange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // ECharts Logic
  const handleDataZoom = useCallback(() => {
    if (!linked || !chartInstance) return;
    const option = chartInstance.getOption() as any;
    const dz = option.dataZoom?.[0];
    if (dz && typeof dz.startValue === "number" && typeof dz.endValue === "number") {
      // Use debounced sync for a smoother experience during dragging
      if (Math.abs(dz.startValue - (startTime ?? 0)) > 1 || Math.abs(dz.endValue - (endTime ?? 0)) > 1) {
        debouncedSetTimeRange(dz.startValue, dz.endValue);
      }
    }
  }, [linked, chartInstance, startTime, endTime, debouncedSetTimeRange]);

  const handleManualZoom = (direction: "in" | "out") => {
    if (!chartInstance) return;

    const opt = chartInstance.getOption() as any;
    const dz = opt.dataZoom?.[0];
    
    // Use the CURRENT chart view as the base, not the store (which might be stale during rapid clicks)
    const currentStart = (dz && typeof dz.startValue === "number") ? dz.startValue : (startTime ?? 0);
    const currentEnd = (dz && typeof dz.endValue === "number") ? dz.endValue : (endTime ?? 0);

    const center = (currentStart + currentEnd) / 2;
    const currentRange = currentEnd - currentStart;
    const factor = direction === "in" ? 0.6 : 1.6;
    const newHalfRange = (currentRange * factor) / 2;
    
    const newStart = center - newHalfRange;
    const newEnd = center + newHalfRange;
    
    // Update local chart instance immediately
    chartInstance.dispatchAction({
      type: "dataZoom",
      startValue: newStart,
      endValue: newEnd
    });

    // Update synchronization ref immediately so incidental re-renders don't snap back
    lastIntendedRange.current = { start: newStart, end: newEnd };

    // Sync to other charts after debounce
    debouncedSetTimeRange(newStart, newEnd);
  };

  const uniqueUnits = Array.from(new Set(allSeries.map(s => s.unit).filter(Boolean)));
  const yAxes = uniqueUnits.length > 0
    ? uniqueUnits.map((unit, i) => ({
      type: "value" as const, name: unit, position: i === 0 ? "left" : "right",
      nameTextStyle: { color: "#71717a", fontSize: 9 },
      axisLabel: { color: "#71717a", fontSize: 10 },
      axisLine: { lineStyle: { color: "#27272a" } },
      splitLine: { lineStyle: { color: i === 0 ? "#27272a" : "transparent", type: "dashed" } },
    }))
    : [{ type: "value" as const, axisLabel: { color: "#71717a", fontSize: 10 }, axisLine: { lineStyle: { color: "#27272a" } }, splitLine: { lineStyle: { color: "#27272a", type: "dashed" } } }];

  const rangeMs = (endTime ?? 0) - (startTime ?? 0);
  const echartsSeries = allSeries.flatMap((s: any) => {
    const color = colorMap[s.globalId] || "#ccc";
    const yAxisIndex = s.unit ? Math.max(0, uniqueUnits.indexOf(s.unit)) : 0;

    if (chartMode === "time") {
      // Create a closed-loop polygon data for the range band
      // This ensures the fill stays strictly between min and max lines
      const rangeData = [
        ...s.points.map((p: any) => [p.t, p.min]),
        ...[...s.points].reverse().map((p: any) => [p.t, p.max]),
      ];

      return [
        {
          name: `${s.displayName} range`,
          type: "line",
          data: rangeData,
          lineStyle: { width: 0 },
          areaStyle: { opacity: 0.12, color },
          itemStyle: { opacity: 0 },
          yAxisIndex,
          tooltip: { show: false },
          silent: true,
          showSymbol: false,
          z: 1,
        },
        {
          name: s.displayName,
          type: "line",
          data: s.points.map((p: any) => [p.t, p.avg]),
          lineStyle: { color, width: 1.5 },
          itemStyle: { color },
          showSymbol: false,
          yAxisIndex,
          z: 2,
        }
      ];
    } else if (s.points.length > 2) {
      const dtMs = Math.max(1, s.points[1].t - s.points[0].t);
      const f = computeFFT(s.points.map((p: any) => p.avg), dtMs);
      return [{
        name: s.displayName + " (FFT)", type: "line", data: f.freq.map((freq, i) => [freq, f.mag[i]]),
        lineStyle: { color, width: 1.5 }, itemStyle: { color }, showSymbol: false, yAxisIndex, z: 2,
      }];
    }
    return [];
  });

  // Determine chart view bounds: Priority = Local Intended > Global Store
  const displayStart = lastIntendedRange.current?.start ?? startTime ?? undefined;
  const displayEnd = lastIntendedRange.current?.end ?? endTime ?? undefined;

  const chartOption = {
    animation: false,
    backgroundColor: "transparent",
    tooltip: { trigger: "axis", axisPointer: { type: "cross" }, backgroundColor: "#1c1b1b", borderColor: "#27272a", textStyle: { color: "#e4e4e7", fontSize: 11 }, confine: true },
    legend: { type: "scroll", bottom: 40, textStyle: { color: "#71717a", fontSize: 10 }, data: allSeries.map(s => s.displayName) },
    grid: { left: 60, right: uniqueUnits.length > 1 ? 60 : 12, top: 10, bottom: 80 },
    xAxis: chartMode === "time" ? {
      type: "time", axisLine: { lineStyle: { color: "#27272a" } }, splitLine: { show: false },
      axisLabel: { color: "#71717a", fontSize: 10, formatter: autoTimeFormatter(rangeMs) },
    } : { type: "value", name: "Hz", axisLine: { lineStyle: { color: "#27272a" } }, axisLabel: { color: "#71717a", fontSize: 10 }, splitLine: { show: false } },
    yAxis: yAxes,
    dataZoom: [
      { type: "inside", filterMode: "none", startValue: displayStart, endValue: displayEnd },
      { type: "slider", filterMode: "none", startValue: displayStart, endValue: displayEnd, bottom: 10, height: 24, borderColor: "#27272a", backgroundColor: "#131313", handleStyle: { color: "#f97316" }, textStyle: { color: "#71717a", fontSize: 9 } }
    ],
    series: echartsSeries,
  };

  const { menu, open: openMenu, close: closeMenu } = useContextMenu();

  return (
    <div ref={containerRef} style={{ height: height ? `${height}px` : "100%" }} className="relative w-full overflow-hidden">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 bg-[#121212]/80 backdrop-blur-md rounded-lg border border-[#27272a] p-0.5 shadow-xl">
        <button 
          onClick={() => handleManualZoom("in")} 
          title="Zoom In"
          className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-[#1c1b1b] rounded-md transition-all active:scale-95"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button 
          onClick={() => handleManualZoom("out")} 
          title="Zoom Out"
          className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-[#1c1b1b] rounded-md transition-all active:scale-95"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        
        <div className="w-[1px] h-4 bg-[#27272a] mx-0.5" />

        <button 
          onClick={(e) => openMenu(e, [
            { type: "item", label: chartMode === "time" ? "FFT Mode" : "Time Mode", icon: <Activity className="h-4 w-4" />, onClick: () => setChartMode(chartMode === "time" ? "frequency" : "time") },
            { type: "item", label: linked ? "Unsync Zoom" : "Sync Zoom", icon: linked ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />, onClick: toggleLinked },
            { type: "item", label: isFullscreen ? "Exit Fullscreen" : "Fullscreen", icon: <Maximize2 className="h-4 w-4" />, onClick: onToggleFullscreen || (() => {}) }
          ])} 
          className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-[#1c1b1b] rounded-md transition-all"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
      {menu && <ContextMenu {...menu} onClose={closeMenu} />}
      {!isInView.current || dataQueries.some(q => q.isLoading) ? (
        <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#f97316]/50" /></div>
      ) : allSeries.length === 0 ? (
        <div className="flex h-full items-center justify-center text-muted-foreground/30 font-mono text-xs">No data selected</div>
      ) : (
        <ReactECharts option={chartOption} style={{ height: "100%" }} onEvents={{ datazoom: handleDataZoom }} onChartReady={inst => { inst.group = "playground-sync"; echarts.connect("playground-sync"); setChartInstance(inst); }} />
      )}
    </div>
  );
}
