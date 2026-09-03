import type { AppUser } from "@/lib/current-user";
import { adminJson, mapMember } from "@/lib/supabase-data";

export async function ensureMember(user: AppUser) {
  const rows = await adminJson<Record<string, unknown>[]>("/rest/v1/community_members?on_conflict=user_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
    user_id: user.id,
    email: user.email,
    display_name: user.displayName,
    last_seen_at: new Date().toISOString(),
    }),
  });
  return mapMember(rows[0]);
}
