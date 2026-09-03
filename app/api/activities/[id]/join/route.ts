import { getCurrentUser } from "@/lib/current-user";
import { ensureMember } from "@/lib/members";
import { hasActiveSupabaseMembership } from "@/lib/supabase-auth";
import { adminJson } from "@/lib/supabase-data";

export async function POST(_:Request,context:{params:Promise<{id:string}>}) {
 const user=await getCurrentUser(); if(!user) return Response.json({error:"请先登录后再报名"},{status:401});
 if(!await hasActiveSupabaseMembership(user)) return Response.json({error:"请先支付 398 元开通会员"},{status:403});
 const member=await ensureMember(user); if(member.status==="suspended") return Response.json({error:"账号已暂停，暂时无法报名"},{status:403});
 const {id}=await context.params; const activityId=Number(id); if(!Number.isInteger(activityId)) return Response.json({error:"活动不存在"},{status:404});
 const activities=await adminJson<Record<string,unknown>[]>(`/rest/v1/community_activities?select=id,status,capacity&id=eq.${activityId}`);
 if(!activities[0]) return Response.json({error:"活动不存在"},{status:404}); if(activities[0].status!=="published") return Response.json({error:"活动尚未开放报名"},{status:400});
 await adminJson("/rest/v1/community_activity_members?on_conflict=activity_id,user_id",{method:"POST",headers:{Prefer:"resolution=ignore-duplicates,return=minimal"},body:JSON.stringify({activity_id:activityId,user_id:user.id})});
 const joined=await adminJson<unknown[]>(`/rest/v1/community_activity_members?select=user_id&activity_id=eq.${activityId}`);
 return Response.json({memberCount:joined.length});
}
