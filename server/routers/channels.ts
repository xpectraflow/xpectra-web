import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { channels } from "@/server/db/schema";
import {
  assertDatasetInOrganization,
  getOrCreateDbUser,
  getPrimaryOrganizationIdForUser,
  userInfoFromSession,
} from "@/server/routers/ownership";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const channelScopeInput = z.object({
  experimentId: z.uuid(),
  datasetId: z.uuid(),
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

      const [createdChannel] = await ctx.db
        .insert(channels)
        .values({
          id: randomUUID(),
          datasetId: input.datasetId,
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

      return ctx.db
        .select()
        .from(channels)
        .where(eq(channels.datasetId, input.datasetId))
        .orderBy(asc(channels.name));
    }),

  updateChannel: protectedProcedure
    .input(updateChannelInput)
    .mutation(async ({ ctx, input }) => {
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

      const [updatedChannel] = await ctx.db
        .update(channels)
        .set({
          name: input.name,
          unit: input.unit ?? null,
          dataType: input.dataType,
        })
        .where(and(eq(channels.id, input.id), eq(channels.datasetId, input.datasetId)))
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

      const [deletedChannel] = await ctx.db
        .delete(channels)
        .where(and(eq(channels.id, input.id), eq(channels.datasetId, input.datasetId)))
        .returning({ id: channels.id });

      if (!deletedChannel) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return { success: true };
    }),
});
