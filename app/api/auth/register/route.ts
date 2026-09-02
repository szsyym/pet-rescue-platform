import { NextResponse } from "next/server";
import { getSupabaseConfig, setAuthCookies } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, string>;
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const displayName = body.displayName?.trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "密码至少需要 8 位" }, { status: 400 });
  if (!displayName || displayName.length > 40) return NextResponse.json({ error: "昵称需要 1–40 个字" }, { status: 400 });

  try {
    const { url, publishableKey } = getSupabaseConfig();
    const upstream = await fetch(`${url}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, data: { display_name: displayName } }),
    });
    const data = (await upstream.json()) as Record<string, unknown>;
    if (!upstream.ok) {
      const message = String(data.msg ?? data.message ?? "注册失败，请稍后再试");
      return NextResponse.json({ error: message.includes("already") ? "该邮箱已经注册，请直接登录" : message }, { status: upstream.status });
    }
    const response = NextResponse.json({
      success: true,
      confirmationRequired: !data.access_token,
      message: data.access_token ? "注册成功" : "验证邮件已发送，请完成验证后登录",
    });
    setAuthCookies(response, data);
    return response;
  } catch {
    return NextResponse.json({ error: "注册服务暂时不可用" }, { status: 503 });
  }
}
