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
    return <p className="text-sm text-gray-400">No channels configured for this run.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60">
      <table className="min-w-full divide-y divide-gray-800 text-sm">
        <thead className="bg-gray-900 text-xs uppercase tracking-wider text-gray-400">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Unit</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {channels.map((channel) => (
            <tr key={channel.id} className="hover:bg-gray-900/80">
              <td className="px-4 py-3 font-medium text-white">{channel.name}</td>
              <td className="px-4 py-3 text-gray-300">{channel.dataType}</td>
              <td className="px-4 py-3 text-gray-400">{channel.unit ?? "-"}</td>
              <td className="px-4 py-3 text-right">
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(channel.id)}
                    disabled={deletingId === channel.id}
                    className="rounded-md border border-red-500/50 px-2.5 py-1 text-xs text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-70"
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
