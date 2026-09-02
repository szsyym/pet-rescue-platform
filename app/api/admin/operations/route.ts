import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { activities, members, posts } from "@/db/schema";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isAdminEmail } from "@/lib/admin-auth";

async function requireAdmin() {
  const user = await getChatGPTUser();
  return user && isAdminEmail(user.email) ? user : null;
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "无权执行此操作" }, { status: 403 });
  const body = await request.json() as { resource?: string; id?: string | number; status?: string };
  const db = getDb();

  if (body.resource === "post" && typeof body.id === "number" && ["published", "hidden", "pending"].includes(body.status ?? "")) {
    await db.update(posts).set({ status: body.status! }).where(eq(posts.id, body.id));
  } else if (body.resource === "activity" && typeof body.id === "number" && ["published", "hidden", "pending"].includes(body.status ?? "")) {
    await db.update(activities).set({ status: body.status! }).where(eq(activities.id, body.id));
  } else if (body.resource === "member" && typeof body.id === "string" && ["active", "suspended"].includes(body.status ?? "")) {
    const [member] = await db.select().from(members).where(eq(members.id, body.id)).limit(1);
    if (!member) return Response.json({ error: "会员不存在" }, { status: 404 });
    if (isAdminEmail(member.email) && body.status === "suspended") {
      return Response.json({ error: "不能暂停管理员账号" }, { status: 400 });
    }
    await db.update(members).set({ status: body.status! }).where(eq(members.id, body.id));
  } else {
    return Response.json({ error: "操作参数无效" }, { status: 400 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "无权执行此操作" }, { status: 403 });
  const body = await request.json() as { resource?: string; id?: number };
  const db = getDb();
  if (body.resource === "post" && typeof body.id === "number") {
    await db.delete(posts).where(eq(posts.id, body.id));
  } else if (body.resource === "activity" && typeof body.id === "number") {
    await db.delete(activities).where(eq(activities.id, body.id));
  } else {
    return Response.json({ error: "删除参数无效" }, { status: 400 });
  }
  return Response.json({ ok: true });
}
