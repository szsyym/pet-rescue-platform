import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { activities, activityMembers } from "@/db/schema";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ensureMember } from "@/lib/members";

export async function GET() {
  try {
    const rows = await getDb()
      .select({
        id: activities.id,
        organizerName: activities.organizerName,
        title: activities.title,
        description: activities.description,
        location: activities.location,
        eventDate: activities.eventDate,
        capacity: activities.capacity,
        memberCount: sql<number>`count(${activityMembers.id})`,
      })
      .from(activities)
      .leftJoin(activityMembers, sql`${activityMembers.activityId} = ${activities.id}`)
      .where(eq(activities.status, "published"))
      .groupBy(activities.id)
      .orderBy(asc(activities.eventDate))
      .limit(20);
    return Response.json({ activities: rows });
  } catch {
    return Response.json({ activities: [] });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录后再发起活动" }, { status: 401 });
  const member = await ensureMember(user);
  if (member.status === "suspended") return Response.json({ error: "账号已暂停，暂时无法发起活动" }, { status: 403 });
  const body = await request.json() as Record<string, string>;
  const title = body.title?.trim();
  const description = body.description?.trim();
  const location = body.location?.trim();
  const eventDate = body.eventDate?.trim();
  const capacity = Number(body.capacity);
  if (!title || !description || !location || !eventDate) {
    return Response.json({ error: "请完整填写活动信息" }, { status: 400 });
  }
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 500) {
    return Response.json({ error: "人数应在 2–500 之间" }, { status: 400 });
  }

  const [activity] = await getDb().insert(activities).values({
    organizerId: user.id,
    organizerName: user.displayName,
    title: title.slice(0, 80),
    description: description.slice(0, 500),
    location: location.slice(0, 100),
    eventDate,
    capacity,
  }).returning();
  return Response.json({ activity: { ...activity, memberCount: 0 }, moderation: "pending" }, { status: 201 });
}
