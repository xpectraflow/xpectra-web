import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { runs } from "@/server/db/schema";
import {
  assertExperimentOwnership,
  getOrCreateDbUser,
  userInfoFromSession,
} from "@/server/routers/ownership";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const runStatusSchema = z.enum(["queued", "running", "completed", "failed"]);

const runScopeInput = z.object({
  experimentId: z.uuid(),
});

const createRunInput = runScopeInput.extend({
  name: z.string().trim().min(2).max(120),
  status: runStatusSchema.default("queued"),
});

const runIdInput = runScopeInput.extend({
  id: z.uuid(),
});

const updateRunInput = runIdInput.extend({
  name: z.string().trim().min(2).max(120),
  status: runStatusSchema,
  startedAt: z.iso.datetime().nullish(),
  endedAt: z.iso.datetime().nullish(),
});

export const runsRouter = createTRPCRouter({
  createRun: protectedProcedure.input(createRunInput).mutation(async ({ ctx, input }) => {
    const userId = await getOrCreateDbUser({
      db: ctx.db,
      ...userInfoFromSession(ctx.session),
    });

    await assertExperimentOwnership({
      db: ctx.db,
      experimentId: input.experimentId,
      userId,
    });

    const [createdRun] = await ctx.db
      .insert(runs)
      .values({
        id: randomUUID(),
        experimentId: input.experimentId,
        name: input.name,
        status: input.status,
      })
      .returning();

    return createdRun;
  }),

  getRuns: protectedProcedure.input(runScopeInput).query(async ({ ctx, input }) => {
    const userId = await getOrCreateDbUser({
      db: ctx.db,
      ...userInfoFromSession(ctx.session),
    });

    await assertExperimentOwnership({
      db: ctx.db,
      experimentId: input.experimentId,
      userId,
    });

    return ctx.db
      .select()
      .from(runs)
      .where(eq(runs.experimentId, input.experimentId))
      .orderBy(desc(runs.createdAt));
  }),

  getRunById: protectedProcedure.input(runIdInput).query(async ({ ctx, input }) => {
    const userId = await getOrCreateDbUser({
      db: ctx.db,
      ...userInfoFromSession(ctx.session),
    });

    await assertExperimentOwnership({
      db: ctx.db,
      experimentId: input.experimentId,
      userId,
    });

    const run = await ctx.db.query.runs.findFirst({
      where: (runRow, { and: andOperator, eq: eqOperator }) =>
        andOperator(
          eqOperator(runRow.id, input.id),
          eqOperator(runRow.experimentId, input.experimentId),
        ),
    });

    if (!run) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return run;
  }),

  updateRun: protectedProcedure.input(updateRunInput).mutation(async ({ ctx, input }) => {
    const userId = await getOrCreateDbUser({
      db: ctx.db,
      ...userInfoFromSession(ctx.session),
    });

    await assertExperimentOwnership({
      db: ctx.db,
      experimentId: input.experimentId,
      userId,
    });

    const [updatedRun] = await ctx.db
      .update(runs)
      .set({
        name: input.name,
        status: input.status,
        startedAt: input.startedAt ? new Date(input.startedAt) : null,
        endedAt: input.endedAt ? new Date(input.endedAt) : null,
      })
      .where(and(eq(runs.id, input.id), eq(runs.experimentId, input.experimentId)))
      .returning();

    if (!updatedRun) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return updatedRun;
  }),

  deleteRun: protectedProcedure.input(runIdInput).mutation(async ({ ctx, input }) => {
    const userId = await getOrCreateDbUser({
      db: ctx.db,
      ...userInfoFromSession(ctx.session),
    });

    await assertExperimentOwnership({
      db: ctx.db,
      experimentId: input.experimentId,
      userId,
    });

    const [deletedRun] = await ctx.db
      .delete(runs)
      .where(and(eq(runs.id, input.id), eq(runs.experimentId, input.experimentId)))
      .returning({ id: runs.id });

    if (!deletedRun) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return { success: true };
  }),
});
