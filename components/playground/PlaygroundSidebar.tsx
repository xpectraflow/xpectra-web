"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { useContextMenu, ContextMenu, ContextMenuItem } from "@/components/playground/ContextMenu";
import { usePlayground } from "@/components/playground/PlaygroundContext";
import {
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Database,
  Radio,
  ArrowLeft,
  LogOut,
  Loader2,
  BarChart2,
  Hash,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

const EXPERIMENT_STATUS_DOT: Record<string, string> = {
  active: "bg-[#00a2f4]",
  draft: "bg-[#f59e0b]",
  archived: "bg-[#353534]",
};

const DATASET_STATUS_COLOR: Record<string, string> = {
  completed: "text-[#16a34a]",
  running: "text-[#2563eb]",
  queued: "text-[#f59e0b]",
  failed: "text-[#dc2626]",
};

/* ─── Channels inside a dataset ─────────────────────────────────────────────── */

function DatasetChannels({
  experimentId,
  datasetId,
  datasetName,
}: {
  experimentId: string;
  datasetId: string;
  datasetName: string;
}) {
  const { addPlot } = usePlayground();
  const { menu, open: openMenu, close: closeMenu } = useContextMenu();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  const channelsQuery = trpc.channels.getChannels.useQuery(
    { experimentId, datasetId },
    { enabled: true }
  );
  const channels = channelsQuery.data ?? [];

  const handleChannelClick = (e: React.MouseEvent, channel: any) => {
    e.preventDefault();
    e.stopPropagation();

    const id = channel.id;

    if (e.shiftKey && lastClickedId) {
      // Range selection
      const currentIndex = channels.findIndex((c) => c.id === id);
      const lastIndex = channels.findIndex((c) => c.id === lastClickedId);
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        const rangeIds = channels.slice(start, end + 1).map((c) => c.id);
        setSelectedIds(Array.from(new Set([...selectedIds, ...rangeIds])));
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      // Single select
      setSelectedIds([id]);
    }
    setLastClickedId(id);
  };

  const handleContextMenu = (e: React.MouseEvent, channel: any) => {
    e.preventDefault();
    
    // If we right-click an unselected item, select it alone
    let currentSelection = selectedIds;
    if (!selectedIds.includes(channel.id)) {
      currentSelection = [channel.id];
      setSelectedIds(currentSelection);
      setLastClickedId(channel.id);
    }

    const items: ContextMenuItem[] = [
      {
        type: "item",
        label: `Plot in separate panels (${currentSelection.length})`,
        icon: <BarChart2 className="h-3.5 w-3.5" />,
        onClick: () => {
          addPlot({
            datasetId,
            datasetName,
            experimentId,
            channelIds: currentSelection,
            layout: "separate",
          });
          setSelectedIds([]); 
        },
      },
      {
        type: "item",
        label: `Plot in single panel (Overlaid)`,
        icon: <BarChart2 className="h-3.5 w-3.5 text-[#f97316]" />,
        onClick: () => {
          addPlot({
            datasetId,
            datasetName,
            experimentId,
            channelIds: currentSelection,
            layout: "overlay",
          });
          setSelectedIds([]);
        },
      },
      { type: "separator" },
      {
        type: "item",
        label: "Clear selection",
        onClick: () => setSelectedIds([]),
      },
    ];

    openMenu(e, items);
  };

  if (channelsQuery.isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <p className="px-3 py-1 font-mono text-[10px] text-muted-foreground/50">
        No channels
      </p>
    );
  }

  return (
    <div className="relative">
      {channels.map((ch) => {
        const isSelected = selectedIds.includes(ch.id);
        return (
          <div
            key={ch.id}
            onClick={(e) => handleChannelClick(e, ch)}
            onContextMenu={(e) => handleContextMenu(e, ch)}
            className={`flex cursor-pointer select-none items-center gap-2 rounded px-3 py-1 text-[11px] transition-all ${
              isSelected
                ? "bg-[#f97316]/10 text-foreground ring-1 ring-inset ring-[#f97316]/30"
                : "text-muted-foreground/70 hover:bg-[#1c1b1b] hover:text-muted-foreground"
            }`}
          >
            <Hash
              className={`h-2.5 w-2.5 shrink-0 ${
                isSelected ? "text-[#f97316]" : "text-muted-foreground/30"
              }`}
            />
            <span className="flex-1 truncate">{ch.name}</span>
            {ch.unit && (
              <span className="font-mono text-[10px] opacity-40">{ch.unit}</span>
            )}
          </div>
        );
      })}

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={closeMenu} />
      )}
    </div>
  );
}

/* ─── Dataset row with right-click ────────────────────────────────────────────── */

