import { TRPCError } from "@trpc/server";
import { users } from "@/server/db/schema";

export async function getOrCreateDbUser(input: {
  db: (typeof import("@/server/db"))["db"];
  sessionUserId: string;
  email: string;
  name: string;
}): Promise<string> {
  const existingById = await input.db.query.users.findFirst({
    where: (user, { eq: eqOperator }) => eqOperator(user.id, input.sessionUserId),
    columns: { id: true },
  });

  if (existingById) return existingById.id;

  const existingByEmail = await input.db.query.users.findFirst({
    where: (user, { eq: eqOperator }) => eqOperator(user.email, input.email),
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

export function userInfoFromSession(session: {
  user: { id: string; email?: string | null; name?: string | null };
}) {
  return {
    sessionUserId: session.user.id,
    email: session.user.email ?? `${session.user.id}@local`,
    name: session.user.name ?? "Local User",
  };
}

export async function getPrimaryOrganizationIdForUser(input: {
  db: (typeof import("@/server/db"))["db"];
  userId: string;
}) {
  const user = await input.db.query.users.findFirst({
    where: (userRow, { eq: eqOperator }) => eqOperator(userRow.id, input.userId),
    columns: { organisationId: true },
  });

  if (!user || !user.organisationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No organization found for the current user.",
    });
  }

  return user.organisationId;
}

export async function assertExperimentInOrganization(input: {
  db: (typeof import("@/server/db"))["db"];
  experimentId: string;
  organizationId: string;
}) {
  const experiment = await input.db.query.experiments.findFirst({
    where: (experimentRow, { and: andOperator, eq: eqOperator }) =>
      andOperator(
        eqOperator(experimentRow.id, input.experimentId),
        eqOperator(experimentRow.organizationId, input.organizationId),
      ),
  });

  if (!experiment) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  return experiment;
}

export async function assertDatasetInOrganization(input: {
  db: (typeof import("@/server/db"))["db"];
  experimentId: string;
  datasetId: string;
  organizationId: string;
}) {
  await assertExperimentInOrganization({
    db: input.db,
    experimentId: input.experimentId,
    organizationId: input.organizationId,
  });

  const dataset = await input.db.query.datasets.findFirst({
    where: (datasetRow, { and: andOperator, eq: eqOperator }) =>
      andOperator(
        eqOperator(datasetRow.id, input.datasetId),
        eqOperator(datasetRow.experimentId, input.experimentId),
      ),
  });

  if (!dataset) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  return dataset;
}
