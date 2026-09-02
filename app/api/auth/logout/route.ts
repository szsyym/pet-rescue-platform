import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/supabase-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const expired = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 0 };
  response.cookies.set(ACCESS_COOKIE, "", expired);
  response.cookies.set(REFRESH_COOKIE, "", expired);
  return response;
}
