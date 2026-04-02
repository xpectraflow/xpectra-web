import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { datasets } from "@/server/db/schema";
import {
  assertExperimentInOrganization,
  assertDatasetInOrganization,
  getOrCreateDbUser,
  getPrimaryOrganizationIdForUser,
  userInfoFromSession,
} from "@/server/routers/ownership";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const datasetStatusSchema = z.enum(["queued", "running", "completed", "failed"]);

const datasetScopeInput = z.object({
  experimentId: z.uuid(),
});

const createDatasetInput = datasetScopeInput.extend({
  name: z.string().trim().min(2).max(120),
  status: datasetStatusSchema.default("queued"),
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

    const [createdDataset] = await ctx.db
      .insert(datasets)
      .values({
        id: randomUUID(),
        experimentId: input.experimentId,
        name: input.name,
        status: input.status,
      })
      .returning();

    return createdDataset;
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
