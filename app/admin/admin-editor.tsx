"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, Eye, EyeOff, Image as ImageIcon, LayoutDashboard, MessageSquare, PawPrint, Save, Trash2, Type, Upload, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Toaster, toast } from "sonner";
import type { SiteContent } from "@/lib/site-content";

type Field = { key: string; label: string; multiline?: boolean; type?: string };
type Group = { title: string; description: string; fields: Field[] };
type ManagedPost = { id: number; authorName: string; title: string; content: string; imageUrl: string | null; category: string; status: string; createdAt: string };
type ManagedActivity = { id: number; organizerName: string; title: string; description: string; location: string; eventDate: string; capacity: number; status: string; createdAt: string };
type ManagedMember = { id: string; email: string; displayName: string; status: string; joinedAt: string; lastSeenAt: string };

const groups: Record<string, Group[]> = {
  basic: [
    { title: "品牌与导航", description: "网站顶部显示的品牌名和菜单文字。", fields: [
      { key: "brandName", label: "品牌名称" }, { key: "brandAccent", label: "品牌强调词" },
      { key: "navHome", label: "首页菜单" }, { key: "navCommunity", label: "社区菜单" },
      { key: "navActivities", label: "活动菜单" }, { key: "navAbout", label: "About 菜单" },
      { key: "navLogin", label: "登录按钮" }, { key: "navRegister", label: "注册按钮" },
      { key: "navPublish", label: "发布按钮" }, { key: "navAdmin", label: "后台按钮" },
    ] },
    { title: "页脚", description: "网站底部版权和公益主张。", fields: [
      { key: "footerText", label: "页脚文案", multiline: true },
    ] },
  ],
  home: [
    { title: "首页首屏", description: "访客打开网站后最先看到的内容。", fields: [
      { key: "heroBadge", label: "顶部提示" }, { key: "heroTitleLine1", label: "主标题第一行" },
      { key: "heroTitleAccent", label: "主标题强调行" }, { key: "heroDescription", label: "介绍文案", multiline: true },
      { key: "heroPrimaryButton", label: "主按钮" }, { key: "heroSecondaryButton", label: "次按钮" },
    ] },
    { title: "数据指标", description: "首页显示的三组公益数据。", fields: [
      { key: "stat1Value", label: "指标一数值" }, { key: "stat1Label", label: "指标一名称" },
      { key: "stat2Value", label: "指标二数值" }, { key: "stat2Label", label: "指标二名称" },
      { key: "stat3Value", label: "指标三数值" }, { key: "stat3Label", label: "指标三名称" },
    ] },
    { title: "媒体组件文案", description: "首页右侧媒体卡片的文字。媒体文件请到左侧“媒体管理”设置。", fields: [
      { key: "videoLabel", label: "视频标签" }, { key: "videoTitle", label: "视频标题" },
      { key: "trustTitle", label: "认证标题" }, { key: "trustSubtitle", label: "认证说明" },
    ] },
  ],
  community: [
    { title: "社区栏目", description: "救助动态区域的标题和操作按钮。", fields: [
      { key: "communityEyebrow", label: "英文标签" }, { key: "communityTitle", label: "栏目标题" },
      { key: "communityDescription", label: "栏目说明", multiline: true }, { key: "communityPublishButton", label: "发布按钮" },
    ] },
    ...[1, 2, 3].map((i) => ({ title: `精选动态 ${i}`, description: "首页默认展示的精选救助内容。", fields: [
      { key: `featuredPost${i}Author`, label: "发布者" }, { key: `featuredPost${i}Title`, label: "标题" },
      { key: `featuredPost${i}Content`, label: "正文", multiline: true }, { key: `featuredPost${i}Image`, label: "图片链接", type: "url" },
      { key: `featuredPost${i}Category`, label: "分类" }, { key: `featuredPost${i}Time`, label: "发布时间" },
    ] })),
  ],
  activities: [
    { title: "活动栏目", description: "公益活动区域的标题和按钮。", fields: [
      { key: "activitiesEyebrow", label: "英文标签" }, { key: "activitiesTitle", label: "栏目标题" },
      { key: "activitiesDescription", label: "栏目说明", multiline: true }, { key: "activitiesCreateButton", label: "发起按钮" },
      { key: "activitiesJoinButton", label: "报名按钮" },
    ] },
    ...[1, 2, 3].map((i) => ({ title: `精选活动 ${i}`, description: "首页默认展示的公益活动。", fields: [
      { key: `featuredActivity${i}Organizer`, label: "组织者" }, { key: `featuredActivity${i}Title`, label: "活动名称" },
      { key: `featuredActivity${i}Description`, label: "活动说明", multiline: true },
      { key: `featuredActivity${i}Location`, label: "地点" }, { key: `featuredActivity${i}Date`, label: "时间", type: "datetime-local" },
      { key: `featuredActivity${i}Capacity`, label: "人数上限", type: "number" }, { key: `featuredActivity${i}Members`, label: "当前报名人数", type: "number" },
    ] })),
  ],
  about: [
    { title: "About", description: "品牌理念和公益价值。", fields: [
      { key: "aboutEyebrow", label: "英文标签" }, { key: "aboutTitle", label: "主标题", multiline: true },
      { key: "aboutDescription", label: "品牌介绍", multiline: true }, { key: "aboutMetricValue", label: "左侧主数据" },
      { key: "aboutMetricLabel", label: "主数据说明" }, { key: "aboutTogetherValue", label: "协作关键词" },
      { key: "aboutTogetherLabel", label: "协作说明" }, { key: "aboutPoint1", label: "价值点一" },
      { key: "aboutPoint2", label: "价值点二" }, { key: "aboutPoint3", label: "价值点三" },
      { key: "aboutPoint4", label: "价值点四" },
    ] },
    { title: "底部行动号召", description: "邀请访客注册和参与。", fields: [
      { key: "ctaTitle", label: "标题" }, { key: "ctaDescription", label: "说明", multiline: true },
      { key: "ctaGuestButton", label: "未登录按钮" }, { key: "ctaMemberButton", label: "已登录按钮" },
    ] },
  ],
};

