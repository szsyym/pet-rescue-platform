import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { AppUser } from "@/lib/current-user";

export const ACCESS_COOKIE = "pet_access_token";
export const REFRESH_COOKIE = "pet_refresh_token";

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Supabase is not configured");
  return { url: url.replace(/\/$/, ""), publishableKey };
}

export async function getSupabaseAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}

export async function getSupabaseUser(): Promise<AppUser | null> {
  try {
    const token = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (!token) return null;
    const { url, publishableKey } = getSupabaseConfig();
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const user = (await response.json()) as SupabaseAuthUser;
    const email = user.email ?? "";
    const metadata = user.user_metadata ?? {};
    const displayName = String(metadata.display_name ?? metadata.full_name ?? email.split("@")[0] ?? "新会员");
    return { id: user.id, email, displayName, fullName: displayName, source: "supabase" };
  } catch {
    return null;
  }
}

export async function hasActiveSupabaseMembership(user: AppUser) {
  if (user.source !== "supabase") return true;
  const token = await getSupabaseAccessToken();
  if (!token) return false;
  const { url, publishableKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/member_accounts?select=status&user_id=eq.${user.id}&status=eq.active`, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) return false;
  const rows = await response.json() as { status: string }[];
  return rows.length === 1;
}

export function setAuthCookies(response: NextResponse, data: Record<string, unknown>) {
  const accessToken = typeof data.access_token === "string" ? data.access_token : "";
  const refreshToken = typeof data.refresh_token === "string" ? data.refresh_token : "";
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;
  const base = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };
  if (accessToken) response.cookies.set(ACCESS_COOKIE, accessToken, { ...base, maxAge: expiresIn });
  if (refreshToken) response.cookies.set(REFRESH_COOKIE, refreshToken, { ...base, maxAge: 60 * 60 * 24 * 30 });
}
