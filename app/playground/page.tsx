"use client";

import { SectionHeader } from "@/components/playground/SectionHeader";
import { StatCard } from "@/components/playground/StatCard";
import { ChartPanel } from "@/components/playground/ChartPanel";
import { AlertRule } from "@/components/playground/AlertRule";
import { ActivityLogItem } from "@/components/playground/ActivityLogItem";
import { usePlayground } from "@/components/playground/PlaygroundContext";
import { trpc } from "@/lib/trpc";
import {
  FlaskConical,
  Activity,
  Cpu,
  Thermometer,
  Zap,
  BarChart2,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

// ─── Empty / placeholder states ──────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#1c1b1b] text-[#f97316]/60">
        <FlaskConical className="h-8 w-8" />
      </div>
      <div>
        <h2 className="font-['Manrope',sans-serif] text-lg font-semibold text-foreground">
          Select an experiment
        </h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Choose an experiment from the sidebar to load its sensors and telemetry
          data into the Mission Control canvas.
        </p>
      </div>
      <Link
        href="/experiments"
        className="mt-2 rounded bg-[#1c1b1b] px-4 py-2 text-xs font-medium text-muted-foreground ring-1 ring-[#27272a] transition hover:bg-[#201f1f] hover:text-foreground"
      >
        Browse experiments →
      </Link>
    </div>
  );
}

function NoSensorsState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#1c1b1b] text-[#f97316]/60">
        <Activity className="h-8 w-8" />
      </div>
      <div>
        <h2 className="font-['Manrope',sans-serif] text-lg font-semibold text-foreground">
          No sensors linked
        </h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          This experiment doesn't have any sensors attached yet. Go to the
          Experiments page to configure sensors.
        </p>
      </div>
      <Link
        href="/experiments"
        className="mt-2 rounded bg-[#1c1b1b] px-4 py-2 text-xs font-medium text-muted-foreground ring-1 ring-[#27272a] transition hover:bg-[#201f1f] hover:text-foreground"
      >
        Configure experiment →
      </Link>
    </div>
  );
}

// ─── Stat skeleton ────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="animate-pulse rounded bg-[#1c1b1b] p-4">
      <div className="mb-3 h-2 w-24 rounded bg-[#27272a]" />
      <div className="h-8 w-16 rounded bg-[#27272a]" />
    </div>
  );
}

// ─── Chart placeholder (no data yet) ─────────────────────────────────────────

function ChartEmptyContent({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-muted-foreground/40">
      <BarChart2 className="h-5 w-5" />
      <span className="font-mono text-xs">{label}</span>
    </div>
  );
}

// ─── Transformation placeholder ───────────────────────────────────────────────

const PLACEHOLDER_ALERT_RULES = [
  {
    name: "High Thermal Load",
    condition: "If temp_01 > 85.0 for 5s → ALERT",
    channel: "temp_01",
    severity: "high" as const,
  },
  {
    name: "RPM Fluctuation",
    condition: "If spindle_rpm variance > 10%",
    channel: "spindle_rpm",
    severity: "medium" as const,
  },
];

// ─── Activity log placeholder ─────────────────────────────────────────────────

const PLACEHOLDER_LOGS = [
  { timestamp: "--:--:--", message: "Awaiting live telemetry stream…", level: "info" as const },
  { timestamp: "--:--:--", message: "Connect a sensor to start streaming", level: "info" as const },
];

// ─── Main content (when experiment is selected) ───────────────────────────────

