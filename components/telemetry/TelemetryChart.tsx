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
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No telemetry data for the selected filters.
      </div>
    );
  }

  const option = {
    backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "var(--popover)",
        borderColor: "var(--border)",
        textStyle: { color: "var(--popover-foreground)" },
      },
      legend: {
        top: 8,
        textStyle: { color: "var(--muted-foreground)" },
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
        axisLabel: { color: "var(--muted-foreground)" },
        splitLine: { lineStyle: { color: "var(--border)" } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "var(--muted-foreground)" },
        splitLine: { lineStyle: { color: "var(--border)" } },
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
    <div className="rounded-xl border border-border bg-card p-2">
      <ReactECharts option={option} style={{ width: "100%", height: 360 }} />
    </div>
  );
}
