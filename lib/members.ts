import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { members } from "@/db/schema";
import type { AppUser } from "@/lib/current-user";

export async function ensureMember(user: AppUser) {
  const db = getDb();
  await db.insert(members).values({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  }).onConflictDoUpdate({
    target: members.id,
    set: {
      email: user.email,
      displayName: user.displayName,
      lastSeenAt: sql`CURRENT_TIMESTAMP`,
    },
  });
  const [member] = await db.select().from(members).where(eq(members.id, user.id)).limit(1);
  return member;
}
