"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsInstance } from "echarts-for-react";
import * as echarts from "echarts";
import { Loader2, Link2, Link2Off, Activity, MoreVertical, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { usePlayground, PlottedChannelGroup } from "@/components/playground/PlaygroundContext";
import { useContextMenu, ContextMenu } from "@/components/playground/ContextMenu";
import { useTelemetrySeries, getGlobalId } from "@/hooks/useTelemetrySeries";

export { getGlobalId };

interface TelemetryChartProps {
  groups: PlottedChannelGroup[];
  colorMap: Record<string, string>;
  labelMap?: Record<string, string>;
  height?: number;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  startTime: number | null;
  endTime: number | null;
  linked: boolean;
  setTimeRange: (start: number, end: number) => void;
  initTimeRange: (start: number, end: number) => void;
  toggleLinked: () => void;
  syncGroupId: string;
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
  startTime,
  endTime,
  linked,
  setTimeRange,
  initTimeRange,
  toggleLinked,
  syncGroupId,
}: TelemetryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [chartInstance, setChartInstance] = useState<EChartsInstance | null>(null);
  
  // --- Fundamental State ---
  const [mode, setMode] = useState<"time" | "frequency">("time");
  const [isCalculatingFFT, setIsCalculatingFFT] = useState(false);
  const [spectralSeriesData, setSpectralSeriesData] = useState<any[]>([]);
  const lastRenderedMode = useRef<"time" | "frequency">("time");

  const { virtualChannels } = usePlayground();

  // Manage visibility/fetch trigger
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([ent]) => {
      setIsInView(ent.isIntersecting);
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { allSeries, isLoading } = useTelemetrySeries({
    groups, virtualChannels, labelMap, isInView, startTime, endTime, initTimeRange
  });

  const uniqueUnits = useMemo(() => {
    const units = new Set(allSeries.map((s: any) => s.unit).filter(Boolean));
    return Array.from(units);
  }, [allSeries]);

  // --- Worker-Based FFT Logic ---
  const workerRef = useRef<Worker | null>(null);
  const lastCalculationId = useRef<number>(0);
  const lastDataFingerprint = useRef<string>("");

  useEffect(() => {
    if (mode === "frequency" && allSeries.length > 0) {
      // Calculate a fingerprint to avoid redundant updates if data hasn't changed
      const finger = allSeries.map(s => `${s.globalId}:${s.points.length}:${s.points[0]?.t}:${s.points[s.points.length-1]?.t}`).join("|");
      
      if (finger === lastDataFingerprint.current && !isCalculatingFFT && spectralSeriesData.length > 0) {
        // Data is the same as what we already calculated, don't restart
        return;
      }

      if (!workerRef.current) {
        // Initialize worker as module
        workerRef.current = new Worker(new URL("../../lib/math/fft.worker.ts", import.meta.url), { type: "module" });
        
        workerRef.current.onmessage = (e) => {
          const { results, requestId, error } = e.data;
          // Only apply if it's the latest request to avoid race conditions
          if (requestId === lastCalculationId.current) {
            if (error) {
              console.error("Worker failed:", error);
            } else {
              setSpectralSeriesData(results);
            }
            setIsCalculatingFFT(false);
          }
        };

        workerRef.current.onerror = (err) => {
          console.error("Worker process error:", err);
          setIsCalculatingFFT(false);
        };
      }
      
      const reqId = ++lastCalculationId.current;
      lastDataFingerprint.current = finger;
      setIsCalculatingFFT(true);
      
      workerRef.current.postMessage({
        series: allSeries,
        colorMap,
        uniqueUnits,
        requestId: reqId
      });
    }

    if (mode === "time") {
      setSpectralSeriesData([]);
      setIsCalculatingFFT(false);
      lastDataFingerprint.current = "";
    }
  }, [mode, allSeries, colorMap, uniqueUnits, spectralSeriesData.length, isCalculatingFFT]);

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // --- Debounced Time Sync ---
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastIntendedRange = useRef<{ start: number; end: number } | null>(null);
  
  const debouncedSetTimeRange = useCallback((relativeStart: number, relativeEnd: number) => {
    lastIntendedRange.current = { start: relativeStart, end: relativeEnd };
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setTimeRange(relativeStart, relativeEnd);
      lastIntendedRange.current = null;
    }, 500);
  }, [setTimeRange]);

  // ECharts Logic
  const handleDataZoom = useCallback(() => {
    if (!linked || !chartInstance) return;
    const option = chartInstance.getOption() as any;
    const dz = option.dataZoom?.[0];
    if (dz && typeof dz.startValue === "number" && typeof dz.endValue === "number") {
      if (Math.abs(dz.startValue - (startTime ?? 0)) > 1 || Math.abs(dz.endValue - (endTime ?? 0)) > 1) {
        debouncedSetTimeRange(dz.startValue, dz.endValue);
      }
    }
  }, [linked, chartInstance, startTime, endTime, debouncedSetTimeRange]);

  const handleManualZoom = (direction: "in" | "out") => {
    if (!chartInstance) return;
    const opt = chartInstance.getOption() as any;
    const dz = opt.dataZoom?.[0];
    
    const currentStart = (dz && typeof dz.startValue === "number") ? dz.startValue : (startTime ?? 0);
    const currentEnd = (dz && typeof dz.endValue === "number") ? dz.endValue : (endTime ?? 0);

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

  const yAxes = useMemo(() => {
    if (uniqueUnits.length === 0) {
      return [{ type: "value" as const, axisLabel: { color: "#71717a", fontSize: 10 }, axisLine: { lineStyle: { color: "#27272a" } }, splitLine: { lineStyle: { color: "#27272a", type: "dashed" } } }];
    }
    return uniqueUnits.map((unit, i) => ({
      type: "value" as const, name: unit, position: i === 0 ? "left" : "right",
      nameTextStyle: { color: "#71717a", fontSize: 9 },
      axisLabel: { color: "#71717a", fontSize: 10 },
      axisLine: { lineStyle: { color: "#27272a" } },
      splitLine: { lineStyle: { color: i === 0 ? "#27272a" : "transparent", type: "dashed" } },
    }));
  }, [uniqueUnits]);

  const currentStartTime = startTime ?? 0;
  const currentEndTime = endTime ?? 1000;
  const rangeMs = currentEndTime - currentStartTime;

  // Time-domain series
  const timeSeriesData = useMemo(() => allSeries.flatMap((s: any): any => {
    const color = colorMap[s.globalId] || "#ccc";
    const yAxisIndex = s.unit ? Math.max(0, uniqueUnits.indexOf(s.unit)) : 0;
    return [
      {
        name: `${s.displayName} min`,
        type: "line",
        data: s.points.map((p: any) => [p.t, p.min]),
        lineStyle: { color, width: 0.5, opacity: 0.2, type: "dashed" },
        itemStyle: { opacity: 0 },
        yAxisIndex,
        showSymbol: false,
        silent: true,
        tooltip: { show: false },
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
        tooltip: { show: false },
        z: 1,
      },
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
  }), [allSeries, colorMap, uniqueUnits]);

  // Active series: swap instantly
  const activeSeries = mode === "time" ? timeSeriesData : spectralSeriesData;

  const displayStart = lastIntendedRange.current?.start ?? currentStartTime;
  const displayEnd = lastIntendedRange.current?.end ?? currentEndTime;

  const chartOption = useMemo(() => {
    const isFreq = mode === "frequency";
    return {
      animation: false,
      backgroundColor: "transparent",
      tooltip: { trigger: "axis", axisPointer: { type: "cross" }, backgroundColor: "#1c1b1b", borderColor: "#27272a", textStyle: { color: "#e4e4e7", fontSize: 11 }, confine: true },
      legend: { type: "scroll", bottom: 40, textStyle: { color: "#71717a", fontSize: 10 }, data: allSeries.map((s: any) => s.displayName) },
      grid: { left: 60, right: uniqueUnits.length > 1 ? 60 : 12, top: 10, bottom: 80 },
      xAxis: isFreq ? {
        type: "value", name: "Hz", axisLine: { lineStyle: { color: "#27272a" } }, axisLabel: { color: "#71717a", fontSize: 10 }, splitLine: { show: false }
      } : {
        type: "value", axisLine: { lineStyle: { color: "#27272a" } }, splitLine: { show: false },
        axisLabel: { color: "#71717a", fontSize: 10, formatter: autoTimeFormatter(rangeMs) },
      },
      yAxis: yAxes,
      dataZoom: isFreq ? [
        { type: "inside", filterMode: "none" },
        { type: "slider", filterMode: "none", bottom: 10, height: 24, borderColor: "#27272a", backgroundColor: "#131313", handleStyle: { color: "#f97316" }, textStyle: { color: "#71717a", fontSize: 9 } }
      ] : [
        { type: "inside", filterMode: "none", startValue: displayStart, endValue: displayEnd },
        { type: "slider", filterMode: "none", startValue: displayStart, endValue: displayEnd, bottom: 10, height: 24, borderColor: "#27272a", backgroundColor: "#131313", handleStyle: { color: "#f97316" }, textStyle: { color: "#71717a", fontSize: 9 } }
      ],
      series: activeSeries,
    };
  }, [mode, activeSeries, allSeries, uniqueUnits, yAxes, displayStart, displayEnd, rangeMs]);

  const { menu, open: openMenu, close: closeMenu } = useContextMenu();

  // Mode Swap Detection for notMerge
  const shouldNotMerge = useMemo(() => {
    const switched = lastRenderedMode.current !== mode;
    lastRenderedMode.current = mode;
    return switched;
  }, [mode]);

  const isGlobalLoading = !isInView || isLoading || isCalculatingFFT;

  return (
    <div ref={containerRef} style={{ height: height ? `${height}px` : "100%" }} className="relative w-full overflow-hidden group/chart bg-[#0e0e0e]">
      
      {/* Control Bar: z-50 to stay above everything */}
      <div className="absolute right-2 top-2 z-50 flex items-center gap-0.5 bg-[#121212]/90 backdrop-blur-md rounded-lg border border-[#27272a] p-0.5 shadow-xl transition-all opacity-0 group-hover/chart:opacity-100 focus-within:opacity-100">
        <button 
          onClick={() => handleManualZoom("in")} 
          className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-[#1c1b1b] rounded-md transition-all active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button 
          onClick={() => handleManualZoom("out")} 
          className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-[#1c1b1b] rounded-md transition-all active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        
        <div className="w-[1px] h-4 bg-[#27272a] mx-0.5" />

        <button 
          onClick={(e) => openMenu(e, [
            { type: "item", label: mode === "time" ? "Switch to FFT" : "Switch to Time", icon: <Activity className="h-4 w-4" />, onClick: () => setMode(mode === "time" ? "frequency" : "time") },
            { type: "item", label: linked ? "Unsync Zoom" : "Sync Zoom", icon: linked ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />, onClick: toggleLinked },
            { type: "item", label: isFullscreen ? "Exit Fullscreen" : "Fullscreen", icon: <Maximize2 className="h-4 w-4" />, onClick: onToggleFullscreen || (() => {}) }
          ])} 
          className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-[#1c1b1b] rounded-md transition-all"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {menu && <ContextMenu {...menu} onClose={closeMenu} />}

      <div className="w-full h-full relative">
        {allSeries.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground/30 font-mono text-xs">No data selected</div>
        ) : (
          <ReactECharts 
            option={chartOption} 
            notMerge={shouldNotMerge}
            lazyUpdate={true}
            style={{ height: "100%" }} 
            onEvents={{ datazoom: handleDataZoom }} 
            onChartReady={inst => { 
              inst.group = syncGroupId; 
              echarts.connect(syncGroupId); 
              setChartInstance(inst); 
            }} 
          />
        )}

        {/* Loading Overlay: Internal to the chart area, doesn't hide controls */}
        {isGlobalLoading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0e0e0e]/40 backdrop-blur-[2px] transition-all duration-300">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        )}
      </div>
    </div>
  );
}
