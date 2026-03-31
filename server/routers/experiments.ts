import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { experiments, users } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const createExperimentInput = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).nullish(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
});

const experimentIdInput = z.object({
  id: z.uuid(),
});

const updateExperimentInput = createExperimentInput.extend({
  id: z.uuid(),
});

async function getOrCreateDbUser(input: {
  db: (typeof import("@/server/db"))["db"];
  sessionUserId: string;
  email: string;
  name: string;
}): Promise<string> {
  const existingById = await input.db.query.users.findFirst({
    where: (user, { eq }) => eq(user.id, input.sessionUserId),
    columns: { id: true },
  });

  if (existingById) return existingById.id;

  const existingByEmail = await input.db.query.users.findFirst({
    where: (user, { eq }) => eq(user.email, input.email),
    columns: { id: true },
  });

  if (existingByEmail) return existingByEmail.id;

  await input.db.insert(users).values({
    id: input.sessionUserId,
    email: input.email,
    name: input.name,
    passwordHash: "__managed_by_nextauth__",
  });

  return input.sessionUserId;
}

export const experimentsRouter = createTRPCRouter({
  createExperiment: protectedProcedure
    .input(createExperimentInput)
    .mutation(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        sessionUserId: ctx.session.user.id,
        email: ctx.session.user.email ?? `${ctx.session.user.id}@local`,
        name: ctx.session.user.name ?? "Local User",
      });

      const [createdExperiment] = await ctx.db
        .insert(experiments)
        .values({
          id: randomUUID(),
          userId,
          name: input.name,
          description: input.description ?? null,
          status: input.status,
        })
        .returning();

      return createdExperiment;
    }),

  getExperiments: protectedProcedure.query(async ({ ctx }) => {
    const userId = await getOrCreateDbUser({
      db: ctx.db,
      sessionUserId: ctx.session.user.id,
      email: ctx.session.user.email ?? `${ctx.session.user.id}@local`,
      name: ctx.session.user.name ?? "Local User",
    });

    return ctx.db
      .select()
      .from(experiments)
      .where(eq(experiments.userId, userId))
      .orderBy(desc(experiments.createdAt));
  }),

  getExperimentById: protectedProcedure
    .input(experimentIdInput)
    .query(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        sessionUserId: ctx.session.user.id,
        email: ctx.session.user.email ?? `${ctx.session.user.id}@local`,
        name: ctx.session.user.name ?? "Local User",
      });

      const experiment = await ctx.db.query.experiments.findFirst({
        where: (experimentRow, { and, eq }) =>
          and(
            eq(experimentRow.id, input.id),
            eq(experimentRow.userId, userId),
          ),
      });

      if (!experiment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return experiment;
    }),

  updateExperiment: protectedProcedure
    .input(updateExperimentInput)
    .mutation(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        sessionUserId: ctx.session.user.id,
        email: ctx.session.user.email ?? `${ctx.session.user.id}@local`,
        name: ctx.session.user.name ?? "Local User",
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
          and(eq(experiments.id, input.id), eq(experiments.userId, userId)),
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
        sessionUserId: ctx.session.user.id,
        email: ctx.session.user.email ?? `${ctx.session.user.id}@local`,
        name: ctx.session.user.name ?? "Local User",
      });

      const [deletedExperiment] = await ctx.db
        .delete(experiments)
        .where(
          and(eq(experiments.id, input.id), eq(experiments.userId, userId)),
        )
        .returning({ id: experiments.id });

      if (!deletedExperiment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return { success: true };
    }),
});
