import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { siteContent } from "@/db/schema";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { isKnownContentKey } from "@/lib/site-content";

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user || !isAdminEmail(user.email)) {
    return Response.json({ error: "无权访问后台" }, { status: 403 });
  }

  const body = await request.json() as { values?: Record<string, unknown> };
  const entries = Object.entries(body.values ?? {})
    .filter(([key, value]) => isKnownContentKey(key) && typeof value === "string")
    .map(([key, value]) => ({ key, value: (value as string).slice(0, 2000) }));

  if (!entries.length) return Response.json({ error: "没有可保存的内容" }, { status: 400 });
  const db = getDb();
  await db.batch(entries.map(({ key, value }) =>
    db.insert(siteContent).values({
      key,
      value,
      updatedBy: user.email,
    }).onConflictDoUpdate({
      target: siteContent.key,
      set: { value, updatedBy: user.email, updatedAt: sql`CURRENT_TIMESTAMP` },
    })
  ));

  return Response.json({ saved: entries.length });
}
