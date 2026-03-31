"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ChannelForm } from "@/components/channels/ChannelForm";
import { ChannelList } from "@/components/channels/ChannelList";
import { PageLayout } from "@/components/PageLayout";
import { RunForm } from "@/components/runs/RunForm";
import { trpc } from "@/lib/trpc";

export default function RunDetailsPage() {
  const params = useParams<{ experimentId: string; runId: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null);

  const runQuery = trpc.runs.getRunById.useQuery({
    experimentId: params.experimentId,
    id: params.runId,
  });

  const channelsQuery = trpc.channels.getChannels.useQuery({
    experimentId: params.experimentId,
    runId: params.runId,
  });

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
          className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 transition hover:bg-gray-800"
        >
          Back to experiment
        </Link>
      }
    >
      {runQuery.isLoading && <p className="text-sm text-gray-400">Loading run...</p>}

      {runQuery.error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          Failed to load run: {runQuery.error.message}
        </p>
      )}

      {runQuery.data && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
            <h2 className="text-xl font-semibold text-white">{runQuery.data.name}</h2>
            <p className="mt-1 text-sm text-gray-400">
              Created {new Date(runQuery.data.createdAt).toLocaleString()}
            </p>
          </div>

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
              <p className="text-sm text-gray-400">Loading channels...</p>
            )}

            {channelsQuery.error && (
              <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
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
        </div>
      )}
    </PageLayout>
  );
}
