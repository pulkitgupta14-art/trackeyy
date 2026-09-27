import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

export async function auth(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  return session;
}

// For the NextAuth middleware
export { authOptions };