function MissionContent({ experimentId }: { experimentId: string }) {
  const experimentQuery = trpc.experiments.getExperimentById.useQuery(
    { id: experimentId },
    { enabled: !!experimentId }
  );
  const sensorsQuery = trpc.sensors.getSensors.useQuery();

  const experiment = experimentQuery.data;
  const sensors = sensorsQuery.data ?? [];

  const isLoading = experimentQuery.isLoading || sensorsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading telemetry…</span>
      </div>
    );
  }

  if (!experiment) return null;

  if (sensors.length === 0) {
    return <NoSensorsState />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>

      {/* ── Info banner: sensor count ─────────────────────────── */}
      <div className="mb-5 flex items-center gap-2 rounded bg-[#1c1b1b] px-4 py-2.5">
        <Activity className="h-4 w-4 text-[#f97316]" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{sensors.length}</span>{" "}
          sensor{sensors.length !== 1 ? "s" : ""} in this organisation ·{" "}
          <span className="font-semibold text-foreground">
            {experiment.sensorConfig
              ? "Sensor config attached"
              : "No sensor config — link sensors in Experiments →"}
          </span>
        </p>
        <button
          type="button"
          className="ml-auto flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Left: Charts area */}
        <div className="space-y-5">
          <ChartPanel
            title="Live Vibration Analysis"
            subtitle="Awaiting telemetry stream"
            badge="—"
            minHeight={240}
          >
            <ChartEmptyContent label="No live data — connect sensor to stream" />
          </ChartPanel>

          <div className="grid gap-5 md:grid-cols-2">
            <ChartPanel
              title="Channel Overview"
              subtitle="All channels"
              badge="—"
              minHeight={200}
            >
              <ChartEmptyContent label="No channel data" />
            </ChartPanel>

            <ChartPanel
              title="Signal Transform"
              subtitle="Frequency domain"
              badge="FFT"
              minHeight={200}
            >
              <ChartEmptyContent label="No signal data" />
            </ChartPanel>
          </div>
        </div>

        {/* Right: Sidebar panels */}
        <div className="space-y-5">
          {/* Transformations */}
          <div className="rounded bg-[#131313] p-4">
            <SectionHeader
              title="Transformations"
              badge="RULES"
              action={
                <button
                  type="button"
                  className="flex items-center gap-1 rounded bg-[#1c1b1b] px-2 py-1 font-mono text-[10px] text-muted-foreground transition hover:text-foreground"
                >
                  <ShieldAlert className="h-3 w-3" />
                  Manage
                </button>
              }
            />
            <div className="space-y-2">
              {PLACEHOLDER_ALERT_RULES.map((rule) => (
                <AlertRule key={rule.name} {...rule} active={false} />
              ))}
              <p className="pt-1 font-mono text-[10px] text-muted-foreground/50">
                Rules will fire once live telemetry is streaming.
              </p>
            </div>
          </div>

          {/* Activity Log */}
          <div className="rounded bg-[#131313] p-4">
            <SectionHeader title="System Activity" badge="LOG" />
            <div className="rounded bg-[#0e0e0e] p-3">
              {PLACEHOLDER_LOGS.map((entry) => (
                <ActivityLogItem
                  key={entry.message}
                  timestamp={entry.timestamp}
                  message={entry.message}
                  level={entry.level}
                />
              ))}
            </div>
          </div>

          {/* Sensor list summary */}
          <div className="rounded bg-[#1c1b1b] p-4">
            <SectionHeader title="Sensors" subtitle="Organisation scope" />
            <div className="space-y-1.5">
              {sensors.slice(0, 5).map((sensor) => (
                <div
                  key={sensor.id}
                  className="flex items-center gap-2 rounded bg-[#131313] px-3 py-2"
                >
                  <Activity className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-xs text-muted-foreground">
                    {sensor.name}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/50">
                    {sensor.channelCount}ch
                  </span>
                </div>
              ))}
              {sensors.length > 5 && (
                <p className="pt-1 text-center font-mono text-[10px] text-muted-foreground/50">
                  +{sensors.length - 5} more
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#27272a] bg-[#0e0e0e] px-6">
      <div className="flex items-center gap-3">
        <Cpu className="h-4 w-4 text-[#f97316]" />
        <div>
          <span className="font-['Manrope',sans-serif] text-sm font-semibold text-foreground">
            {title ?? "Mission Control"}
          </span>
          {subtitle && (
            <span className="ml-2 font-mono text-[11px] text-muted-foreground">
              · {subtitle}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[#27272a]" />
          IDLE
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const { selectedExperimentId } = usePlayground();

  // Fetch experiment name for the topbar
  const experimentQuery = trpc.experiments.getExperimentById.useQuery(
    { id: selectedExperimentId! },
    { enabled: !!selectedExperimentId }
  );
  const expName = experimentQuery.data?.name;

  return (
    <>
      <TopBar
        title={expName ?? "Mission Control"}
        subtitle={selectedExperimentId ? "Project Alpha · Telemetry Console" : undefined}
      />

      {!selectedExperimentId ? (
        <EmptyState />
      ) : (
        <MissionContent experimentId={selectedExperimentId} />
      )}
    </>
  );
}
