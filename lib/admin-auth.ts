import { env } from "cloudflare:workers";

export function isAdminEmail(email: string) {
  const raw = (env as unknown as Record<string, string | undefined>).ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}
