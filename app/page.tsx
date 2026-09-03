import CommunityHome from "./community-home";
import { adminJson } from "@/lib/supabase-data";
import { mergeSiteContent } from "@/lib/site-content";
import { isAdminEmail } from "@/lib/admin-auth";
import { ensureMember } from "@/lib/members";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    try {
      await ensureMember(user);
    } catch {
      // Membership tracking becomes available after its migration is applied.
    }
  }
  let content = mergeSiteContent([]);
  try {
    content = mergeSiteContent(await adminJson<{key:string;value:string}[]>("/rest/v1/site_content?select=key,value"));
  } catch {
    // The defaults keep the site available before the first CMS migration.
  }
  return (
    <CommunityHome
      user={user ? { displayName: user.displayName, email: user.email } : null}
      content={content}
      isAdmin={Boolean(user && isAdminEmail(user.email))}
    />
  );
}
