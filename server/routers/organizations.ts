import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { organizations, users } from "@/server/db/schema";
import { getOrCreateDbUser, userInfoFromSession } from "@/server/routers/ownership";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/server/s3";

function slugify(name: string) {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40);

  const randomPart = randomUUID().replace(/-/g, "").slice(0, 5);

  return `${normalized || "org"}-${randomPart}`;
}

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
      columns: { organisationId: true },
    });

    if (!userRow?.organisationId) {
      return [];
    }

    const organization = await ctx.db.query.organizations.findFirst({
      where: (organizationRow, { eq: eqOperator }) =>
        eqOperator(organizationRow.id, userRow.organisationId),
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

      const existingUser = await ctx.db.query.users.findFirst({
        where: (row, { eq }) => eq(row.id, userId),
        columns: { organisationId: true },
      });

      if (existingUser?.organisationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are already attached to an organization.",
        });
      }

      const organizationId = randomUUID();

      const slug = slugify(input.name);

      const [createdOrganization] = await ctx.db
        .insert(organizations)
        .values({
          id: organizationId,
          name: input.name,
          type: input.type,
          slug,
        })
        .returning();

      await ctx.db
        .update(users)
        .set({
          organisationId: organizationId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: slug }));
      } catch (e: any) {
        if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
          await s3Client.send(new CreateBucketCommand({ Bucket: slug }));
        }
      }

      return createdOrganization;
    }),
});
