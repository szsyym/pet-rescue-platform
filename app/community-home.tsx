"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Heart,
  MapPin,
  Menu,
  MessageCircle,
  PawPrint,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from "sonner";
import { DEFAULT_SITE_CONTENT, type SiteContent } from "@/lib/site-content";

type User = { displayName: string; email: string } | null;
type Post = {
  id: number | string;
  authorName: string;
  title: string;
  content: string;
  imageUrl: string | null;
  category: string;
  createdAt: string;
};
type Activity = {
  id: number | string;
  organizerName: string;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  capacity: number;
  memberCount?: number;
};

function contentValue(content: SiteContent, key: string) {
  return content[key] ?? DEFAULT_SITE_CONTENT[key] ?? "";
}

function buildFeaturedPosts(content: SiteContent): Post[] {
  return [1, 2, 3].map((i) => ({
    id: `featured-${i}`,
    authorName: contentValue(content, `featuredPost${i}Author`),
    title: contentValue(content, `featuredPost${i}Title`),
    content: contentValue(content, `featuredPost${i}Content`),
    imageUrl: contentValue(content, `featuredPost${i}Image`) || null,
    category: contentValue(content, `featuredPost${i}Category`),
    createdAt: contentValue(content, `featuredPost${i}Time`),
  }));
}

function buildFeaturedActivities(content: SiteContent): Activity[] {
  return [1, 2, 3].map((i) => ({
    id: `event-${i}`,
    organizerName: contentValue(content, `featuredActivity${i}Organizer`),
    title: contentValue(content, `featuredActivity${i}Title`),
    description: contentValue(content, `featuredActivity${i}Description`),
    location: contentValue(content, `featuredActivity${i}Location`),
    eventDate: contentValue(content, `featuredActivity${i}Date`),
    capacity: Number(contentValue(content, `featuredActivity${i}Capacity`)) || 20,
    memberCount: Number(contentValue(content, `featuredActivity${i}Members`)) || 0,
  }));
}

