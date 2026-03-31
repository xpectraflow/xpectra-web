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
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        No metrics available for the selected channels and time range.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {series.map((entry) => (
        <div
          key={entry.channel.id}
          className="rounded-xl border border-border bg-card p-4"
        >
          <p className="mb-2 text-sm font-semibold text-card-foreground">{entry.channel.name}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <p className="text-muted-foreground">
              Min:{" "}
              <span className="text-card-foreground">
                {formatMetric(entry.metrics.min, entry.channel.unit)}
              </span>
            </p>
            <p className="text-muted-foreground">
              Max:{" "}
              <span className="text-card-foreground">
                {formatMetric(entry.metrics.max, entry.channel.unit)}
              </span>
            </p>
            <p className="text-muted-foreground">
              Mean:{" "}
              <span className="text-card-foreground">
                {formatMetric(entry.metrics.mean, entry.channel.unit)}
              </span>
            </p>
            <p className="text-muted-foreground">
              Latest:{" "}
              <span className="text-card-foreground">
                {formatMetric(entry.metrics.latest, entry.channel.unit)}
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
