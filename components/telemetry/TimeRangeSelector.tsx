"use client";

type TimeRangePreset = "1h" | "6h" | "24h" | "7d";

type TimeRange = {
  from: string;
  to: string;
  maxPointsPerChannel: number;
};

type TimeRangeSelectorProps = {
  selectedPreset: TimeRangePreset;
  onPresetChange: (preset: TimeRangePreset, range: TimeRange) => void;
};

function createRangeForPreset(preset: TimeRangePreset): TimeRange {
  const now = new Date();
  const from = new Date(now);

  if (preset === "1h") from.setHours(now.getHours() - 1);
  if (preset === "6h") from.setHours(now.getHours() - 6);
  if (preset === "24h") from.setDate(now.getDate() - 1);
  if (preset === "7d") from.setDate(now.getDate() - 7);

  return {
    from: from.toISOString(),
    to: now.toISOString(),
    maxPointsPerChannel: 800,
  };
}

export function TimeRangeSelector({
  selectedPreset,
  onPresetChange,
}: TimeRangeSelectorProps) {
  const presets: TimeRangePreset[] = ["1h", "6h", "24h", "7d"];

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Time range</h3>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onPresetChange(preset, createRangeForPreset(preset))}
            className={`rounded-md border px-3 py-1.5 text-xs transition ${
              selectedPreset === preset
                ? "border-blue-500 bg-blue-500/20 text-blue-200"
                : "border-gray-700 text-gray-300 hover:bg-gray-800"
            }`}
          >
            Last {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