function DatasetRow({
  dataset,
  experimentId,
  open,
  onToggle,
}: {
  dataset: { id: string; name: string; status: string };
  experimentId: string;
  open: boolean;
  onToggle: () => void;
}) {
  const { addPlot } = usePlayground();
  const { menu, open: openMenu, close: closeMenu } = useContextMenu();

  const menuItems: ContextMenuItem[] = [
    {
      type: "item",
      label: "Plot all in separate panels",
      icon: <BarChart2 className="h-3.5 w-3.5" />,
      onClick: () =>
        addPlot({
          datasetId: dataset.id,
          datasetName: dataset.name,
          experimentId,
          layout: "separate",
        }),
    },
    {
      type: "item",
      label: "Plot all in single panel",
      icon: <BarChart2 className="h-3.5 w-3.5 text-[#f97316]" />,
      onClick: () =>
        addPlot({
          datasetId: dataset.id,
          datasetName: dataset.name,
          experimentId,
          layout: "overlay",
        }),
    },
    { type: "separator" },
    {
      type: "item",
      label: "Open dataset →",
      icon: <Database className="h-3.5 w-3.5" />,
      onClick: () => {
        window.location.href = `/datasets`;
      },
    },
  ];

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        onContextMenu={(e) => openMenu(e, menuItems)}
        className="group flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-[12px] text-muted-foreground transition hover:bg-[#1c1b1b] hover:text-foreground"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-[#f97316]/70" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-100" />
        )}
        <Database className="h-3 w-3 shrink-0 text-muted-foreground/50" />
        <span className="flex-1 truncate">{dataset.name}</span>
        <span
          className={`font-mono text-[9px] uppercase tracking-wider ${
            DATASET_STATUS_COLOR[dataset.status] ?? "text-muted-foreground/40"
          }`}
        >
          {dataset.status}
        </span>
      </button>

      {open && (
        <div className="ml-5 mt-0.5 space-y-0">
          <DatasetChannels 
            experimentId={experimentId} 
            datasetId={dataset.id} 
            datasetName={dataset.name}
          />
        </div>
      )}

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={closeMenu} />
      )}
    </div>
  );
}

/* ─── Datasets for an experiment ─────────────────────────────────────────────── */

function ExperimentDatasets({ experimentId }: { experimentId: string }) {
  const datasetsQuery = trpc.datasets.getDatasets.useQuery({ experimentId });
  const rawDatasets = datasetsQuery.data ?? [];
  const datasets = rawDatasets.filter(
    (ds) => ds.status !== "failed" && (ds.rowCount ?? 0) > 0
  );
  const [openDatasets, setOpenDatasets] = useState<Record<string, boolean>>({});

  function toggleDataset(id: string) {
    setOpenDatasets((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (datasetsQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading datasets…
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <p className="px-4 py-2 font-mono text-[10px] text-muted-foreground/50">
        No datasets in this experiment.
      </p>
    );
  }

  return (
    <div className="mt-1 space-y-0.5 pb-1">
      <p className="mb-1 px-4 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/40">
        Datasets
      </p>
      {datasets.map((ds) => (
        <DatasetRow
          key={ds.id}
          dataset={ds}
          experimentId={experimentId}
          open={!!openDatasets[ds.id]}
          onToggle={() => toggleDataset(ds.id)}
        />
      ))}
    </div>
  );
}

/* ─── Experiment row ────────────────────────────────────────────────────────── */

function ExperimentRow({
  experiment,
  selected,
  onSelect,
}: {
  experiment: { id: string; name: string; status: string };
  selected: boolean;
  onSelect: () => void;
}) {
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
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          EXPERIMENT_STATUS_DOT[experiment.status] ?? "bg-[#353534]"
        }`}
      />
    </button>
  );
}

/* ─── Sidebar ───────────────────────────────────────────────────────────────── */

type PlaygroundSidebarProps = {
  selectedExperimentId: string | null;
  onSelectExperiment: (id: string) => void;
};

export function PlaygroundSidebar({
  selectedExperimentId,
  onSelectExperiment,
}: PlaygroundSidebarProps) {
  const { data: session } = useSession();
  const experimentsQuery = trpc.experiments.getExperiments.useQuery();
  const experiments = experimentsQuery.data ?? [];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[#27272a] bg-[#0e0e0e]">
      {/* ── Brand ── */}
      <div className="flex items-center gap-3 border-b border-[#27272a] px-4 py-3">
        <div className="relative h-7 w-8 shrink-0 overflow-hidden rounded">
          <Image src="/logo.svg" alt="Xpectra" fill className="object-contain" priority />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">Xpectra</p>
          <p className="font-mono text-[10px] text-[#f97316]">MISSION CONTROL</p>
        </div>
      </div>

      {/* ── Back link ── */}
      <div className="border-b border-[#27272a] px-3 py-2">
        <Link
          href="/experiments"
          className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-[#1c1b1b] hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to console
        </Link>
      </div>

      {/* ── Tree ── */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
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

                {selectedExperimentId === exp.id && (
                  <ExperimentDatasets experimentId={exp.id} />
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
          <div className="min-w-0 flex-1">
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
