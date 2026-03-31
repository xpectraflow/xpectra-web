"use client";

type MetricsSeries = {
  channel: {
    id: string;
    name: string;
    unit: string | null;
  };
  metrics: {
    count: number;
    min: number | null;
    max: number | null;
    mean: number | null;
    latest: number | null;
  };
};

type MetricsPanelProps = {
  series: MetricsSeries[];
};

function formatMetric(value: number | null, unit: string | null): string {
  if (value === null) return "-";
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(3);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function MetricsPanel({ series }: MetricsPanelProps) {
  if (series.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-sm text-gray-400">
        No metrics available for the selected channels and time range.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {series.map((entry) => (
        <div
          key={entry.channel.id}
          className="rounded-xl border border-gray-800 bg-gray-900/60 p-4"
        >
          <p className="mb-2 text-sm font-semibold text-white">{entry.channel.name}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <p className="text-gray-400">
              Min:{" "}
              <span className="text-gray-200">
                {formatMetric(entry.metrics.min, entry.channel.unit)}
              </span>
            </p>
            <p className="text-gray-400">
              Max:{" "}
              <span className="text-gray-200">
                {formatMetric(entry.metrics.max, entry.channel.unit)}
              </span>
            </p>
            <p className="text-gray-400">
              Mean:{" "}
              <span className="text-gray-200">
                {formatMetric(entry.metrics.mean, entry.channel.unit)}
              </span>
            </p>
            <p className="text-gray-400">
              Latest:{" "}
              <span className="text-gray-200">
                {formatMetric(entry.metrics.latest, entry.channel.unit)}
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
