import { getCurrentUser } from "@/lib/current-user";
import { ensureMember } from "@/lib/members";
import { hasActiveSupabaseMembership } from "@/lib/supabase-auth";
import { adminJson, mapPost } from "@/lib/supabase-data";

export async function GET() {
  try { return Response.json({ posts: (await adminJson<Record<string, unknown>[]>("/rest/v1/community_posts?select=*&status=eq.published&order=created_at.desc&limit=30")).map(mapPost) }); }
  catch { return Response.json({ posts: [] }); }
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "请先登录后再发布" }, { status: 401 });
  if (!await hasActiveSupabaseMembership(user)) return Response.json({ error: "请先支付 398 元开通会员" }, { status: 403 });
  const member = await ensureMember(user); if (member.status === "suspended") return Response.json({ error: "账号已暂停，暂时无法发布" }, { status: 403 });
  const body = await request.json() as Record<string,string>;
  if (!body.title?.trim() || !body.content?.trim()) return Response.json({ error: "请填写标题和内容" }, { status: 400 });
  const rows = await adminJson<Record<string,unknown>[]>("/rest/v1/community_posts", { method:"POST", headers:{Prefer:"return=representation"}, body:JSON.stringify({author_id:user.id,author_name:user.displayName,title:body.title.trim().slice(0,80),content:body.content.trim().slice(0,800),image_url:body.imageUrl?.trim().slice(0,500)||null,category:body.category?.slice(0,20)||"救助日记"}) });
  return Response.json({ post: mapPost(rows[0]), moderation:"pending" }, { status:201 });
}
