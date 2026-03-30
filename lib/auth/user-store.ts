import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const USERS_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(USERS_DIR, "users.json");

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

async function readUsers(): Promise<StoredUser[]> {
  try {
    const file = await readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(file) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeUsers(users: StoredUser[]): Promise<void> {
  await mkdir(USERS_DIR, { recursive: true });
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export async function findUserByEmail(
  email: string,
): Promise<StoredUser | null> {
  const users = await readUsers();
  return users.find((user) => user.email === email) ?? null;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<StoredUser> {
  const users = await readUsers();

  if (users.some((user) => user.email === input.email)) {
    throw new Error("EMAIL_EXISTS");
  }

  const newUser: StoredUser = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await writeUsers(users);

  return newUser;
}
