"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChannelForm } from "@/components/channels/ChannelForm";
import { ChannelList } from "@/components/channels/ChannelList";
import { PageLayout } from "@/components/PageLayout";
import { RunDetails } from "@/components/runs/RunDetails";
import { RunForm } from "@/components/runs/RunForm";
import { ChannelSelector } from "@/components/telemetry/ChannelSelector";
import { MetricsPanel } from "@/components/telemetry/MetricsPanel";
import { TelemetryChart } from "@/components/telemetry/TelemetryChart";
import { TimeRangeSelector } from "@/components/telemetry/TimeRangeSelector";
import { trpc } from "@/lib/trpc";

type TimeRangePreset = "1h" | "6h" | "24h" | "7d";

function rangeForPreset(preset: TimeRangePreset) {
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

export default function RunDetailsPage() {
  const params = useParams<{ experimentId: string; runId: string }>();
  const utils = trpc.useUtils();
  const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<TimeRangePreset>("1h");
  const [telemetryRange, setTelemetryRange] = useState(rangeForPreset("1h"));
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);

  const runQuery = trpc.runs.getRunById.useQuery({
    experimentId: params.experimentId,
    id: params.runId,
  });

  const channelsQuery = trpc.channels.getChannels.useQuery({
    experimentId: params.experimentId,
    runId: params.runId,
  });

  const effectiveSelectedChannelIds = useMemo(() => {
    const channelIds = channelsQuery.data?.map((channel) => channel.id) ?? [];
    if (channelIds.length === 0) {
      return [] as string[];
    }
    if (selectedChannelIds.length === 0) {
      return channelIds;
    }

    return selectedChannelIds.filter((channelId) => channelIds.includes(channelId));
  }, [channelsQuery.data, selectedChannelIds]);

  const telemetryQuery = trpc.telemetry.getTelemetryData.useQuery(
    {
      experimentId: params.experimentId,
      runId: params.runId,
      channelIds: effectiveSelectedChannelIds,
      range: telemetryRange,
    },
    {
      enabled: effectiveSelectedChannelIds.length > 0,
    },
  );

  const updateRunMutation = trpc.runs.updateRun.useMutation({
    onSuccess: async () => {
      await utils.runs.getRunById.invalidate({
        experimentId: params.experimentId,
        id: params.runId,
      });
      await utils.runs.getRuns.invalidate({ experimentId: params.experimentId });
    },
  });

  const createChannelMutation = trpc.channels.createChannel.useMutation({
    onSuccess: async () => {
      await utils.channels.getChannels.invalidate({
        experimentId: params.experimentId,
        runId: params.runId,
      });
    },
  });

  const deleteChannelMutation = trpc.channels.deleteChannel.useMutation({
    onSuccess: async () => {
      await utils.channels.getChannels.invalidate({
        experimentId: params.experimentId,
        runId: params.runId,
      });
      setDeletingChannelId(null);
    },
    onError: () => {
      setDeletingChannelId(null);
    },
  });

  return (
    <PageLayout
      title="Run details"
      description="Manage run state and channel definitions."
      action={
        <Link
          href={`/experiments/${params.experimentId}`}
          className="rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
        >
          Back to experiment
        </Link>
      }
    >
      {runQuery.isLoading && <p className="text-sm text-muted-foreground">Loading run...</p>}

      {runQuery.error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          Failed to load run: {runQuery.error.message}
        </p>
      )}

      {runQuery.data && (
        <div className="space-y-6">
          <RunDetails run={runQuery.data} />

          <RunForm
            submitLabel="Update run"
            isSubmitting={updateRunMutation.isPending}
            initialValues={{
              name: runQuery.data.name,
              status: runQuery.data.status as "queued" | "running" | "completed" | "failed",
            }}
            onSubmit={async (values) => {
              await updateRunMutation.mutateAsync({
                experimentId: params.experimentId,
                id: params.runId,
                name: values.name,
                status: values.status,
                startedAt: runQuery.data.startedAt
                  ? new Date(runQuery.data.startedAt).toISOString()
                  : null,
                endedAt: runQuery.data.endedAt
                  ? new Date(runQuery.data.endedAt).toISOString()
                  : null,
              });
            }}
          />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Channels</h3>

            <ChannelForm
              submitLabel="Add channel"
              isSubmitting={createChannelMutation.isPending}
              onSubmit={async (values) => {
                await createChannelMutation.mutateAsync({
                  experimentId: params.experimentId,
                  runId: params.runId,
                  name: values.name,
                  unit: values.unit || null,
                  dataType: values.dataType,
                });
              }}
            />

            {channelsQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Loading channels...</p>
            )}

            {channelsQuery.error && (
              <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                Failed to load channels: {channelsQuery.error.message}
              </p>
            )}

            {channelsQuery.data && (
              <ChannelList
                channels={channelsQuery.data}
                deletingId={deletingChannelId}
                onDelete={(channelId) => {
                  setDeletingChannelId(channelId);
                  deleteChannelMutation.mutate({
                    experimentId: params.experimentId,
                    runId: params.runId,
                    id: channelId,
                  });
                }}
              />
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Telemetry</h3>

            {channelsQuery.data && (
              <div className="grid gap-4 lg:grid-cols-2">
                <ChannelSelector
                  channels={channelsQuery.data.map((channel) => ({
                    id: channel.id,
                    name: channel.name,
                  }))}
                  selectedChannelIds={effectiveSelectedChannelIds}
                  onChange={setSelectedChannelIds}
                />
                <TimeRangeSelector
                  selectedPreset={selectedPreset}
                  onPresetChange={(preset, range) => {
                    setSelectedPreset(preset);
                    setTelemetryRange(range);
                  }}
                />
              </div>
            )}

            {telemetryQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Loading telemetry...</p>
            )}

            {telemetryQuery.error && (
              <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                Failed to load telemetry: {telemetryQuery.error.message}
              </p>
            )}

            {telemetryQuery.data && (
              <div className="space-y-4">
                <TelemetryChart series={telemetryQuery.data.series} />
                <MetricsPanel series={telemetryQuery.data.series} />
              </div>
            )}
          </section>
        </div>
      )}
    </PageLayout>
  );
}
