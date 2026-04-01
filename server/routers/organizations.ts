import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { organizations, users } from "@/server/db/schema";
import { getOrCreateDbUser, userInfoFromSession } from "@/server/routers/ownership";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const createOrganizationInput = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(["personal", "startup", "educational", "company"]),
});

export const organizationsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = await getOrCreateDbUser({
      db: ctx.db,
      ...userInfoFromSession(ctx.session),
    });

    const userRow = await ctx.db.query.users.findFirst({
      where: (userRow, { eq: eqOperator }) =>
        eqOperator(userRow.id, userId),
      columns: { primaryOrganizationId: true },
    });

    if (!userRow?.primaryOrganizationId) {
      return [];
    }

    const organization = await ctx.db.query.organizations.findFirst({
      where: (organizationRow, { eq: eqOperator }) =>
        eqOperator(organizationRow.id, userRow.primaryOrganizationId),
      columns: {
        id: true,
        name: true,
        type: true,
      },
    });

    return organization ? [organization] : [];
  }),

  create: protectedProcedure
    .input(createOrganizationInput)
    .mutation(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        ...userInfoFromSession(ctx.session),
      });

      const organizationId = randomUUID();

      const [createdOrganization] = await ctx.db
        .insert(organizations)
        .values({
          id: organizationId,
          name: input.name,
          type: input.type,
        })
        .returning();

      await ctx.db
        .update(users)
        .set({
          primaryOrganizationId: organizationId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return createdOrganization;
    }),
});
