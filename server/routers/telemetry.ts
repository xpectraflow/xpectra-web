import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { pool } from "@/server/db";
import { datasets, channels } from "@/server/db/schema";
import {
  assertDatasetInOrganization,
  getOrCreateDbUser,
  getPrimaryOrganizationIdForUser,
  userInfoFromSession,
} from "@/server/routers/ownership";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

// ─── Smart bucketing ──────────────────────────────────────────────────────────

/**
 * Auto-picks the time_bucket interval so we return ~TARGET_POINTS aggregated
 * rows regardless of zoom level. This is the core of Tier 1 + Tier 3.
 */
function getBucketInterval(startMs: number, endMs: number, targetPoints = 2000): string {
  const rangeMs = endMs - startMs;
  const msBetweenPoints = rangeMs / targetPoints;

  if (msBetweenPoints < 50)     return "10 milliseconds";
  if (msBetweenPoints < 100)    return "50 milliseconds";
  if (msBetweenPoints < 500)    return "200 milliseconds";
  if (msBetweenPoints < 1000)   return "500 milliseconds";
  if (msBetweenPoints < 5000)   return "2 seconds";
  if (msBetweenPoints < 10000)  return "5 seconds";
  if (msBetweenPoints < 30000)  return "15 seconds";
  if (msBetweenPoints < 60000)  return "30 seconds";
  if (msBetweenPoints < 300000) return "2 minutes";
  if (msBetweenPoints < 600000) return "5 minutes";
  return "15 minutes";
}

// ─── Input schemas ─────────────────────────────────────────────────────────────

const channelDataInput = z.object({
  experimentId: z.uuid(),
  datasetId: z.uuid(),
  channelIds: z.array(z.uuid()).min(1).max(30),
  startTime: z.number(), // epoch ms
  endTime: z.number(),   // epoch ms
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const telemetryRouter = createTRPCRouter({
  /**
   * Fetches time-bucketed channel data from the TimescaleDB hypertable.
   *
   * Returns avg/min/max per bucket — the browser never sees raw rows.
   * Bucket size is auto-selected based on the zoom range (Tier 1 + Tier 3).
   *
   * Tier 2 (viewport-aware) is driven by the client: it passes the visible
   * time range as startTime/endTime and re-calls this on every zoom/pan.
   */
  getChannelData: protectedProcedure
    .input(channelDataInput)
    .query(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        ...userInfoFromSession(ctx.session),
      });
      const organizationId = await getPrimaryOrganizationIdForUser({
        db: ctx.db,
        userId,
      });

      await assertDatasetInOrganization({
        db: ctx.db,
        experimentId: input.experimentId,
        datasetId: input.datasetId,
        organizationId,
      });

      // Resolve channel metadata → hypertable column names
      const requestedChannels = await ctx.db
        .select({
          id: channels.id,
          name: channels.name,
          unit: channels.unit,
          dataType: channels.dataType,
          hypertableColName: channels.hypertableColName,
        })
        .from(channels)
        .where(
          and(
            eq(channels.datasetId, input.datasetId),
            inArray(channels.id, input.channelIds),
          ),
        );

      if (requestedChannels.length === 0) {
        return { series: [], bucketInterval: null };
      }

      // Look up the hypertable name for this dataset
      const dataset = await ctx.db.query.datasets.findFirst({
        where: eq(datasets.id, input.datasetId),
        with: { experiment: true },
      });

      if (!dataset) {
        return { series: [], bucketInterval: null };
      }

      const hypertableName = dataset.experiment.hypertableName;
      const bucketInterval = getBucketInterval(input.startTime, input.endTime);

      // Build one query per channel (avoids N+1 vs a complex pivot that's hard to type)
      const seriesPromises = requestedChannels.map(async (ch) => {
        const col = `"${ch.hypertableColName}"`;
        const sql = `
          SELECT
            time_bucket($1::interval, "time") AS t,
            avg(${col})                        AS avg,
            min(${col})                        AS min,
            max(${col})                        AS max,
            count(*)                           AS sample_count
          FROM "${hypertableName}"
          WHERE  "dataset_id" = $2
            AND  "time" >= to_timestamp($3::double precision / 1000)
            AND  "time" <= to_timestamp($4::double precision / 1000)
            AND  ${col} IS NOT NULL
          GROUP BY 1
          ORDER BY 1 ASC
          LIMIT 5000
        `;

        const result = await pool.query(sql, [
          bucketInterval,
          input.datasetId,
          input.startTime,
          input.endTime,
        ]);

        const points = result.rows.map((row: any) => ({
          t: new Date(row.t).getTime(),
          avg: parseFloat(row.avg),
          min: parseFloat(row.min),
          max: parseFloat(row.max),
          count: parseInt(row.sample_count, 10),
        }));

        return {
          channelId: ch.id,
          channelName: ch.name,
          unit: ch.unit,
          dataType: ch.dataType,
          hypertableColName: ch.hypertableColName,
          points,
        };
      });

      const series = await Promise.all(seriesPromises);

      return { series, bucketInterval };
    }),

  /**
   * Returns the full time extent of a dataset — the min/max timestamp.
   * Used to set the initial zoom window on first load.
   */
  getDatasetTimeRange: protectedProcedure
    .input(z.object({ experimentId: z.uuid(), datasetId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        ...userInfoFromSession(ctx.session),
      });
      const organizationId = await getPrimaryOrganizationIdForUser({
        db: ctx.db,
        userId,
      });

      await assertDatasetInOrganization({
        db: ctx.db,
        experimentId: input.experimentId,
        datasetId: input.datasetId,
        organizationId,
      });

      const dataset = await ctx.db.query.datasets.findFirst({
        where: eq(datasets.id, input.datasetId),
        with: { experiment: true },
      });

      if (!dataset) return { startTime: null, endTime: null };

      const hypertableName = dataset.experiment.hypertableName;
      const sql = `
        SELECT
          min("time") AS start_time,
          max("time") AS end_time
        FROM "${hypertableName}"
        WHERE "dataset_id" = $1
      `;

      const result = await pool.query(sql, [input.datasetId]);
      const row = result.rows[0];
      return {
        startTime: row?.start_time ? new Date(row.start_time).getTime() : null,
        endTime:   row?.end_time   ? new Date(row.end_time).getTime()   : null,
      };
    }),
});
