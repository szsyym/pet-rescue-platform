import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";
import CommunityHome from "./community-home";
import { getDb } from "@/db";
import { siteContent } from "@/db/schema";
import { mergeSiteContent } from "@/lib/site-content";
import { isAdminEmail } from "@/lib/admin-auth";
import { ensureMember } from "@/lib/members";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  if (user) {
    try {
      await ensureMember(user);
    } catch {
      // Membership tracking becomes available after its migration is applied.
    }
  }
  let content = mergeSiteContent([]);
  try {
    content = mergeSiteContent(await getDb().select().from(siteContent));
  } catch {
    // The defaults keep the site available before the first CMS migration.
  }
  return (
    <CommunityHome
      user={user ? { displayName: user.displayName, email: user.email } : null}
      signInPath={chatGPTSignInPath("/")}
      content={content}
      isAdmin={Boolean(user && isAdminEmail(user.email))}
    />
  );
}
