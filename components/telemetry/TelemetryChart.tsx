"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type TelemetrySeries = {
  channel: {
    id: string;
    name: string;
    unit: string | null;
  };
  points: Array<{
    timestamp: string;
    value: number;
  }>;
};

type TelemetryChartProps = {
  series: TelemetrySeries[];
};

export function TelemetryChart({ series }: TelemetryChartProps) {
  if (series.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 text-sm text-gray-400">
        No telemetry data for the selected filters.
      </div>
    );
  }

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
    },
    legend: {
      top: 8,
      textStyle: { color: "#d1d5db" },
    },
    grid: {
      left: 16,
      right: 16,
      top: 44,
      bottom: 20,
      containLabel: true,
    },
    xAxis: {
      type: "time",
      axisLabel: { color: "#9ca3af" },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.12)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#9ca3af" },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.12)" } },
    },
    series: series.map((entry) => ({
      type: "line",
      name: entry.channel.name,
      showSymbol: false,
      smooth: false,
      data: entry.points.map((point) => [point.timestamp, point.value]),
    })),
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-2">
      <ReactECharts option={option} style={{ width: "100%", height: 360 }} />
    </div>
  );
}
