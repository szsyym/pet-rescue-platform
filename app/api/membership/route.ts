import { getSupabaseAccessToken, getSupabaseConfig, getSupabaseUser } from "@/lib/supabase-auth";

async function supabase(path: string, init: RequestInit = {}) {
  const token = await getSupabaseAccessToken();
  if (!token) return null;
  const { url, publishableKey } = getSupabaseConfig();
  return fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: publishableKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
}

export async function GET() {
  const user = await getSupabaseUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const response = await supabase(`/rest/v1/member_accounts?select=status,fee_cents,currency,phone_last4,paid_at,refund_requested_at,refunded_at&user_id=eq.${user.id}`);
  if (!response?.ok) return Response.json({ error: "会员信息暂时不可用" }, { status: 503 });
  const rows = await response.json() as Record<string, unknown>[];
  return Response.json({ membership: rows[0] ?? null, paymentConfigured: false });
}

export async function POST(request: Request) {
  const user = await getSupabaseUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const body = await request.json() as { action?: string; acceptedTerms?: boolean };
  if (body.action === "create_order") {
    if (!body.acceptedTerms) return Response.json({ error: "请先确认会员费及退款注销规则" }, { status: 400 });
    const response = await supabase("/rest/v1/rpc/create_membership_order", { method: "POST", body: "{}" });
    if (!response?.ok) return Response.json({ error: "订单创建失败，请稍后重试" }, { status: 400 });
    return Response.json({ success: true, orderId: await response.json(), paymentConfigured: false, message: "订单已创建，支付渠道接入后即可完成付款" });
  }
  if (body.action === "request_refund") {
    const response = await supabase("/rest/v1/rpc/request_membership_refund", { method: "POST", body: "{}" });
    if (!response?.ok) return Response.json({ error: "仅已支付的有效会员可以申请退款" }, { status: 400 });
    return Response.json({ success: true, message: "退款申请已提交" });
  }
  return Response.json({ error: "无效操作" }, { status: 400 });
}
