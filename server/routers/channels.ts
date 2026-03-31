import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { channels } from "@/server/db/schema";
import {
  assertRunOwnership,
  getOrCreateDbUser,
  userInfoFromSession,
} from "@/server/routers/ownership";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const channelScopeInput = z.object({
  experimentId: z.uuid(),
  runId: z.uuid(),
});

const createChannelInput = channelScopeInput.extend({
  name: z.string().trim().min(2).max(120),
  unit: z.string().trim().max(40).nullish(),
  dataType: z.enum(["float", "int", "string", "bool"]).default("float"),
});

const channelIdInput = channelScopeInput.extend({
  id: z.uuid(),
});

const updateChannelInput = channelIdInput.extend({
  name: z.string().trim().min(2).max(120),
  unit: z.string().trim().max(40).nullish(),
  dataType: z.enum(["float", "int", "string", "bool"]),
});

export const channelsRouter = createTRPCRouter({
  createChannel: protectedProcedure
    .input(createChannelInput)
    .mutation(async ({ ctx, input }) => {
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

      const [createdChannel] = await ctx.db
        .insert(channels)
        .values({
          id: randomUUID(),
          runId: input.runId,
          name: input.name,
          unit: input.unit ?? null,
          dataType: input.dataType,
        })
        .returning();

      return createdChannel;
    }),

  getChannels: protectedProcedure
    .input(channelScopeInput)
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

      return ctx.db
        .select()
        .from(channels)
        .where(eq(channels.runId, input.runId))
        .orderBy(asc(channels.name));
    }),

  updateChannel: protectedProcedure
    .input(updateChannelInput)
    .mutation(async ({ ctx, input }) => {
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

      const [updatedChannel] = await ctx.db
        .update(channels)
        .set({
          name: input.name,
          unit: input.unit ?? null,
          dataType: input.dataType,
        })
        .where(and(eq(channels.id, input.id), eq(channels.runId, input.runId)))
        .returning();

      if (!updatedChannel) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updatedChannel;
    }),

  deleteChannel: protectedProcedure
    .input(channelIdInput)
    .mutation(async ({ ctx, input }) => {
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

      const [deletedChannel] = await ctx.db
        .delete(channels)
        .where(and(eq(channels.id, input.id), eq(channels.runId, input.runId)))
        .returning({ id: channels.id });

      if (!deletedChannel) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return { success: true };
    }),
});