const components = [
  ["heroEnabled", "首页首屏", "主标题、公益数据和行动按钮"],
  ["videoEnabled", "视频播放器", "首页右侧的救助视频"],
  ["communityEnabled", "救助社区", "图片动态和发布入口"],
  ["activitiesEnabled", "公益活动", "活动列表、发起和报名"],
  ["aboutEnabled", "About", "品牌使命与价值观"],
  ["ctaEnabled", "底部注册引导", "页脚前的会员转化组件"],
] as const;

export default function AdminEditor({
  initialContent,
  adminName,
  initialPosts,
  initialActivities,
  initialMembers,
}: {
  initialContent: SiteContent;
  adminName: string;
  initialPosts: ManagedPost[];
  initialActivities: ManagedActivity[];
  initialMembers: ManagedMember[];
}) {
  const [values, setValues] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [managedPosts, setManagedPosts] = useState(initialPosts);
  const [managedActivities, setManagedActivities] = useState(initialActivities);
  const [managedMembers, setManagedMembers] = useState(initialMembers);
  const [deleting, setDeleting] = useState<{ resource: "post" | "activity"; id: number; title: string } | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const update = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const statusLabel: Record<string, string> = { pending: "待审核", published: "已发布", hidden: "已隐藏", active: "正常", suspended: "已暂停" };
  const statusClass: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    published: "bg-emerald-100 text-emerald-700",
    hidden: "bg-slate-100 text-slate-600",
    active: "bg-emerald-100 text-emerald-700",
    suspended: "bg-rose-100 text-rose-700",
  };

  async function updateStatus(resource: "post" | "activity" | "member", id: number | string, status: string) {
    const response = await fetch("/api/admin/operations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, id, status }),
    });
    const data = await response.json();
    if (!response.ok) return toast.error(data.error ?? "操作失败");
    if (resource === "post") setManagedPosts((rows) => rows.map((row) => row.id === id ? { ...row, status } : row));
    if (resource === "activity") setManagedActivities((rows) => rows.map((row) => row.id === id ? { ...row, status } : row));
    if (resource === "member") setManagedMembers((rows) => rows.map((row) => row.id === id ? { ...row, status } : row));
    toast.success("状态已更新");
  }

  async function deleteRecord() {
    if (!deleting) return;
    const response = await fetch("/api/admin/operations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource: deleting.resource, id: deleting.id }),
    });
    const data = await response.json();
    if (!response.ok) return toast.error(data.error ?? "删除失败");
    if (deleting.resource === "post") setManagedPosts((rows) => rows.filter((row) => row.id !== deleting.id));
    if (deleting.resource === "activity") setManagedActivities((rows) => rows.filter((row) => row.id !== deleting.id));
    setDeleting(null);
    toast.success("已删除");
  }

  async function uploadContentImage(key: string, file?: File) {
    if (!file) return;
    setUploadingKey(key);
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/upload", { method: "POST", body });
    const data = await response.json();
    setUploadingKey(null);
    if (!response.ok) return toast.error(data.error ?? "图片上传失败");
    update(key, data.url);
    toast.success("图片已上传，记得保存全部");
  }

  async function uploadHeroMedia(file?: File) {
    if (!file) return;
    setUploadingKey("heroMediaUrl");
    const body = new FormData(); body.set("file", file);
    const response = await fetch("/api/admin/media", {method:"POST",body});
    const data = await response.json(); setUploadingKey(null);
    if (!response.ok) return toast.error(data.error ?? "媒体上传失败");
    setValues((current) => ({...current,heroMediaUrl:data.url,heroMediaType:data.mediaType}));
    toast.success("媒体已上传，点击右上角“保存全部”即可生效");
  }

  async function save() {
    setSaving(true);
    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return toast.error(data.error ?? "保存失败");
    toast.success(`已保存 ${data.saved} 项，刷新前台即可看到更新`);
  }

  function renderGroups(items: Group[]) {
    return <div className="space-y-6">{items.map((group) => (
      <section key={group.title} className="rounded-2xl border border-[#dce8ea] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#153d45]">{group.title}</h2>
        <p className="mt-1 text-sm text-[#6b8085]">{group.description}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {group.fields.map((field) => (
            <label key={field.key} className={field.multiline ? "md:col-span-2" : ""}>
              <span className="mb-2 block text-sm font-medium text-[#36575e]">{field.label}</span>
              {field.multiline ? (
                <Textarea value={values[field.key] ?? ""} onChange={(e) => update(field.key, e.target.value)} rows={4} />
              ) : field.type === "url" && field.key.includes("Image") ? (
                <div className="space-y-2">
                  <Input type="url" value={values[field.key] ?? ""} onChange={(e) => update(field.key, e.target.value)} />
                  <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#9fc9ca] bg-[#f2faf9] px-3 py-2 text-sm font-medium text-[#167173] hover:bg-[#e6f6f3]">
                    <Upload className="mr-2 size-4" />{uploadingKey === field.key ? "上传中…" : "从电脑上传图片"}
                    <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploadingKey === field.key} onChange={(e) => uploadContentImage(field.key, e.target.files?.[0])} />
                  </label>
                </div>
              ) : (
                <Input type={field.type ?? "text"} value={values[field.key] ?? ""} onChange={(e) => update(field.key, e.target.value)} />
              )}
            </label>
          ))}
        </div>
      </section>
    ))}</div>;
  }

  return (
    <main className="min-h-screen bg-[#f4f8f9] text-[#153d45]">
      <Toaster position="top-center" richColors />
      <header className="sticky top-0 z-20 border-b border-[#dce8ea] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1380px] items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#008f91] text-white"><PawPrint className="size-5" /></span>
            <div><h1 className="font-bold">伴宠公益 · 内容后台</h1><p className="text-xs text-[#71858a]">管理员：{adminName}</p></div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-full"><Link href="/" target="_blank"><Eye className="mr-2 size-4" />查看网站</Link></Button>
            <Button onClick={save} disabled={saving} className="rounded-full bg-[#008f91] px-6 hover:bg-[#007b7d]"><Save className="mr-2 size-4" />{saving ? "保存中…" : "保存全部"}</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1380px] px-5 py-8">
        <Tabs defaultValue="basic" orientation="vertical" className="grid gap-7 lg:grid-cols-[220px_1fr]">
          <aside className="self-start lg:sticky lg:top-24">
            <Link href="/" className="mb-5 flex items-center gap-2 text-sm font-medium text-[#557178] hover:text-[#008f91]"><ArrowLeft className="size-4" />返回前台</Link>
            <TabsList className="flex h-auto w-full flex-col items-stretch gap-1 rounded-2xl bg-white p-2 shadow-sm">
              <TabsTrigger value="basic" className="justify-start rounded-xl px-4 py-3">品牌与导航</TabsTrigger>
              <TabsTrigger value="home" className="justify-start rounded-xl px-4 py-3">首页首屏</TabsTrigger>
              <TabsTrigger value="media" className="justify-start rounded-xl px-4 py-3"><Video className="mr-2 size-4" />媒体管理</TabsTrigger>
              <TabsTrigger value="community" className="justify-start rounded-xl px-4 py-3">救助社区</TabsTrigger>
              <TabsTrigger value="activities" className="justify-start rounded-xl px-4 py-3">公益活动</TabsTrigger>
              <TabsTrigger value="about" className="justify-start rounded-xl px-4 py-3">About</TabsTrigger>
              <TabsTrigger value="components" className="justify-start rounded-xl px-4 py-3">组件管理</TabsTrigger>
              <div className="my-2 border-t border-[#e6edef]" />
              <TabsTrigger value="postManage" className="justify-start rounded-xl px-4 py-3"><MessageSquare className="mr-2 size-4" />帖子审核</TabsTrigger>
              <TabsTrigger value="activityManage" className="justify-start rounded-xl px-4 py-3"><CalendarDays className="mr-2 size-4" />活动管理</TabsTrigger>
              <TabsTrigger value="memberManage" className="justify-start rounded-xl px-4 py-3"><Users className="mr-2 size-4" />会员管理</TabsTrigger>
            </TabsList>
          </aside>
          <div>
            <div className="mb-6 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#dff4f1] text-[#008f91]"><LayoutDashboard className="size-5" /></span><div><h2 className="text-2xl font-bold">网站内容编辑</h2><p className="text-sm text-[#6b8085]">修改后点击“保存全部”，前台刷新即可更新。</p></div></div>
            {Object.entries(groups).map(([key, items]) => <TabsContent key={key} value={key} className="mt-0">{renderGroups(items)}</TabsContent>)}
            <TabsContent value="media" className="mt-0">
              <section className="rounded-2xl border border-[#dce8ea] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#dff4f1] text-[#008f91]"><Video /></span><div><h2 className="text-lg font-bold">首页媒体管理</h2><p className="text-sm text-[#6b8085]">首页右侧可独立显示外部视频、上传视频或上传图片。</p></div></div>
                <div className="mt-6 grid gap-5">
                  <label><span className="mb-2 block text-sm font-medium">展示类型</span><select value={values.heroMediaType ?? "external"} onChange={(e)=>update("heroMediaType",e.target.value)} className="h-11 w-full rounded-lg border bg-white px-3"><option value="external">外部视频链接</option><option value="video">上传的视频</option><option value="image">上传的图片</option></select></label>
                  <label><span className="mb-2 block text-sm font-medium">媒体地址</span><Input value={values.heroMediaUrl ?? values.videoUrl ?? ""} onChange={(e)=>update("heroMediaUrl",e.target.value)} placeholder="YouTube 嵌入链接或已上传文件地址" /></label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#9fc9ca] bg-[#f2faf9] p-5 font-medium text-[#167173] hover:bg-[#e6f6f3]"><ImageIcon className="mr-2 size-5" />上传图片<input className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploadingKey==="heroMediaUrl"} onChange={(e)=>uploadHeroMedia(e.target.files?.[0])} /></label>
                    <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#9fc9ca] bg-[#f2faf9] p-5 font-medium text-[#167173] hover:bg-[#e6f6f3]"><Video className="mr-2 size-5" />{uploadingKey==="heroMediaUrl"?"上传中…":"上传视频（最大 4MB）"}<input className="hidden" type="file" accept="video/mp4,video/webm,video/quicktime" disabled={uploadingKey==="heroMediaUrl"} onChange={(e)=>uploadHeroMedia(e.target.files?.[0])} /></label>
                  </div>
                  <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">较大的视频建议上传到视频平台后粘贴嵌入链接，可避免网页加载过慢。YouTube 请使用 /embed/ 格式链接。</p>
                  {values.heroMediaUrl && <div className="overflow-hidden rounded-xl border bg-[#edf6f6]"><div className="aspect-video">{values.heroMediaType==="image"?<img src={values.heroMediaUrl} alt="媒体预览" className="h-full w-full object-cover"/>:values.heroMediaType==="video"?<video src={values.heroMediaUrl} controls className="h-full w-full object-cover"/>:<iframe src={values.heroMediaUrl} title="媒体预览" className="h-full w-full"/>}</div></div>}
                </div>
              </section>
            </TabsContent>
            <TabsContent value="components" className="mt-0">
              <section className="rounded-2xl border border-[#dce8ea] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3"><Type className="size-5 text-[#008f91]" /><div><h2 className="text-lg font-bold">前台组件开关</h2><p className="text-sm text-[#6b8085]">关闭后组件会从网站隐藏，内容不会被删除。</p></div></div>
                <div className="mt-6 divide-y divide-[#e7eef0]">
                  {components.map(([key, label, description]) => (
                    <div key={key} className="flex items-center justify-between gap-5 py-5">
                      <div><h3 className="font-semibold">{label}</h3><p className="mt-1 text-sm text-[#6b8085]">{description}</p></div>
                      <Switch checked={values[key] !== "false"} onCheckedChange={(checked) => update(key, String(checked))} aria-label={`显示${label}`} />
                    </div>
                  ))}
                </div>
              </section>
            </TabsContent>
            <TabsContent value="postManage" className="mt-0">
              <section className="rounded-2xl border border-[#dce8ea] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">帖子审核</h2><p className="mt-1 text-sm text-[#6b8085]">审核会员发布的救助动态，只有“已发布”内容会出现在前台。</p></div><Badge variant="secondary">{managedPosts.length} 条</Badge></div>
                <div className="mt-6 space-y-4">
                  {managedPosts.length === 0 && <div className="rounded-xl bg-[#f5f9f9] p-8 text-center text-sm text-[#71858a]">暂时没有会员帖子</div>}
                  {managedPosts.map((post) => (
                    <article key={post.id} className="flex flex-col gap-4 rounded-xl border border-[#e2ebed] p-4 sm:flex-row">
                      {post.imageUrl && <img src={post.imageUrl} alt="" className="h-24 w-full rounded-lg object-cover sm:w-28" />}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><Badge className={statusClass[post.status]}>{statusLabel[post.status] ?? post.status}</Badge><span className="text-xs text-[#71858a]">{post.category} · {post.authorName} · {new Date(post.createdAt).toLocaleString("zh-CN")}</span></div>
                        <h3 className="mt-2 font-bold">{post.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#62777d]">{post.content}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:w-28 sm:flex-col sm:items-stretch">
                        {post.status !== "published" && <Button size="sm" onClick={() => updateStatus("post", post.id, "published")} className="bg-[#008f91] hover:bg-[#007b7d]"><CheckCircle2 className="mr-1 size-4" />通过</Button>}
                        {post.status !== "hidden" && <Button size="sm" variant="outline" onClick={() => updateStatus("post", post.id, "hidden")}><EyeOff className="mr-1 size-4" />隐藏</Button>}
                        <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => setDeleting({ resource: "post", id: post.id, title: post.title })}><Trash2 className="mr-1 size-4" />删除</Button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </TabsContent>
            <TabsContent value="activityManage" className="mt-0">
              <section className="rounded-2xl border border-[#dce8ea] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">活动管理</h2><p className="mt-1 text-sm text-[#6b8085]">审核活动信息、控制报名状态或删除不合适的活动。</p></div><Badge variant="secondary">{managedActivities.length} 个</Badge></div>
                <div className="mt-6 space-y-4">
                  {managedActivities.length === 0 && <div className="rounded-xl bg-[#f5f9f9] p-8 text-center text-sm text-[#71858a]">暂时没有会员发起的活动</div>}
                  {managedActivities.map((activity) => (
                    <article key={activity.id} className="flex flex-col gap-4 rounded-xl border border-[#e2ebed] p-4 sm:flex-row">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><Badge className={statusClass[activity.status]}>{statusLabel[activity.status] ?? activity.status}</Badge><span className="text-xs text-[#71858a]">{activity.organizerName} · {new Date(activity.eventDate).toLocaleString("zh-CN")}</span></div>
                        <h3 className="mt-2 font-bold">{activity.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#62777d]">{activity.description}</p>
                        <p className="mt-2 text-sm text-[#167173]">{activity.location} · 上限 {activity.capacity} 人</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:w-28 sm:flex-col sm:items-stretch">
                        {activity.status !== "published" && <Button size="sm" onClick={() => updateStatus("activity", activity.id, "published")} className="bg-[#008f91] hover:bg-[#007b7d]"><CheckCircle2 className="mr-1 size-4" />通过</Button>}
                        {activity.status !== "hidden" && <Button size="sm" variant="outline" onClick={() => updateStatus("activity", activity.id, "hidden")}><EyeOff className="mr-1 size-4" />关闭</Button>}
                        <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => setDeleting({ resource: "activity", id: activity.id, title: activity.title })}><Trash2 className="mr-1 size-4" />删除</Button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </TabsContent>
            <TabsContent value="memberManage" className="mt-0">
              <section className="rounded-2xl border border-[#dce8ea] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">会员管理</h2><p className="mt-1 text-sm text-[#6b8085]">查看会员账号；暂停后该会员不能发帖、发起活动或上传图片。</p></div><Badge variant="secondary">{managedMembers.length} 人</Badge></div>
                <div className="mt-6 divide-y divide-[#e6edef]">
                  {managedMembers.length === 0 && <div className="rounded-xl bg-[#f5f9f9] p-8 text-center text-sm text-[#71858a]">会员会在登录网站后自动出现在这里</div>}
                  {managedMembers.map((member) => (
                    <div key={member.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#dff4f1] font-bold text-[#008f91]">{member.displayName.slice(0, 1).toUpperCase()}</span><div><h3 className="font-semibold">{member.displayName}</h3><p className="text-sm text-[#71858a]">{member.email} · 加入于 {new Date(member.joinedAt).toLocaleDateString("zh-CN")}</p></div></div>
                      <div className="flex items-center gap-3"><Badge className={statusClass[member.status]}>{statusLabel[member.status] ?? member.status}</Badge>{member.status === "active" ? <Button size="sm" variant="outline" onClick={() => updateStatus("member", member.id, "suspended")}>暂停账号</Button> : <Button size="sm" onClick={() => updateStatus("member", member.id, "active")} className="bg-[#008f91] hover:bg-[#007b7d]">恢复账号</Button>}</div>
                    </div>
                  ))}
                </div>
              </section>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>确认删除“{deleting?.title}”？</AlertDialogTitle><AlertDialogDescription>删除后无法恢复，前台也不会再显示这条内容。</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={deleteRecord} className="bg-rose-600 hover:bg-rose-700">确认删除</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
