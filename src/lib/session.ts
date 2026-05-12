import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import type { DbUser } from "@/db/types";

const COOKIE_NAME = "auti_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function getCurrentUser(): Promise<DbUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return db().getSessionUser(token);
}

export async function requireUser(): Promise<DbUser> {
  const user = await getCurrentUser();
  if (!user) {
    // Session was lost (likely serverless instance switch with in-memory store).
    // Clear the stale cookie so middleware's next check works cleanly.
    const store = await cookies();
    store.delete(COOKIE_NAME);
    redirect("/prijava?reason=expired");
  }
  return user;
}

export async function createSessionCookie(userId: string) {
  const { token, expiresAt } = await db().createSession(userId, SESSION_TTL_SECONDS);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await db().deleteSession(token);
  store.delete(COOKIE_NAME);
}
