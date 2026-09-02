import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ensureMember } from "@/lib/members";

export async function GET() {
  try {
    const rows = await getDb().select().from(posts).where(eq(posts.status, "published")).orderBy(desc(posts.createdAt), desc(posts.id)).limit(30);
    return Response.json({ posts: rows });
  } catch {
    return Response.json({ posts: [] });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录后再发布" }, { status: 401 });
  const member = await ensureMember(user);
  if (member.status === "suspended") return Response.json({ error: "账号已暂停，暂时无法发布" }, { status: 403 });
  const body = await request.json() as Record<string, string>;
  const title = body.title?.trim();
  const content = body.content?.trim();
  if (!title || !content) return Response.json({ error: "请填写标题和内容" }, { status: 400 });

  const [post] = await getDb().insert(posts).values({
    authorId: user.id,
    authorName: user.displayName,
    title: title.slice(0, 80),
    content: content.slice(0, 800),
    imageUrl: body.imageUrl?.trim()?.slice(0, 500) || null,
    category: body.category?.slice(0, 20) || "救助日记",
  }).returning();
  return Response.json({ post, moderation: "pending" }, { status: 201 });
}
