import { randomUUID } from "crypto";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  organisationId?: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapUserRow(row: typeof users.$inferSelect): StoredUser {
  const createdAtValue = row.createdAt;
  const createdAt =
    createdAtValue instanceof Date
      ? createdAtValue.toISOString()
      : String(createdAtValue);
  const updatedAtValue = row.updatedAt;
  const updatedAt =
    updatedAtValue instanceof Date
      ? updatedAtValue.toISOString()
      : String(updatedAtValue);

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    organisationId: row.organisationId ?? null,
    createdAt,
    updatedAt,
  };
}

function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  );
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const row = await db.query.users.findFirst({
    where: (userRow, { eq: eqOperator }) => eqOperator(userRow.email, email),
  });

  return row ? mapUserRow(row) : null;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<StoredUser> {
  const newUserId = randomUUID();

  try {
    const [insertedRow] = await db
      .insert(users)
      .values({
        id: newUserId,
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
      })
      .returning();

    if (!insertedRow) {
      throw new Error("USER_INSERT_RETURNED_NO_ROW");
    }

    return mapUserRow(insertedRow);
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      throw new Error("EMAIL_EXISTS");
    }
    throw error;
  }
}
