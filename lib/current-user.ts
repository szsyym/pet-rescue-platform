import { getSupabaseUser } from "@/lib/supabase-auth";

export type AppUser = {
  id: string;
  displayName: string;
  email: string;
  fullName: string | null;
  source: "chatgpt" | "supabase";
};

export async function getCurrentUser(): Promise<AppUser | null> {
  return getSupabaseUser();
}
