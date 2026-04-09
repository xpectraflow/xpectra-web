"use client";

import { Hash, Activity, Minimize2, Trash2, Cpu } from "lucide-react";

type ChannelItem = {
  id: string;
  name: string;
  unit: string | null;
  dataType: string;
};

type ChannelListProps = {
  channels: ChannelItem[];
  deletingId?: string | null;
  onDelete?: (id: string) => void;
};

export function ChannelList({ channels, deletingId, onDelete }: ChannelListProps) {
  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
        <Cpu className="mb-3 h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No channels configured for this dataset.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0e0e0e] shadow-xl ring-1 ring-white/10">
      <table className="min-w-full divide-y divide-white/5 text-sm">
        <thead className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-muted-foreground/50">
          <tr>
            <th className="px-6 py-4 text-left font-bold">Signal Name</th>
            <th className="px-6 py-4 text-left font-bold">Precision</th>
            <th className="px-6 py-4 text-left font-bold">Unit</th>
            <th className="px-6 py-4 text-right font-bold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {channels.map((channel) => (
            <tr key={channel.id} className="group transition hover:bg-white/[0.03]">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-[#f97316]/60 transition group-hover:bg-[#f97316]/10 group-hover:text-[#f97316]">
                    <Activity className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-white">{channel.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-white/5 transition group-hover:bg-white/10 group-hover:text-white">
                  {channel.dataType}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="font-medium text-muted-foreground/70">{channel.unit || "—"}</span>
              </td>
              <td className="px-6 py-4 text-right">
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(channel.id)}
                    disabled={deletingId === channel.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === channel.id ? "Deleting..." : "Delete"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
