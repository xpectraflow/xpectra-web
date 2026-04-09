"use client";

import { Database, Clock, Hash, CheckCircle2, AlertCircle, PlayCircle, Loader2 } from "lucide-react";

type DatasetDetailsProps = {
  dataset: {
    id: string;
    name: string;
    status: string;
    rowCount: number | null;
    createdAt: Date | string;
    experimentId: string;
  };
};

export function DatasetDetails({ dataset }: DatasetDetailsProps) {
  const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
    completed: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    failed: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
    running: { icon: Loader2, color: "text-amber-400", bg: "bg-amber-500/10" },
    queued: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
  };

  const status = dataset.status.toLowerCase();
  const config = statusConfig[status] || statusConfig.queued;
  const StatusIcon = config.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0e0e0e] p-6 shadow-2xl ring-1 ring-white/10">
      {/* Background Glow */}
      <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full blur-[80px] ${config.bg.replace('/10', '/30')}`} />

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-white">{dataset.name}</h2>
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${config.color} ${config.bg} border border-white/5`}>
              <StatusIcon className={`h-3 w-3 ${status === 'running' ? 'animate-spin' : ''}`} />
              {dataset.status}
            </div>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Created {new Date(dataset.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-8">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              <Hash className="h-3 w-3" />
              Rows
            </p>
            <p className="font-mono text-xl font-medium text-white">
              {(dataset.rowCount ?? 0).toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              <Database className="h-3 w-3" />
              Dataset ID
            </p>
            <p className="font-mono text-xs font-medium text-muted-foreground">
              {dataset.id.slice(0, 8)}...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
