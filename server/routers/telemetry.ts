import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { queryTelemetryFromConsumer } from "@/lib/consumer-telemetry-client";
import { channels } from "@/server/db/schema";
import {
  assertRunOwnership,
  getOrCreateDbUser,
  userInfoFromSession,
} from "@/server/routers/ownership";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const telemetryRangeSchema = z.object({
  from: z.iso.datetime(),
  to: z.iso.datetime(),
  maxPointsPerChannel: z.number().int().min(50).max(5000).default(800),
});

const telemetryInputSchema = z.object({
  experimentId: z.uuid(),
  runId: z.uuid(),
  channelIds: z.array(z.uuid()).min(1),
  range: telemetryRangeSchema,
});

type RawPoint = {
  timestamp: string;
  value: number;
};

function downsampleByStride(points: RawPoint[], maxPoints: number): RawPoint[] {
  if (points.length <= maxPoints) return points;

  const stride = Math.ceil(points.length / maxPoints);
  const sampled: RawPoint[] = [];

  for (let index = 0; index < points.length; index += stride) {
    sampled.push(points[index]);
  }

  const lastPoint = points[points.length - 1];
  const lastSampled = sampled[sampled.length - 1];
  if (lastSampled !== lastPoint) {
    sampled.push(lastPoint);
  }

  return sampled;
}

export const telemetryRouter = createTRPCRouter({
  getTelemetryData: protectedProcedure
    .input(telemetryInputSchema)
    .query(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        ...userInfoFromSession(ctx.session),
      });

      await assertRunOwnership({
        db: ctx.db,
        experimentId: input.experimentId,
        runId: input.runId,
        userId,
      });

      const requestedChannels = await ctx.db
        .select({
          id: channels.id,
          name: channels.name,
          unit: channels.unit,
          dataType: channels.dataType,
        })
        .from(channels)
        .where(
          and(
            eq(channels.runId, input.runId),
            inArray(channels.id, input.channelIds),
          ),
        );

      if (requestedChannels.length === 0) {
        return { series: [] };
      }

      const fromDate = new Date(input.range.from);
      const toDate = new Date(input.range.to);

      const rawTelemetryRows = await queryTelemetryFromConsumer({
        experimentId: input.experimentId,
        runId: input.runId,
        channelIds: requestedChannels.map((channel) => channel.id),
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        maxPointsPerChannel: input.range.maxPointsPerChannel,
      });

      const groupedPoints = new Map<string, RawPoint[]>();
      for (const row of rawTelemetryRows) {
        const points = groupedPoints.get(row.channelId) ?? [];
        points.push({
          timestamp: row.timestamp,
          value: row.value,
        });
        groupedPoints.set(row.channelId, points);
      }

      const series = requestedChannels.map((channel) => {
        const allPoints = groupedPoints.get(channel.id) ?? [];
        const displayPoints = downsampleByStride(
          allPoints,
          input.range.maxPointsPerChannel,
        );

        const total = allPoints.length;
        const values = allPoints.map((point) => point.value);
        const min = total > 0 ? Math.min(...values) : null;
        const max = total > 0 ? Math.max(...values) : null;
        const mean =
          total > 0
            ? values.reduce((sum, value) => sum + value, 0) / total
            : null;
        const latest = total > 0 ? allPoints[allPoints.length - 1].value : null;

        return {
          channel: channel,
          points: displayPoints.map((point) => ({
            timestamp: point.timestamp,
            value: point.value,
          })),
          metrics: {
            count: total,
            min,
            max,
            mean,
            latest,
          },
        };
      });

      return { series };
    }),
});
