export function isAdminEmail(email: string) {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}
