import { getCurrentUser } from "@/lib/current-user";
import { isAdminEmail } from "@/lib/admin-auth";
import { isKnownContentKey } from "@/lib/site-content";
import { adminJson } from "@/lib/supabase-data";

export async function PUT(request:Request) {
 const user=await getCurrentUser(); if(!user||!isAdminEmail(user.email)) return Response.json({error:"无权访问后台"},{status:403});
 const body=await request.json() as {values?:Record<string,unknown>}; const rows=Object.entries(body.values??{}).filter(([k,v])=>isKnownContentKey(k)&&typeof v==="string").map(([key,value])=>({key,value:(value as string).slice(0,2000),updated_by:user.email,updated_at:new Date().toISOString()}));
 if(!rows.length) return Response.json({error:"没有可保存的内容"},{status:400});
 await adminJson("/rest/v1/site_content?on_conflict=key",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows)}); return Response.json({saved:rows.length});
}
