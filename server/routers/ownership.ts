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

export async function assertExperimentOwnership(input: {
  db: (typeof import("@/server/db"))["db"];
  experimentId: string;
  userId: string;
}) {
  const experiment = await input.db.query.experiments.findFirst({
    where: (experimentRow, { and: andOperator, eq: eqOperator }) =>
      andOperator(
        eqOperator(experimentRow.id, input.experimentId),
        eqOperator(experimentRow.userId, input.userId),
      ),
  });

  if (!experiment) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  return experiment;
}

export async function assertRunOwnership(input: {
  db: (typeof import("@/server/db"))["db"];
  experimentId: string;
  runId: string;
  userId: string;
}) {
  await assertExperimentOwnership({
    db: input.db,
    experimentId: input.experimentId,
    userId: input.userId,
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

export function userInfoFromSession(session: {
  user: { id: string; email?: string | null; name?: string | null };
}) {
  return {
    sessionUserId: session.user.id,
    email: session.user.email ?? `${session.user.id}@local`,
    name: session.user.name ?? "Local User",
  };
}
