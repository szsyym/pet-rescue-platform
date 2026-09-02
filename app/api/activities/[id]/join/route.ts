import { and, count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { activities, activityMembers } from "@/db/schema";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ensureMember } from "@/lib/members";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录后再报名" }, { status: 401 });
  const member = await ensureMember(user);
  if (member.status === "suspended") return Response.json({ error: "账号已暂停，暂时无法报名" }, { status: 403 });
  const { id } = await context.params;
  const activityId = Number(id);
  if (!Number.isInteger(activityId)) return Response.json({ error: "活动不存在" }, { status: 404 });

  const db = getDb();
  const [activity] = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
  if (!activity) return Response.json({ error: "活动不存在" }, { status: 404 });
  if (activity.status !== "published") return Response.json({ error: "活动尚未开放报名" }, { status: 400 });
  const [existing] = await db.select().from(activityMembers).where(and(eq(activityMembers.activityId, activityId), eq(activityMembers.userId, user.id))).limit(1);
  if (!existing) await db.insert(activityMembers).values({ activityId, userId: user.id });
  const [{ value }] = await db.select({ value: count() }).from(activityMembers).where(eq(activityMembers.activityId, activityId));
  return Response.json({ memberCount: value });
}
