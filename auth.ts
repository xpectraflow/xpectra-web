import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export function auth() {
  return getServerSession(authOptions);
}
