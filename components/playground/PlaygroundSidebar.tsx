"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import {
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Activity,
  ArrowLeft,
  LogOut,
  Loader2,
  Radio,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

type Experiment = {
  id: string;
  name: string;
  status: string;
};

type PlaygroundSidebarProps = {
  selectedExperimentId: string | null;
  onSelectExperiment: (id: string) => void;
};

/* ─── Experiment Row ─────────────────────────────────────────────────────────── */

function ExperimentRow({
  experiment,
  selected,
  onSelect,
}: {
  experiment: Experiment;
  selected: boolean;
  onSelect: () => void;
}) {
  const STATUS_COLOR: Record<string, string> = {
    active: "bg-[#00a2f4]",
    draft: "bg-[#f59e0b]",
    archived: "bg-[#353534]",
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-center gap-2.5 rounded px-3 py-2 text-left transition-all ${
        selected
          ? "bg-[#201f1f] text-foreground"
          : "text-muted-foreground hover:bg-[#1c1b1b] hover:text-foreground"
      }`}
    >
      {selected ? (
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#f97316]" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100" />
      )}
      <FlaskConical className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate text-xs font-medium">{experiment.name}</span>
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_COLOR[experiment.status] ?? "bg-muted"}`}
      />
    </button>
  );
}

/* ─── Sidebar ───────────────────────────────────────────────────────────────── */

export function PlaygroundSidebar({
  selectedExperimentId,
  onSelectExperiment,
}: PlaygroundSidebarProps) {
  const { data: session } = useSession();
  const [sensorOpen, setSensorOpen] = useState<Record<string, boolean>>({});

  const experimentsQuery = trpc.experiments.getExperiments.useQuery();
  const experiments = experimentsQuery.data ?? [];

  // Fetch sensors for the selected experiment (if any)
  const sensorsQuery = trpc.sensors.getSensors.useQuery(undefined, {
    enabled: !!selectedExperimentId,
  });
  const sensors = sensorsQuery.data ?? [];

  function toggleSensor(sensorId: string) {
    setSensorOpen((prev) => ({ ...prev, [sensorId]: !prev[sensorId] }));
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[#27272a] bg-[#0e0e0e]">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 border-b border-[#27272a] px-4 py-3">
        <div className="relative h-7 w-8 shrink-0 overflow-hidden rounded">
          <Image src="/logo.svg" alt="Xpectra" fill className="object-contain" priority />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Xpectra</p>
          <p className="font-mono text-[10px] text-[#f97316]">MISSION CONTROL</p>
        </div>
      </div>

      {/* ── Back to app ── */}
      <div className="border-b border-[#27272a] px-3 py-2">
        <Link
          href="/experiments"
          className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-[#1c1b1b] hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to console
        </Link>
      </div>

      {/* ── Experiments list ── */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          Experiments
        </p>

        {experimentsQuery.isLoading ? (
          <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading…
          </div>
        ) : experiments.length === 0 ? (
          <div className="mx-2 rounded border border-dashed border-[#27272a] p-4 text-center">
            <FlaskConical className="mx-auto mb-2 h-5 w-5 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No experiments yet.</p>
            <Link
              href="/experiments"
              className="mt-2 inline-block text-xs text-[#f97316] hover:underline"
            >
              Create one →
            </Link>
          </div>
        ) : (
          <div className="space-y-0.5">
            {experiments.map((exp) => (
              <div key={exp.id}>
                <ExperimentRow
                  experiment={exp}
                  selected={selectedExperimentId === exp.id}
                  onSelect={() => onSelectExperiment(exp.id)}
                />

                {/* Sensors for this experiment (shown when experiment is selected) */}
                {selectedExperimentId === exp.id && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                      Sensors
                    </p>
                    {sensorsQuery.isLoading ? (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </div>
                    ) : sensors.length === 0 ? (
                      <p className="px-3 text-[11px] text-muted-foreground/60">
                        No sensors linked.
                      </p>
                    ) : (
                      sensors.map((sensor) => (
                        <div key={sensor.id}>
                          <button
                            type="button"
                            onClick={() => toggleSensor(sensor.id)}
                            className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-xs text-muted-foreground transition hover:bg-[#1c1b1b] hover:text-foreground"
                          >
                            {sensorOpen[sensor.id] ? (
                              <ChevronDown className="h-3 w-3 shrink-0" />
                            ) : (
                              <ChevronRight className="h-3 w-3 shrink-0" />
                            )}
                            <Activity className="h-3 w-3 shrink-0" />
                            <span className="flex-1 truncate">{sensor.name}</span>
                          </button>

                          {sensorOpen[sensor.id] && (
                            <div className="ml-6 mt-0.5 space-y-0.5">
                              <div className="flex items-center gap-1.5 px-2 py-1">
                                <Radio className="h-3 w-3 text-muted-foreground/40" />
                                <span className="font-mono text-[10px] text-muted-foreground/60">
                                  {sensor.channelCount} ch · S/N {sensor.serialNumber ?? "—"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-[#27272a] p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#1c1b1b] font-mono text-xs font-bold text-[#f97316]">
            {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium text-foreground">
              {session?.user?.name ?? "User"}
            </p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {session?.user?.email ?? ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded p-1 text-muted-foreground transition hover:bg-[#1c1b1b] hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
