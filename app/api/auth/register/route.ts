import { NextResponse } from "next/server";
import { getSupabaseConfig, setAuthCookies } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, string>;
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const displayName = body.displayName?.trim();
  const rawPhone = (body.phone ?? "").replace(/[\s()-]/g, "");
  const phone = rawPhone.startsWith("+") ? rawPhone : /^1\d{10}$/.test(rawPhone) ? `+86${rawPhone}` : "";
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "密码至少需要 8 位" }, { status: 400 });
  if (!displayName || displayName.length > 40) return NextResponse.json({ error: "昵称需要 1–40 个字" }, { status: 400 });
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return NextResponse.json({ error: "请输入有效手机号，中国大陆手机号可直接输入 11 位" }, { status: 400 });

  try {
    const { url, publishableKey } = getSupabaseConfig();
    const upstream = await fetch(`${url}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, data: { display_name: displayName, phone_e164: phone } }),
    });
    const data = (await upstream.json()) as Record<string, unknown>;
    if (!upstream.ok) {
      const message = String(data.msg ?? data.message ?? "注册失败，请稍后再试");
      const friendly = message.includes("phone_permanently_blocked")
        ? "该手机号对应的会员曾退款注销，无法再次注册"
        : message.includes("phone_already_registered")
          ? "该手机号已经注册"
          : message.includes("already") ? "该邮箱已经注册，请直接登录" : message;
      return NextResponse.json({ error: friendly }, { status: upstream.status });
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