export default function CommunityHome({ user, signInPath, content, isAdmin }: { user: User; signInPath: string; content: SiteContent; isAdmin: boolean }) {
  const featuredPosts = useMemo(() => buildFeaturedPosts(content), [content]);
  const featuredActivities = useMemo(() => buildFeaturedActivities(content), [content]);
  const t = (key: string) => contentValue(content, key);
  const enabled = (key: string) => t(key) !== "false";
  const [posts, setPosts] = useState<Post[]>(featuredPosts);
  const [activities, setActivities] = useState<Activity[]>(featuredActivities);
  const [postOpen, setPostOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filter, setFilter] = useState("全部");
  const [liked, setLiked] = useState<Set<number | string>>(new Set());
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/posts").then((r) => (r.ok ? r.json() : { posts: [] })),
      fetch("/api/activities").then((r) => (r.ok ? r.json() : { activities: [] })),
    ]).then(([postData, activityData]) => {
      if (postData.posts?.length) setPosts([...postData.posts, ...featuredPosts]);
      if (activityData.activities?.length) setActivities([...activityData.activities, ...featuredActivities]);
    }).catch(() => undefined);
  }, [featuredActivities, featuredPosts]);

  const visiblePosts = useMemo(
    () => filter === "全部" ? posts : posts.filter((post) => post.category === filter),
    [filter, posts],
  );

  function requireMember(action: () => void) {
    if (!user) {
      window.location.href = signInPath;
      return;
    }
    action();
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let imageUrl = "";
    const file = form.get("imageFile");
    if (file instanceof File && file.size > 0) {
      setUploading(true);
      const uploadForm = new FormData();
      uploadForm.set("file", file);
      const uploadResponse = await fetch("/api/upload", { method: "POST", body: uploadForm });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        setUploading(false);
        return toast.error(uploadData.error ?? "图片上传失败");
      }
      imageUrl = uploadData.url;
    }
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        content: form.get("content"),
        category: form.get("category"),
        imageUrl,
      }),
    });
    const data = await response.json();
    setUploading(false);
    if (!response.ok) return toast.error(data.error ?? "发布失败，请稍后再试");
    setPostOpen(false);
    toast.success("动态已提交，管理员审核通过后会公开显示");
  }

  async function submitActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const data = await response.json();
    if (!response.ok) return toast.error(data.error ?? "发起失败，请稍后再试");
    setActivityOpen(false);
    toast.success("活动已提交，管理员审核通过后会开放报名");
  }

  async function joinActivity(id: number | string) {
    if (typeof id !== "number") return toast.success("已记录你的报名意向");
    const response = await fetch(`/api/activities/${id}/join`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) return toast.error(data.error ?? "报名失败");
    setActivities((current) => current.map((item) => item.id === id ? { ...item, memberCount: data.memberCount } : item));
    toast.success("报名成功，活动前会提醒你");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7fbfc] text-[#14323a]">
      <Toaster position="top-center" richColors />
      <header className="sticky top-0 z-50 border-b border-[#dcebee]/90 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <a href="#" className="flex items-center gap-3" aria-label="伴宠公益首页">
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#0aa7a1] to-[#187da4] text-white shadow-lg shadow-teal-700/15">
              <PawPrint className="size-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">{t("brandName")}<span className="text-[#009d9b]">{t("brandAccent")}</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-[15px] font-medium lg:flex">
            <a className="text-[#008f91]" href="#">{t("navHome")}</a>
            {enabled("communityEnabled") && <a className="transition hover:text-[#008f91]" href="#community">{t("navCommunity")}</a>}
            {enabled("activitiesEnabled") && <a className="transition hover:text-[#008f91]" href="#activities">{t("navActivities")}</a>}
            {enabled("aboutEnabled") && <a className="transition hover:text-[#008f91]" href="#about">{t("navAbout")}</a>}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Button variant="ghost" size="icon" className="rounded-full"><Search className="size-5" /></Button>
            {user ? (
              <div className="flex items-center gap-3 rounded-full bg-[#edf8f7] py-1.5 pl-2 pr-4 text-sm font-medium">
                <span className="grid size-8 place-items-center rounded-full bg-[#0a9f9c] text-white">{user.displayName.slice(0, 1).toUpperCase()}</span>
                {user.displayName}
              </div>
            ) : (
              <Button asChild variant="ghost"><a href={signInPath} target="_top">{t("navLogin")}</a></Button>
            )}
            {isAdmin && <Button asChild variant="outline" className="rounded-full"><a href="/admin">{t("navAdmin")}</a></Button>}
            <Button asChild className="rounded-full bg-[#008f91] px-6 shadow-lg shadow-teal-700/15 hover:bg-[#007b7d]">
              <a href={user ? "#community" : signInPath} target={user ? undefined : "_top"}>{user ? t("navPublish") : t("navRegister")}</a>
            </Button>
          </div>
          <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="打开导航">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
        {mobileOpen && (
          <nav className="border-t bg-white px-6 py-5 lg:hidden">
            <div className="flex flex-col gap-4 font-medium">
              {enabled("communityEnabled") && <a href="#community" onClick={() => setMobileOpen(false)}>{t("navCommunity")}</a>}
              {enabled("activitiesEnabled") && <a href="#activities" onClick={() => setMobileOpen(false)}>{t("navActivities")}</a>}
              {enabled("aboutEnabled") && <a href="#about" onClick={() => setMobileOpen(false)}>{t("navAbout")}</a>}
              <a className="text-[#008f91]" href={signInPath} target="_top">{user ? user.displayName : `${t("navLogin")} / ${t("navRegister")}`}</a>
              {isAdmin && <a className="font-semibold text-[#008f91]" href="/admin">{t("navAdmin")}</a>}
            </div>
          </nav>
        )}
      </header>

      {enabled("heroEnabled") && <section className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_15%,#c8f3ed_0,transparent_28%),radial-gradient(circle_at_5%_80%,#dceff9_0,transparent_24%)]" />
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-24">
          <div>
            <Badge className="mb-6 rounded-full border border-[#b8e5df] bg-white px-4 py-2 text-[#087d7e] shadow-sm hover:bg-white">
              <Sparkles className="mr-2 size-4" /> {t("heroBadge")}
            </Badge>
            <h1 className="max-w-xl text-5xl font-bold leading-[1.08] tracking-[-0.045em] text-[#123840] sm:text-6xl lg:text-[4.6rem]">
              {t("heroTitleLine1")}<br /><span className="bg-gradient-to-r from-[#00a6a0] to-[#1a7fa8] bg-clip-text text-transparent">{t("heroTitleAccent")}</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#577078]">
              {t("heroDescription")}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button onClick={() => requireMember(() => setPostOpen(true))} size="lg" className="h-13 rounded-full bg-[#008f91] px-7 text-base shadow-xl shadow-teal-700/20 hover:bg-[#007b7d]">
                <Plus className="mr-2 size-5" />{t("heroPrimaryButton")}
              </Button>
              <Button asChild size="lg" variant="outline" className="h-13 rounded-full border-[#bcd9dd] bg-white px-7 text-base hover:bg-[#eaf8f7]">
                <a href="#activities">{t("heroSecondaryButton")}<ChevronRight className="ml-1 size-5" /></a>
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-7 text-sm text-[#60777d]">
              <span><b className="block text-2xl text-[#163e46]">{t("stat1Value")}</b>{t("stat1Label")}</span>
              <span className="h-9 w-px bg-[#cfe2e5]" />
              <span><b className="block text-2xl text-[#163e46]">{t("stat2Value")}</b>{t("stat2Label")}</span>
              <span className="h-9 w-px bg-[#cfe2e5]" />
              <span><b className="block text-2xl text-[#163e46]">{t("stat3Value")}</b>{t("stat3Label")}</span>
            </div>
          </div>
          {enabled("videoEnabled") && <div className="relative">
            <div className="absolute -left-8 top-8 h-40 w-40 rounded-full bg-[#33c6bc]/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border-[8px] border-white bg-[#163f47] shadow-2xl shadow-[#1b6671]/20">
              <div className="aspect-video">
                <iframe
                  className="h-full w-full"
                  src={t("videoUrl")}
                  title="宠物救助故事视频"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center justify-between bg-[#123d45] px-5 py-4 text-white">
                <div>
                  <p className="text-xs text-white/60">{t("videoLabel")}</p>
                  <p className="font-semibold">{t("videoTitle")}</p>
                </div>
                <span className="grid size-11 place-items-center rounded-full bg-[#18aea7]"><Play className="ml-0.5 size-5 fill-white" /></span>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-5 hidden items-center gap-3 rounded-2xl bg-white p-4 shadow-xl sm:flex">
              <span className="grid size-11 place-items-center rounded-full bg-[#dff6f2] text-[#008f91]"><ShieldCheck /></span>
              <span className="text-sm"><b className="block">{t("trustTitle")}</b><span className="text-[#71858b]">{t("trustSubtitle")}</span></span>
            </div>
          </div>}
        </div>
      </section>}

      {enabled("communityEnabled") && <section id="community" className="bg-white py-20">
        <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-sm font-bold tracking-[0.18em] text-[#009b9b]">{t("communityEyebrow")}</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("communityTitle")}</h2>
              <p className="mt-3 text-[#667c82]">{t("communityDescription")}</p>
            </div>
            <Button onClick={() => requireMember(() => setPostOpen(true))} variant="outline" className="w-fit rounded-full border-[#b9dadc] bg-[#f7fbfc]">
              <Plus className="mr-2 size-4" />{t("communityPublishButton")}
            </Button>
          </div>
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            {["全部", "救助日记", "领养故事", "救助经验", "活动现场"].map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition ${filter === item ? "bg-[#073f48] text-white" : "bg-[#eef6f6] text-[#577278] hover:bg-[#dff1f0]"}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
            {visiblePosts.map((post, index) => (
              <article key={post.id} className="group mb-5 break-inside-avoid overflow-hidden rounded-[1.4rem] border border-[#deeaec] bg-white shadow-[0_10px_35px_rgba(24,85,94,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(24,85,94,0.12)]">
                {post.imageUrl && (
                  <img src={post.imageUrl} alt={post.title} referrerPolicy="no-referrer" className={`w-full object-cover transition duration-500 group-hover:scale-[1.02] ${index % 3 === 1 ? "h-72" : "h-56"}`} />
                )}
                <div className="p-5">
                  <Badge variant="secondary" className="mb-3 rounded-full bg-[#e4f6f3] text-[#087b7b]">{post.category}</Badge>
                  <h3 className="text-xl font-bold leading-snug">{post.title}</h3>
                  <p className="mt-3 line-clamp-3 text-[15px] leading-7 text-[#61777d]">{post.content}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-[#edf2f3] pt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#b8eee7] to-[#cde7f3] font-bold text-[#087b7b]">{post.authorName.slice(0, 1)}</span>
                      <span className="max-w-36 truncate font-medium">{post.authorName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#7a8e93]">
                      <button onClick={() => setLiked((current) => { const next = new Set(current); next.has(post.id) ? next.delete(post.id) : next.add(post.id); return next; })} className={liked.has(post.id) ? "text-rose-500" : ""} aria-label="点赞">
                        <Heart className={`size-5 ${liked.has(post.id) ? "fill-current" : ""}`} />
                      </button>
                      <MessageCircle className="size-5" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>}

      {enabled("activitiesEnabled") && <section id="activities" className="py-20">
        <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
          <div className="rounded-[2rem] bg-[#0d3e47] p-7 text-white sm:p-10 lg:p-12">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="mb-3 text-sm font-bold tracking-[0.18em] text-[#62d7cb]">{t("activitiesEyebrow")}</p>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("activitiesTitle")}</h2>
                <p className="mt-3 max-w-2xl text-white/65">{t("activitiesDescription")}</p>
              </div>
              <Button onClick={() => requireMember(() => setActivityOpen(true))} className="w-fit rounded-full bg-[#20aaa4] px-6 hover:bg-[#2bc0b8]">
                <Plus className="mr-2 size-4" />{t("activitiesCreateButton")}
              </Button>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {activities.map((activity) => {
                const date = new Date(activity.eventDate);
                const members = activity.memberCount ?? 0;
                return (
                  <article key={activity.id} className="rounded-[1.4rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="rounded-xl bg-[#63d7cc] px-3 py-2 text-center text-[#0b4047]">
                        <span className="block text-xs font-bold">{date.getMonth() + 1}月</span>
                        <span className="block text-2xl font-black">{date.getDate()}</span>
                      </div>
                      <Badge className="border-0 bg-white/10 text-white hover:bg-white/10">{members}/{activity.capacity}人</Badge>
                    </div>
                    <h3 className="mt-5 text-xl font-bold">{activity.title}</h3>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/65">{activity.description}</p>
                    <div className="mt-5 space-y-2 text-sm text-white/75">
                      <p className="flex items-center gap-2"><CalendarDays className="size-4 text-[#62d7cb]" />{date.toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      <p className="flex items-center gap-2"><MapPin className="size-4 text-[#62d7cb]" />{activity.location}</p>
                    </div>
                    <Button onClick={() => requireMember(() => joinActivity(activity.id))} className="mt-6 w-full rounded-full bg-white text-[#0d4a52] hover:bg-[#dff8f4]">{t("activitiesJoinButton")}</Button>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>}

      {enabled("aboutEnabled") && <section id="about" className="bg-white py-20">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[2rem] bg-[#e5f7f4] p-7">
              <PawPrint className="size-9 text-[#079a96]" />
              <p className="mt-12 text-4xl font-black text-[#0d4a52]">{t("aboutMetricValue")}</p>
              <p className="mt-2 text-[#5d767b]">{t("aboutMetricLabel")}</p>
            </div>
            <div className="mt-8 rounded-[2rem] bg-[#e6f2f8] p-7">
              <Users className="size-9 text-[#197fa2]" />
              <p className="mt-12 text-4xl font-black text-[#154b61]">{t("aboutTogetherValue")}</p>
              <p className="mt-2 text-[#5d767b]">{t("aboutTogetherLabel")}</p>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold tracking-[0.18em] text-[#009b9b]">{t("aboutEyebrow")}</p>
            <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{t("aboutTitle")}</h2>
            <p className="mt-6 text-lg leading-8 text-[#60777d]">
              {t("aboutDescription")}
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {[t("aboutPoint1"), t("aboutPoint2"), t("aboutPoint3"), t("aboutPoint4")].map((item) => (
                <div key={item} className="flex items-center gap-3 font-medium"><span className="grid size-6 place-items-center rounded-full bg-[#daf4ef] text-[#008f91]">✓</span>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>}

      {enabled("ctaEnabled") && <section className="bg-gradient-to-r from-[#e0f7f3] to-[#e3f1f8] py-16">
        <div className="mx-auto flex max-w-[980px] flex-col items-center px-5 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-white text-[#008f91] shadow-lg"><Heart className="size-7 fill-[#a8e5dc]" /></span>
          <h2 className="mt-6 text-3xl font-bold">{t("ctaTitle")}</h2>
          <p className="mt-3 text-[#60777d]">{t("ctaDescription")}</p>
          <Button asChild size="lg" className="mt-7 rounded-full bg-[#008f91] px-8 hover:bg-[#007b7d]">
            <a href={user ? "#community" : signInPath} target={user ? undefined : "_top"}>{user ? t("ctaMemberButton") : t("ctaGuestButton")}<ChevronRight className="ml-1 size-5" /></a>
          </Button>
        </div>
      </section>}

      <footer className="bg-[#0b333b] py-10 text-white">
        <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-6 px-5 sm:flex-row sm:items-center lg:px-8">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#1aa8a3]"><PawPrint className="size-5" /></span><b className="text-lg">{t("brandName")}{t("brandAccent")}</b></div>
          <p className="text-sm text-white/55">{t("footerText")}</p>
        </div>
      </footer>

      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="max-w-lg rounded-[1.5rem]">
          <DialogHeader><DialogTitle>发布救助动态</DialogTitle><DialogDescription>分享真实进展，帮助更多人了解和参与。</DialogDescription></DialogHeader>
          <form onSubmit={submitPost} className="space-y-4">
            <Input name="title" required maxLength={80} placeholder="给动态起个标题" />
            <Textarea name="content" required maxLength={800} rows={5} placeholder="发生了什么？目前需要哪些帮助？" />
            <label className="block rounded-xl border border-dashed border-[#9dcfce] bg-[#f2fbfa] p-4 text-sm text-[#4e7076]">
              <span className="mb-2 block font-medium text-[#176b6d]">上传现场图片（选填，最大 8MB）</span>
              <Input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="bg-white" />
            </label>
            <select name="category" className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
              <option>救助日记</option><option>领养故事</option><option>救助经验</option><option>活动现场</option>
            </select>
            <Button type="submit" disabled={uploading} className="w-full bg-[#008f91] hover:bg-[#007b7d]">{uploading ? "正在上传…" : "提交审核"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent className="max-w-lg rounded-[1.5rem]">
          <DialogHeader><DialogTitle>发起公益活动</DialogTitle><DialogDescription>把时间、地点和内容写清楚，邀请大家一起行动。</DialogDescription></DialogHeader>
          <form onSubmit={submitActivity} className="space-y-4">
            <Input name="title" required maxLength={80} placeholder="活动名称" />
            <Textarea name="description" required maxLength={500} rows={4} placeholder="活动内容与参与须知" />
            <Input name="location" required maxLength={100} placeholder="城市 · 详细地点" />
            <div className="grid grid-cols-2 gap-3">
              <Input name="eventDate" type="datetime-local" required />
              <Input name="capacity" type="number" min="2" max="500" defaultValue="20" required />
            </div>
            <Button type="submit" className="w-full bg-[#008f91] hover:bg-[#007b7d]">提交审核</Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
