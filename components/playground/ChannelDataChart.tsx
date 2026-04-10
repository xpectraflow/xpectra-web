"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import { Loader2, AlertCircle, BarChart2 } from "lucide-react";

interface DataPoint {
  t: number;
  v: number;
}

interface ChannelDataChartProps {
  datasetId: string;
  channelCol: string; // "ch_1", "ch_5", etc.
  channelName: string;
  unit?: string | null;
}

// Maximum points to keep in memory per channel (prevents OOM)
const MAX_POINTS_IN_MEMORY = 5000;
// Initial fetch limit
const INITIAL_LIMIT = 2000;

async function fetchChannelData(
  datasetId: string,
  channelCol: string,
  opts: { limit?: number; from?: string; to?: string } = {}
): Promise<DataPoint[]> {
  const params = new URLSearchParams({ datasetId, channelCol });
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.from) params.set("from", opts.from);
  if (opts.to) params.set("to", opts.to);

  const res = await fetch(`/api/telemetry/query?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Failed to fetch channel data");
  }
  const json = await res.json();
  return json.data as DataPoint[];
}

export function ChannelDataChart({
  datasetId,
  channelCol,
  channelName,
  unit,
}: ChannelDataChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Load on mount - the IntersectionObserver handles lazy loading
  const containerRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  const loadData = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setStatus("loading");
    try {
      const points = await fetchChannelData(datasetId, channelCol, { limit: INITIAL_LIMIT });
      if (!isMounted.current) return;
      // Trim to memory limit (keep most recent)
      const trimmed = points.length > MAX_POINTS_IN_MEMORY
        ? points.slice(points.length - MAX_POINTS_IN_MEMORY)
        : points;
      setData(trimmed);
      setStatus("loaded");
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err.message ?? "Unknown error");
      setStatus("error");
    }
  }, [datasetId, channelCol]);

  // Lazy fetch when chart scrolls into view
  useEffect(() => {
    isMounted.current = true;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadData();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => {
      isMounted.current = false;
      observer.disconnect();
    };
  }, [loadData]);

  const chartOption = {
    backgroundColor: "transparent",
    animation: false,
    grid: { top: 10, right: 12, bottom: 30, left: 52 },
    xAxis: {
      type: "time",
      axisLine: { lineStyle: { color: "#27272a" } },
      axisLabel: {
        color: "#71717a",
        fontSize: 10,
        formatter: (val: number) => {
          const d = new Date(val);
          return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
        },
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisLabel: { color: "#71717a", fontSize: 10 },
      splitLine: { lineStyle: { color: "#27272a", type: "dashed" } },
      name: unit ?? "",
      nameTextStyle: { color: "#71717a", fontSize: 9 },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1c1b1b",
      borderColor: "#27272a",
      textStyle: { color: "#e4e4e7", fontSize: 11 },
      formatter: (params: any) => {
        const p = params[0];
        const d = new Date(p.data[0]);
        return `<b>${channelName}</b><br/>${d.toLocaleTimeString()}: <b>${p.data[1].toFixed(4)}</b>${unit ? ` ${unit}` : ""}`;
      },
    },
    dataZoom: [
      {
        type: "inside",
        throttle: 50,
      },
    ],
    series: [
      {
        type: "line",
        data: data.map((pt) => [pt.t, pt.v]),
        showSymbol: false,
        lineStyle: { color: "#f97316", width: 1.5 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(249,115,22,0.18)" },
              { offset: 1, color: "rgba(249,115,22,0)" },
            ],
          },
        },
        sampling: "lttb", // Largest-Triangle-Three-Buckets downsampling
        large: true,
        largeThreshold: 1000,
      },
    ],
  };

  return (
    <div ref={containerRef} className="h-full w-full">
      {status === "idle" || status === "loading" ? (
        <div className="flex h-full items-center justify-center gap-2 text-muted-foreground/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-mono text-xs">Loading {channelName}…</span>
        </div>
      ) : status === "error" ? (
        <div className="flex h-full items-center justify-center gap-2 text-destructive/60">
          <AlertCircle className="h-4 w-4" />
          <span className="font-mono text-xs">{error}</span>
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-full items-center justify-center gap-2 text-muted-foreground/30">
          <BarChart2 className="h-4 w-4" />
          <span className="font-mono text-xs">No data</span>
        </div>
      ) : (
        <ReactECharts
          option={chartOption}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge={false}
          lazyUpdate
        />
      )}
    </div>
  );
}
