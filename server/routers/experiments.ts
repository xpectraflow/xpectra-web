import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { experiments } from "@/server/db/schema";
import {
  assertExperimentInOrganization,
  getOrCreateDbUser,
  getPrimaryOrganizationIdForUser,
  userInfoFromSession,
} from "@/server/routers/ownership";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const sensorEntrySchema = z.object({
  sensorId: z.string().uuid(),
  channelIndices: z.array(z.number().int()).nullable(),
});

const createExperimentInput = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).nullish(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  sensors: z.array(sensorEntrySchema).optional(),
});

const experimentIdInput = z.object({
  id: z.uuid(),
});

const updateExperimentInput = createExperimentInput.extend({
  id: z.uuid(),
});

export const experimentsRouter = createTRPCRouter({
  createExperiment: protectedProcedure
    .input(createExperimentInput)
    .mutation(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        ...userInfoFromSession(ctx.session),
      });

      const organizationId = await getPrimaryOrganizationIdForUser({
        db: ctx.db,
        userId,
      });

      const [createdExperiment] = await ctx.db
        .insert(experiments)
        .values({
          id: randomUUID(),
          organizationId,
          createdBy: userId,
          name: input.name,
          description: input.description ?? null,
          status: input.status,
          sensorConfig: input.sensors?.length
            ? { sensors: input.sensors, charts: [] }
            : null,
        })
        .returning();

      return createdExperiment;
    }),

  getExperiments: protectedProcedure.query(async ({ ctx }) => {
    const userId = await getOrCreateDbUser({
      db: ctx.db,
      ...userInfoFromSession(ctx.session),
    });

    const organizationId = await getPrimaryOrganizationIdForUser({
      db: ctx.db,
      userId,
    });

    return ctx.db
      .select()
      .from(experiments)
      .where(eq(experiments.organizationId, organizationId))
      .orderBy(desc(experiments.createdAt));
  }),

  getExperimentById: protectedProcedure
    .input(experimentIdInput)
    .query(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        ...userInfoFromSession(ctx.session),
      });

      const organizationId = await getPrimaryOrganizationIdForUser({
        db: ctx.db,
        userId,
      });

      return assertExperimentInOrganization({
        db: ctx.db,
        experimentId: input.id,
        organizationId,
      });
    }),

  updateExperiment: protectedProcedure
    .input(updateExperimentInput)
    .mutation(async ({ ctx, input }) => {
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
        experimentId: input.id,
        organizationId,
      });

      const [updatedExperiment] = await ctx.db
        .update(experiments)
        .set({
          name: input.name,
          description: input.description ?? null,
          status: input.status,
          updatedAt: new Date(),
        })
        .where(
          and(eq(experiments.id, input.id), eq(experiments.organizationId, organizationId)),
        )
        .returning();

      if (!updatedExperiment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updatedExperiment;
    }),

  deleteExperiment: protectedProcedure
    .input(experimentIdInput)
    .mutation(async ({ ctx, input }) => {
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
        experimentId: input.id,
        organizationId,
      });

      const [deletedExperiment] = await ctx.db
        .delete(experiments)
        .where(
          and(eq(experiments.id, input.id), eq(experiments.organizationId, organizationId)),
        )
        .returning({ id: experiments.id });

      if (!deletedExperiment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return { success: true };
    }),

  duplicateExperiment: protectedProcedure
    .input(experimentIdInput)
    .mutation(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        ...userInfoFromSession(ctx.session),
      });

      const organizationId = await getPrimaryOrganizationIdForUser({
        db: ctx.db,
        userId,
      });

      const source = await assertExperimentInOrganization({
        db: ctx.db,
        experimentId: input.id,
        organizationId,
      });

      const [created] = await ctx.db
        .insert(experiments)
        .values({
          id: randomUUID(),
          organizationId,
          createdBy: userId,
          name: `${source.name} (Copy)`,
          description: source.description,
          status: "draft",
          sensorConfig: source.sensorConfig,
        })
        .returning();

      return created;
    }),
});
