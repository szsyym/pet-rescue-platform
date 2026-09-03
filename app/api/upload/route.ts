import { env } from "cloudflare:workers";
import { getCurrentUser } from "@/lib/current-user";
import { ensureMember } from "@/lib/members";
import { hasActiveSupabaseMembership } from "@/lib/supabase-auth";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "请先登录后再上传图片" }, { status: 401 });
  if (!await hasActiveSupabaseMembership(user)) return Response.json({ error: "请先支付 398 元开通会员" }, { status: 403 });
  const member = await ensureMember(user);
  if (member.status === "suspended") {
    return Response.json({ error: "账号已暂停，暂时无法上传" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "请选择图片" }, { status: 400 });
  const extension = allowedTypes[file.type];
  if (!extension) return Response.json({ error: "仅支持 JPG、PNG、WebP 或 GIF 图片" }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return Response.json({ error: "图片不能超过 8MB" }, { status: 400 });

  const key = `images/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { uploadedBy: user.id },
  });
  return Response.json({ url: `/media/${key}` }, { status: 201 });
}
