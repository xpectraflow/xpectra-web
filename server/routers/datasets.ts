import { randomUUID, randomBytes } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { datasets, experiments, channels, sensorChannels } from "@/server/db/schema";
import {
  assertExperimentInOrganization,
  assertDatasetInOrganization,
  getOrCreateDbUser,
  getPrimaryOrganizationIdForUser,
  userInfoFromSession,
} from "@/server/routers/ownership";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/trpc";
import bcrypt from "bcryptjs";

const datasetStatusSchema = z.enum(["queued", "running", "completed", "failed"]);

const datasetScopeInput = z.object({
  experimentId: z.uuid(),
});

const createDatasetInput = datasetScopeInput.extend({
  name: z.string().trim().min(2).max(120),
  status: datasetStatusSchema.default("queued"),
});

const getRunMetadataInput = z.object({
  runId: z.string().uuid(),
  telemetryIngestKey: z.string(),
});

const datasetIdInput = datasetScopeInput.extend({
  id: z.uuid(),
});

const updateDatasetInput = datasetIdInput.extend({
  name: z.string().trim().min(2).max(120),
  status: datasetStatusSchema,
  startedAt: z.iso.datetime().nullish(),
  endedAt: z.iso.datetime().nullish(),
});

export const datasetsRouter = createTRPCRouter({
  createDataset: protectedProcedure.input(createDatasetInput).mutation(async ({ ctx, input }) => {
    const userId = await getOrCreateDbUser({
      db: ctx.db,
      ...userInfoFromSession(ctx.session),
    });
    const organizationId = await getPrimaryOrganizationIdForUser({
      db: ctx.db,
      userId,
    });

    await assertExperimentInOrganization({
      db: ctx.db,
      experimentId: input.experimentId,
      organizationId,
    });

    const experiment = await ctx.db.query.experiments.findFirst({
      where: (exp, { eq }) => eq(exp.id, input.experimentId),
    });

    if (!experiment) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Experiment not found" });
    }

    const unhashedKey = randomBytes(32).toString("hex");
    const hashedKey = await bcrypt.hash(unhashedKey, 10);
    const datasetId = randomUUID();

    const [createdDataset] = await ctx.db
      .insert(datasets)
      .values({
        id: datasetId,
        experimentId: input.experimentId,
        name: input.name,
        status: input.status,
        telemetryIngestKey: hashedKey,
      })
      .returning();

    return {
      ...createdDataset,
      unhashedTelemetryIngestKey: unhashedKey,
      hypertableName: experiment.hypertableName,
    };
  }),

  getRunMetadata: publicProcedure.input(getRunMetadataInput).query(async ({ ctx, input }) => {
    const dataset = await ctx.db.query.datasets.findFirst({
      where: (ds, { eq }) => eq(ds.id, input.runId),
      with: {
        experiment: true,
      },
    });

    if (!dataset || !dataset.telemetryIngestKey) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
    }

    const isValid = await bcrypt.compare(input.telemetryIngestKey, dataset.telemetryIngestKey);
    if (!isValid) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid telemetry ingest key" });
    }

    // Fetch snapshot channels instead of calculating from experiment config
    const datasetChannels = await ctx.db.query.channels.findMany({
      where: (ch, { eq }) => eq(ch.datasetId, dataset.id)
    });

    // Extract indices from "ch_N" column names for Go consumer compatibility
    const indices = datasetChannels
      .map(ch => parseInt(ch.hypertableColName.replace("ch_", ""), 10))
      .filter(idx => !isNaN(idx))
      .sort((a, b) => a - b);

    return {
      experimentId: dataset.experimentId,
      hypertableName: dataset.experiment.hypertableName,
      channelIndices: indices,
    };
  }),

  getDatasets: protectedProcedure.input(datasetScopeInput).query(async ({ ctx, input }) => {
    const userId = await getOrCreateDbUser({
      db: ctx.db,
      ...userInfoFromSession(ctx.session),
    });
    const organizationId = await getPrimaryOrganizationIdForUser({
      db: ctx.db,
      userId,
    });

    await assertExperimentInOrganization({
      db: ctx.db,
      experimentId: input.experimentId,
      organizationId,
    });

    return ctx.db
      .select()
      .from(datasets)
      .where(eq(datasets.experimentId, input.experimentId))
      .orderBy(desc(datasets.createdAt));
  }),

  getAllDatasets: protectedProcedure.query(async ({ ctx }) => {
    const userId = await getOrCreateDbUser({
      db: ctx.db,
      ...userInfoFromSession(ctx.session),
    });
    const organizationId = await getPrimaryOrganizationIdForUser({
      db: ctx.db,
      userId,
    });

    return ctx.db
      .select({
        id: datasets.id,
        name: datasets.name,
        status: datasets.status,
        rowCount: datasets.rowCount,
        startedAt: datasets.startedAt,
        endedAt: datasets.endedAt,
        createdAt: datasets.createdAt,
        experimentId: datasets.experimentId,
        experimentName: experiments.name,
      })
      .from(datasets)
      .innerJoin(experiments, eq(datasets.experimentId, experiments.id))
      .where(eq(experiments.organizationId, organizationId))
      .orderBy(desc(datasets.createdAt));
  }),

  getDatasetById: protectedProcedure.input(datasetIdInput).query(async ({ ctx, input }) => {
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
      datasetId: input.id,
      organizationId,
    });

    const dataset = await ctx.db.query.datasets.findFirst({
      where: (datasetRow, { and: andOperator, eq: eqOperator }) =>
        andOperator(
          eqOperator(datasetRow.id, input.id),
          eqOperator(datasetRow.experimentId, input.experimentId),
        ),
    });

    if (!dataset) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return dataset;
  }),

  updateDataset: protectedProcedure.input(updateDatasetInput).mutation(async ({ ctx, input }) => {
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
      datasetId: input.id,
      organizationId,
    });

    const [updatedDataset] = await ctx.db
      .update(datasets)
      .set({
        name: input.name,
        status: input.status,
        startedAt: input.startedAt ? new Date(input.startedAt) : null,
        endedAt: input.endedAt ? new Date(input.endedAt) : null,
      })
      .where(and(eq(datasets.id, input.id), eq(datasets.experimentId, input.experimentId)))
      .returning();

    if (!updatedDataset) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return updatedDataset;
  }),

  deleteDataset: protectedProcedure.input(datasetIdInput).mutation(async ({ ctx, input }) => {
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
      datasetId: input.id,
      organizationId,
    });

    const [deletedDataset] = await ctx.db
      .delete(datasets)
      .where(and(eq(datasets.id, input.id), eq(datasets.experimentId, input.experimentId)))
      .returning({ id: datasets.id });

    if (!deletedDataset) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return { success: true };
  }),
});
