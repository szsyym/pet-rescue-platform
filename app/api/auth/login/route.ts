import { NextResponse } from "next/server";
import { getSupabaseConfig, setAuthCookies } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, string>;
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
  try {
    const { url, publishableKey } = getSupabaseConfig();
    const upstream = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await upstream.json()) as Record<string, unknown>;
    if (!upstream.ok) {
      const message = String(data.msg ?? data.message ?? "登录失败");
      return NextResponse.json({ error: message.includes("confirm") ? "请先打开邮箱完成验证" : "邮箱或密码不正确" }, { status: 401 });
    }
    const response = NextResponse.json({ success: true });
    setAuthCookies(response, data);
    return response;
  } catch {
    return NextResponse.json({ error: "登录服务暂时不可用" }, { status: 503 });
  }
}
