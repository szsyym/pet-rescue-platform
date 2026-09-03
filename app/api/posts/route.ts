import { getCurrentUser } from "@/lib/current-user";
import { ensureMember } from "@/lib/members";
import { hasActiveSupabaseMembership } from "@/lib/supabase-auth";
import { adminJson, mapPost } from "@/lib/supabase-data";

export async function GET() {
  try {
    const rows = await adminJson<Record<string, unknown>[]>("/rest/v1/community_posts?select=*&status=eq.published&order=created_at.desc&limit=30");
    const posts = rows.map(mapPost);
    if (posts.length) {
      const ids = posts.map((post) => post.id).join(",");
      const images = await adminJson<Record<string, unknown>[]>(`/rest/v1/community_post_images?select=post_id,image_url,sort_order&id=not.is.null&post_id=in.(${ids})&order=sort_order.asc,id.asc`);
      const grouped = new Map<number, string[]>();
      images.forEach((image) => grouped.set(Number(image.post_id), [...(grouped.get(Number(image.post_id)) ?? []), String(image.image_url)]));
      posts.forEach((post) => { post.imageUrls = grouped.get(post.id) ?? (post.imageUrl ? [post.imageUrl] : []); });
    }
    return Response.json({ posts });
  }
  catch { return Response.json({ posts: [] }); }
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "请先登录后再发布" }, { status: 401 });
  if (!await hasActiveSupabaseMembership(user)) return Response.json({ error: "请先支付 398 元开通会员" }, { status: 403 });
  const member = await ensureMember(user); if (member.status === "suspended") return Response.json({ error: "账号已暂停，暂时无法发布" }, { status: 403 });
  const body = await request.json() as Record<string,unknown>;
  const title = String(body.title ?? "").trim(); const content = String(body.content ?? "").trim();
  if (!title || !content) return Response.json({ error: "请填写标题和内容" }, { status: 400 });
  const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.map(String).filter((url) => url.startsWith("/media/")).map((url) => url.slice(0,500)) : [];
  const fontSize = ["sm","base","lg","xl"].includes(String(body.fontSize)) ? String(body.fontSize) : "base";
  const lineHeight = ["compact","normal","relaxed","loose"].includes(String(body.lineHeight)) ? String(body.lineHeight) : "normal";
  const textColor = /^#[0-9a-fA-F]{6}$/.test(String(body.textColor)) ? String(body.textColor) : "#61777d";
  const rows = await adminJson<Record<string,unknown>[]>("/rest/v1/community_posts", { method:"POST", headers:{Prefer:"return=representation"}, body:JSON.stringify({author_id:user.id,author_name:user.displayName,title:title.slice(0,80),content:content.slice(0,6000),image_url:imageUrls[0] ?? null,category:String(body.category ?? "救助日记").slice(0,20),font_size:fontSize,line_height:lineHeight,text_color:textColor}) });
  if (imageUrls.length) await adminJson("/rest/v1/community_post_images", { method:"POST", headers:{Prefer:"return=minimal"}, body:JSON.stringify(imageUrls.map((image_url,sort_order) => ({post_id:Number(rows[0].id),image_url,sort_order}))) });
  const post = mapPost(rows[0]); post.imageUrls = imageUrls;
  return Response.json({ post, moderation:"pending" }, { status:201 });
}
