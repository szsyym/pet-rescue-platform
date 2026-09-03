import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { adminJson, mapActivity, mapMember, mapPost } from "@/lib/supabase-data";
import { isAdminEmail } from "@/lib/admin-auth";
import { mergeSiteContent } from "@/lib/site-content";
import AdminEditor from "./admin-editor";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user=await getCurrentUser(); if(!user||!isAdminEmail(user.email)) redirect("/");
  let content=mergeSiteContent([]); let managedPosts:ReturnType<typeof mapPost>[]=[]; let managedActivities:ReturnType<typeof mapActivity>[]=[]; let managedMembers:ReturnType<typeof mapMember>[]=[];
  try {
    const [contentRows,postRows,activityRows,memberRows]=await Promise.all([
      adminJson<{key:string;value:string}[]>("/rest/v1/site_content?select=key,value"),
      adminJson<Record<string,unknown>[]>("/rest/v1/community_posts?select=*&order=created_at.desc&limit=100"),
      adminJson<Record<string,unknown>[]>("/rest/v1/community_activities?select=*&order=event_date.asc&limit=100"),
      adminJson<Record<string,unknown>[]>("/rest/v1/community_members?select=*&order=joined_at.desc&limit=200")]);
    content=mergeSiteContent(contentRows); managedPosts=postRows.map(mapPost); managedActivities=activityRows.map(mapActivity); managedMembers=memberRows.map(mapMember);
  } catch {}
  return <AdminEditor initialContent={content} adminName={user.displayName} initialPosts={managedPosts} initialActivities={managedActivities} initialMembers={managedMembers}/>;
}
