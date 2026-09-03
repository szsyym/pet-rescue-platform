import { getSupabaseConfig } from "@/lib/supabase-auth";

export async function supabaseAdmin(path: string, init: RequestInit = {}) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  const { url } = getSupabaseConfig();
  return fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: secret, Authorization: `Bearer ${secret}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
}

export async function adminJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await supabaseAdmin(path, init);
  if (!response.ok) throw new Error(await response.text());
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

export function mapPost(row: Record<string, unknown>) {
  return { id: Number(row.id), authorId: String(row.author_id), authorName: String(row.author_name), title: String(row.title), content: String(row.content), imageUrl: row.image_url ? String(row.image_url) : null, category: String(row.category), status: String(row.status), createdAt: String(row.created_at) };
}

export function mapActivity(row: Record<string, unknown>) {
  return { id: Number(row.id), organizerId: String(row.organizer_id), organizerName: String(row.organizer_name), title: String(row.title), description: String(row.description), location: String(row.location), eventDate: String(row.event_date), capacity: Number(row.capacity), status: String(row.status), createdAt: String(row.created_at), memberCount: Number(row.member_count ?? 0) };
}

export function mapMember(row: Record<string, unknown>) {
  return { id: String(row.user_id), email: String(row.email), displayName: String(row.display_name), status: String(row.status), joinedAt: String(row.joined_at), lastSeenAt: String(row.last_seen_at) };
}
