import { redirect } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { activities, members, posts, siteContent } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { isAdminEmail } from "@/lib/admin-auth";
import { mergeSiteContent } from "@/lib/site-content";
import AdminEditor from "./admin-editor";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!isAdminEmail(user.email)) redirect("/");

  let content = mergeSiteContent([]);
  let managedPosts: typeof posts.$inferSelect[] = [];
  let managedActivities: typeof activities.$inferSelect[] = [];
  let managedMembers: typeof members.$inferSelect[] = [];
  try {
    const db = getDb();
    const [contentRows, postRows, activityRows, memberRows] = await Promise.all([
      db.select().from(siteContent),
      db.select().from(posts).orderBy(desc(posts.createdAt)).limit(100),
      db.select().from(activities).orderBy(asc(activities.eventDate)).limit(100),
      db.select().from(members).orderBy(desc(members.joinedAt)).limit(200),
    ]);
    content = mergeSiteContent(contentRows);
    managedPosts = postRows;
    managedActivities = activityRows;
    managedMembers = memberRows;
  } catch {
    // Defaults are editable immediately after the migration is applied.
  }

  return (
    <AdminEditor
      initialContent={content}
      adminName={user.displayName}
      initialPosts={managedPosts}
      initialActivities={managedActivities}
      initialMembers={managedMembers}
    />
  );
}
