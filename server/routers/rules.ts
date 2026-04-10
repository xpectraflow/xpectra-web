import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, or, isNull } from "drizzle-orm";
import { z } from "zod";
import { rules } from "@/server/db/schema";
import {
  getOrCreateDbUser,
  getPrimaryOrganizationIdForUser,
  userInfoFromSession,
} from "@/server/routers/ownership";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const ruleTypeEnum = z.enum(["THRESHOLD", "STATISTICAL", "AVAILABILITY"]);

const createRuleInput = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).nullish(),
  type: ruleTypeEnum,
  config: z.record(z.unknown()).default({}),
});

const ruleIdInput = z.object({
  id: z.uuid(),
});

export const rulesRouter = createTRPCRouter({
  createRule: protectedProcedure
    .input(createRuleInput)
    .mutation(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        ...userInfoFromSession(ctx.session),
      });

      const organizationId = await getPrimaryOrganizationIdForUser({
        db: ctx.db,
        userId,
      });

      const [createdRule] = await ctx.db
        .insert(rules)
        .values({
          id: randomUUID(),
          organizationId,
          name: input.name,
          description: input.description ?? null,
          type: input.type,
          config: input.config,
          isManaged: false,
        })
        .returning();

      return createdRule;
    }),

  getRules: protectedProcedure.query(async ({ ctx }) => {
    const userId = await getOrCreateDbUser({
      db: ctx.db,
      ...userInfoFromSession(ctx.session),
    });

    const organizationId = await getPrimaryOrganizationIdForUser({
      db: ctx.db,
      userId,
    });

    // Fetch managed rules OR rules belonging to the user's organization
    return ctx.db
      .select()
      .from(rules)
      .where(
        or(
          eq(rules.organizationId, organizationId),
          isNull(rules.organizationId)
        )
      )
      .orderBy(desc(rules.createdAt));
  }),

  deleteRule: protectedProcedure
    .input(ruleIdInput)
    .mutation(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        ...userInfoFromSession(ctx.session),
      });

      const organizationId = await getPrimaryOrganizationIdForUser({
        db: ctx.db,
        userId,
      });

      // Ensure the rule exists, belongs to the org, and is NOT a managed rule
      const [deletedRule] = await ctx.db
        .delete(rules)
        .where(
          and(
            eq(rules.id, input.id),
            eq(rules.organizationId, organizationId),
            eq(rules.isManaged, false)
          )
        )
        .returning({ id: rules.id });

      if (!deletedRule) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete this rule (either it does not exist or it is a managed template).",
        });
      }

      return { success: true };
    }),
});
