import { getCurrentUser } from "@/lib/current-user";
import { ensureMember } from "@/lib/members";
import { hasActiveSupabaseMembership } from "@/lib/supabase-auth";
import { adminJson, mapActivity } from "@/lib/supabase-data";

export async function GET() {
  try {
    const rows=await adminJson<Record<string,unknown>[]>("/rest/v1/community_activities?select=*&status=eq.published&order=event_date.asc&limit=20");
    const members=await adminJson<{activity_id:number}[]>("/rest/v1/community_activity_members?select=activity_id");
    const counts=new Map<number,number>(); members.forEach(x=>counts.set(x.activity_id,(counts.get(x.activity_id)||0)+1));
    return Response.json({activities:rows.map(row=>mapActivity({...row,member_count:counts.get(Number(row.id))||0}))});
  } catch { return Response.json({activities:[]}); }
}
export async function POST(request:Request) {
  const user=await getCurrentUser(); if(!user) return Response.json({error:"请先登录后再发起活动"},{status:401});
  if(!await hasActiveSupabaseMembership(user)) return Response.json({error:"请先支付 398 元开通会员"},{status:403});
  const member=await ensureMember(user); if(member.status==="suspended") return Response.json({error:"账号已暂停，暂时无法发起活动"},{status:403});
  const body=await request.json() as Record<string,string>; const capacity=Number(body.capacity);
  if(!body.title?.trim()||!body.description?.trim()||!body.location?.trim()||!body.eventDate?.trim()) return Response.json({error:"请完整填写活动信息"},{status:400});
  if(!Number.isInteger(capacity)||capacity<2||capacity>500) return Response.json({error:"人数应在 2–500 之间"},{status:400});
  const rows=await adminJson<Record<string,unknown>[]>("/rest/v1/community_activities",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({organizer_id:user.id,organizer_name:user.displayName,title:body.title.trim().slice(0,80),description:body.description.trim().slice(0,500),location:body.location.trim().slice(0,100),event_date:body.eventDate,capacity})});
  return Response.json({activity:mapActivity(rows[0]),moderation:"pending"},{status:201});
}
