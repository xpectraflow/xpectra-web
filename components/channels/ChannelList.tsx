"use client";

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
    return <p className="text-sm text-muted-foreground">No channels configured for this run.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Unit</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {channels.map((channel) => (
            <tr key={channel.id} className="hover:bg-accent/60">
              <td className="px-4 py-3 font-medium text-card-foreground">{channel.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{channel.dataType}</td>
              <td className="px-4 py-3 text-muted-foreground">{channel.unit ?? "-"}</td>
              <td className="px-4 py-3 text-right">
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(channel.id)}
                    disabled={deletingId === channel.id}
                    className="rounded-md border border-destructive/50 px-2.5 py-1 text-xs text-destructive-foreground transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-70"
                  >
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
