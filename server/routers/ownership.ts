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

export async function assertRunInOrganization(input: {
  db: (typeof import("@/server/db"))["db"];
  experimentId: string;
  runId: string;
  organizationId: string;
}) {
  await assertExperimentInOrganization({
    db: input.db,
    experimentId: input.experimentId,
    organizationId: input.organizationId,
  });

  const run = await input.db.query.runs.findFirst({
    where: (runRow, { and: andOperator, eq: eqOperator }) =>
      andOperator(
        eqOperator(runRow.id, input.runId),
        eqOperator(runRow.experimentId, input.experimentId),
      ),
  });

  if (!run) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  return run;
}
