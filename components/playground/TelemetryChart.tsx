"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsInstance } from "echarts-for-react";
import * as echarts from "echarts";
import { Loader2, AlertCircle, BarChart2, Link2, Link2Off, Activity, MoreVertical, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { usePlaygroundTimeStore } from "@/stores/playgroundTime";
import { usePlayground, PlottedChannelGroup, VirtualChannel } from "@/components/playground/PlaygroundContext";
import { useContextMenu, ContextMenuItem, ContextMenu } from "@/components/playground/ContextMenu";
import { computeFFT } from "@/lib/math/fft";
import { useTelemetrySeries, getGlobalId } from "@/hooks/useTelemetrySeries";

export { getGlobalId }; // Re-export for any consumers

interface TelemetryChartProps {
  groups: PlottedChannelGroup[];
  colorMap: Record<string, string>;
  labelMap?: Record<string, string>;
  height?: number;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const CHART_PALETTE = [
  "#f97316", "#38bdf8", "#a78bfa", "#34d399", "#fb7185", "#fbbf24", "#22d3ee", "#c084fc",
];

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

export function TelemetryChart({
  groups,
  colorMap,
  labelMap,
  height,
  onToggleFullscreen,
  isFullscreen,
}: TelemetryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [chartInstance, setChartInstance] = useState<EChartsInstance | null>(null);
  const [chartMode, setChartMode] = useState<"time" | "frequency">("time");

  const { startTime, endTime, linked, setTimeRange, toggleLinked } = usePlaygroundTimeStore();
  const { virtualChannels } = usePlayground();

  // Make sure we trigger fetch when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([ent]) => {
      setIsInView(ent.isIntersecting);
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { allSeries, isLoading, primaryBaseTime } = useTelemetrySeries({
    groups, virtualChannels, labelMap, isInView
  });

  // --- Debounced Time Sync ---
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastIntendedRange = useRef<{ start: number; end: number } | null>(null);
  
  const debouncedSetTimeRange = useCallback((relativeStart: number, relativeEnd: number) => {
    lastIntendedRange.current = { start: relativeStart, end: relativeEnd };
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      // Store uses ABSOLUTE timestamps
      setTimeRange(relativeStart + primaryBaseTime, relativeEnd + primaryBaseTime);
      lastIntendedRange.current = null;
    }, 500);
  }, [setTimeRange, primaryBaseTime]);

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
      // ECharts values are RELATIVE (0 to duration)
      const relativeStartInStore = (startTime ?? primaryBaseTime) - primaryBaseTime;
      const relativeEndInStore = (endTime ?? (primaryBaseTime + 1000)) - primaryBaseTime;

      if (Math.abs(dz.startValue - relativeStartInStore) > 1 || Math.abs(dz.endValue - relativeEndInStore) > 1) {
        debouncedSetTimeRange(dz.startValue, dz.endValue);
      }
    }
  }, [linked, chartInstance, startTime, endTime, primaryBaseTime, debouncedSetTimeRange]);

  const handleManualZoom = (direction: "in" | "out") => {
    if (!chartInstance) return;
    const opt = chartInstance.getOption() as any;
    const dz = opt.dataZoom?.[0];
    
    const currentStart = (dz && typeof dz.startValue === "number") ? dz.startValue : ((startTime ?? primaryBaseTime) - primaryBaseTime);
    const currentEnd = (dz && typeof dz.endValue === "number") ? dz.endValue : ((endTime ?? (primaryBaseTime + 1000)) - primaryBaseTime);

    const center = (currentStart + currentEnd) / 2;
    const currentRange = currentEnd - currentStart;
    const factor = direction === "in" ? 0.6 : 1.6;
    const newHalfRange = (currentRange * factor) / 2;
    
    const newStart = center - newHalfRange;
    const newEnd = center + newHalfRange;
    
    chartInstance.dispatchAction({
      type: "dataZoom",
      startValue: newStart,
      endValue: newEnd
    });

    lastIntendedRange.current = { start: newStart, end: newEnd };
    debouncedSetTimeRange(newStart, newEnd);
  };

  const uniqueUnits = Array.from(new Set(allSeries.map((s: any) => s.unit).filter(Boolean)));
  const yAxes = uniqueUnits.length > 0
    ? uniqueUnits.map((unit, i) => ({
      type: "value" as const, name: unit, position: i === 0 ? "left" : "right",
      nameTextStyle: { color: "#71717a", fontSize: 9 },
      axisLabel: { color: "#71717a", fontSize: 10 },
      axisLine: { lineStyle: { color: "#27272a" } },
      splitLine: { lineStyle: { color: i === 0 ? "#27272a" : "transparent", type: "dashed" } },
    }))
    : [{ type: "value" as const, axisLabel: { color: "#71717a", fontSize: 10 }, axisLine: { lineStyle: { color: "#27272a" } }, splitLine: { lineStyle: { color: "#27272a", type: "dashed" } } }];

  const currentStartTime = startTime ?? primaryBaseTime;
  const currentEndTime = endTime ?? (primaryBaseTime + 1000);
  const rangeMs = currentEndTime - currentStartTime;

  const echartsSeries = allSeries.flatMap((s: any): any => {
    const color = colorMap[s.globalId] || "#ccc";
    const yAxisIndex = s.unit ? Math.max(0, uniqueUnits.indexOf(s.unit)) : 0;

    if (chartMode === "time") {
      return [
        // 1. Min/Max faint lines (no fill)
        {
          name: `${s.displayName} min`,
          type: "line",
          data: s.points.map((p: any) => [p.t, p.min]),
          lineStyle: { color, width: 0.5, opacity: 0.2, type: "dashed" },
          itemStyle: { opacity: 0 },
          yAxisIndex,
          showSymbol: false,
          silent: true,
          z: 1,
        },
        {
          name: `${s.displayName} max`,
          type: "line",
          data: s.points.map((p: any) => [p.t, p.max]),
          lineStyle: { color, width: 0.5, opacity: 0.2, type: "dashed" },
          itemStyle: { opacity: 0 },
          yAxisIndex,
          showSymbol: false,
          silent: true,
          z: 1,
        },
        // 2. Primary average line with downward gradient fill
        {
          name: s.displayName,
          type: "line",
          data: s.points.map((p: any) => [p.t, p.avg]),
          lineStyle: { color, width: 2 },
          itemStyle: { color },
          areaStyle: {
            opacity: 0.2,
            origin: "start",
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color },
              { offset: 1, color: "rgba(0,0,0,0)" }
            ]),
          },
          showSymbol: false,
          yAxisIndex,
          z: 2,
        }
      ];
    } else if (s.points.length > 2) {
      const dtMs = Math.max(1, s.points[1].t - s.points[0].t);
      const f = computeFFT(s.points.map((p: any) => p.avg), dtMs);
      return [{
        name: s.displayName + " (FFT)", type: "line", data: f.freq.map((freq: any, i: number) => [freq, f.mag[i]]),
        lineStyle: { color, width: 1.5 }, itemStyle: { color }, showSymbol: false, yAxisIndex, z: 2,
      }];
    }
    return [];
  });

  const displayStart = lastIntendedRange.current?.start ?? (currentStartTime - primaryBaseTime);
  const displayEnd = lastIntendedRange.current?.end ?? (currentEndTime - primaryBaseTime);

  const chartOption: any = {
    animation: false,
    backgroundColor: "transparent",
    tooltip: { trigger: "axis", axisPointer: { type: "cross" }, backgroundColor: "#1c1b1b", borderColor: "#27272a", textStyle: { color: "#e4e4e7", fontSize: 11 }, confine: true },
    legend: { type: "scroll", bottom: 40, textStyle: { color: "#71717a", fontSize: 10 }, data: allSeries.map((s: any) => s.displayName) },
    grid: { left: 60, right: uniqueUnits.length > 1 ? 60 : 12, top: 10, bottom: 80 },
    xAxis: chartMode === "time" ? {
      type: "value", axisLine: { lineStyle: { color: "#27272a" } }, splitLine: { show: false },
      axisLabel: { color: "#71717a", fontSize: 10, formatter: autoTimeFormatter(rangeMs) },
    } : { type: "value", name: "Hz", axisLine: { lineStyle: { color: "#27272a" } }, axisLabel: { color: "#71717a", fontSize: 10 }, splitLine: { show: false } },
    yAxis: yAxes,
    dataZoom: [
      { type: "inside", filterMode: "none", startValue: displayStart, endValue: displayEnd },
      { type: "slider", filterMode: "none", startValue: displayStart, endValue: displayEnd, bottom: 10, height: 24, borderColor: "#27272a", backgroundColor: "#131313", handleStyle: { color: "#f97316" }, textStyle: { color: "#71717a", fontSize: 9 } }
    ],
    series: echartsSeries as any[],
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
      {!isInView || isLoading ? (
        <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#f97316]/50" /></div>
      ) : allSeries.length === 0 ? (
        <div className="flex h-full items-center justify-center text-muted-foreground/30 font-mono text-xs">No data selected</div>
      ) : (
        <ReactECharts option={chartOption} style={{ height: "100%" }} onEvents={{ datazoom: handleDataZoom }} onChartReady={inst => { inst.group = "playground-sync"; echarts.connect("playground-sync"); setChartInstance(inst); }} />
      )}
    </div>
  );
}
