"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChannelForm } from "@/components/channels/ChannelForm";
import { ChannelList } from "@/components/channels/ChannelList";
import { PageLayout } from "@/components/PageLayout";
import { DatasetDetails } from "@/components/datasets/DatasetDetails";
import { DatasetForm } from "@/components/datasets/DatasetForm";
import { TimeRangeSelector } from "@/components/telemetry/TimeRangeSelector";
import { trpc } from "@/lib/trpc";
import { FlaskConical, ArrowRight, Activity, Loader2 } from "lucide-react";


export default function DatasetDetailsPage() {
  const params = useParams<{ experimentId: string; datasetId: string }>();
  const utils = trpc.useUtils();
  const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null);

  const datasetQuery = trpc.datasets.getDatasetById.useQuery({
    experimentId: params.experimentId,
    id: params.datasetId,
  });

  const channelsQuery = trpc.channels.getChannels.useQuery({
    experimentId: params.experimentId,
    datasetId: params.datasetId,
  });

  const updateDatasetMutation = trpc.datasets.updateDataset.useMutation({
    onSuccess: async () => {
      await utils.datasets.getDatasetById.invalidate({
        experimentId: params.experimentId,
        id: params.datasetId,
      });
      await utils.datasets.getDatasets.invalidate({ experimentId: params.experimentId });
    },
  });

  const createChannelMutation = trpc.channels.createChannel.useMutation({
    onSuccess: async () => {
      await utils.channels.getChannels.invalidate({
        experimentId: params.experimentId,
        datasetId: params.datasetId,
      });
    },
  });

  const deleteChannelMutation = trpc.channels.deleteChannel.useMutation({
    onSuccess: async () => {
      await utils.channels.getChannels.invalidate({
        experimentId: params.experimentId,
        datasetId: params.datasetId,
      });
      setDeletingChannelId(null);
    },
    onError: () => {
      setDeletingChannelId(null);
    },
  });

  return (
    <PageLayout
      title="Dataset Management"
      description="Verify ingestion vitals and prepare data for analysis."
      action={
        <div className="flex items-center gap-2">
          <Link
            href={`/playground?experimentId=${params.experimentId}&datasetId=${params.datasetId}`}
            className="flex items-center gap-2 rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#fb923c] focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            Import data to playground
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/experiments/${params.experimentId}`}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/10 hover:text-white"
          >
            Back to experiment
          </Link>
        </div>
      }
    >
      {datasetQuery.isLoading && <p className="text-sm text-muted-foreground">Loading dataset...</p>}

      {datasetQuery.error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          Failed to load dataset: {datasetQuery.error.message}
        </p>
      )}

      {datasetQuery.data && (
        <div className="space-y-6">
          <DatasetDetails dataset={datasetQuery.data} />

          <DatasetForm
            submitLabel="Update dataset"
            isSubmitting={updateDatasetMutation.isPending}
            initialValues={{
              name: datasetQuery.data.name,
              status: datasetQuery.data.status as "queued" | "running" | "completed" | "failed",
            }}
            onSubmit={async (values) => {
              await updateDatasetMutation.mutateAsync({
                experimentId: params.experimentId,
                id: params.datasetId,
                name: values.name,
                status: values.status,
                startedAt: datasetQuery.data.startedAt
                  ? new Date(datasetQuery.data.startedAt).toISOString()
                  : null,
                endedAt: datasetQuery.data.endedAt
                  ? new Date(datasetQuery.data.endedAt).toISOString()
                  : null,
              });
            }}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Configured Channels</h3>
                  <span className="rounded-md bg-white/5 px-2 py-1 font-mono text-[10px] text-muted-foreground">
                    {channelsQuery.data?.length ?? 0} TOTAL
                  </span>
                </div>

                {channelsQuery.isLoading && (
                  <div className="flex items-center justify-center py-12">
                     <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {channelsQuery.data && (
                  <ChannelList
                    channels={channelsQuery.data}
                    deletingId={deletingChannelId}
                    onDelete={(channelId) => {
                      setDeletingChannelId(channelId);
                      deleteChannelMutation.mutate({
                        experimentId: params.experimentId,
                        datasetId: params.datasetId,
                        id: channelId,
                      });
                    }}
                  />
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold">
                   <FlaskConical className="h-4 w-4 text-[#f97316]" />
                   Dataset Controls
                </div>
                
                <DatasetForm
                  submitLabel="Update Vitals"
                  isSubmitting={updateDatasetMutation.isPending}
                  initialValues={{
                    name: datasetQuery.data.name,
                    status: datasetQuery.data.status as "queued" | "running" | "completed" | "failed",
                  }}
                  onSubmit={async (values) => {
                    await updateDatasetMutation.mutateAsync({
                      experimentId: params.experimentId,
                      id: params.datasetId,
                      name: values.name,
                      status: values.status,
                      startedAt: datasetQuery.data.startedAt
                        ? new Date(datasetQuery.data.startedAt).toISOString()
                        : null,
                      endedAt: datasetQuery.data.endedAt
                        ? new Date(datasetQuery.data.endedAt).toISOString()
                        : null,
                    });
                  }}
                />
              </section>

              <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold">
                   <Activity className="h-4 w-4 text-[#f97316]" />
                   Registration
                </div>
                <p className="text-xs text-muted-foreground">
                  Define new sensory input mapping for this dataset record.
                </p>
                <ChannelForm
                  submitLabel="Register Channel"
                  isSubmitting={createChannelMutation.isPending}
                  onSubmit={async (values) => {
                    await createChannelMutation.mutateAsync({
                      experimentId: params.experimentId,
                      datasetId: params.datasetId,
                      name: values.name,
                      unit: values.unit || null,
                      dataType: values.dataType,
                    });
                  }}
                />
              </section>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
