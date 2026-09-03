import { getCurrentUser } from "@/lib/current-user";
import { isAdminEmail } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-data";

const types: Record<string,string> = {"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif","video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov"};
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) return Response.json({error:"仅管理员可上传首页媒体"},{status:403});
  const form = await request.formData(); const file = form.get("file");
  if (!(file instanceof File)) return Response.json({error:"请选择文件"},{status:400});
  const ext = types[file.type]; if (!ext) return Response.json({error:"仅支持常见图片、MP4、WebM 或 MOV"},{status:400});
  if (file.size > 4 * 1024 * 1024) return Response.json({error:"单个文件不能超过 4MB；较大视频请填写外部播放链接"},{status:400});
  const key = `${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${ext}`;
  const response = await supabaseAdmin(`/storage/v1/object/site-media/${key}`,{method:"POST",headers:{"Content-Type":file.type,"x-upsert":"false"},body:await file.arrayBuffer()});
  if (!response.ok) return Response.json({error:"媒体上传失败"},{status:502});
  return Response.json({url:`/media/site/${key}`,mediaType:file.type.startsWith("video/")?"video":"image"},{status:201});
}
