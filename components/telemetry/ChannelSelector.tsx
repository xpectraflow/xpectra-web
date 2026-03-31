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
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-card-foreground">Channels</h3>
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
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
