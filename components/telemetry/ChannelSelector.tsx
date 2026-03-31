"use client";

type Channel = {
  id: string;
  name: string;
};

type ChannelSelectorProps = {
  channels: Channel[];
  selectedChannelIds: string[];
  onChange: (channelIds: string[]) => void;
};

export function ChannelSelector({
  channels,
  selectedChannelIds,
  onChange,
}: ChannelSelectorProps) {
  function toggleChannel(channelId: string) {
    if (selectedChannelIds.includes(channelId)) {
      onChange(selectedChannelIds.filter((id) => id !== channelId));
      return;
    }

    onChange([...selectedChannelIds, channelId]);
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Channels</h3>
      <div className="flex flex-wrap gap-2">
        {channels.map((channel) => {
          const selected = selectedChannelIds.includes(channel.id);
          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => toggleChannel(channel.id)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                selected
                  ? "border-blue-500 bg-blue-500/20 text-blue-200"
                  : "border-gray-700 text-gray-300 hover:bg-gray-800"
              }`}
            >
              {channel.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
