"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type TranslateWindow = Window & {
  google?: { translate?: { TranslateElement: new (options: Record<string, unknown>, id: string) => unknown } };
  googleTranslateElementInit?: () => void;
};

const languages = [
  { id: "zh-CN", code: "zh-CN", flag: "🇨🇳", label: "中文" },
  { id: "en-GB", code: "en", flag: "🇬🇧", label: "English (UK)" },
  { id: "en-US", code: "en", flag: "🇺🇸", label: "English (US)" },
  { id: "de", code: "de", flag: "🇩🇪", label: "Deutsch" },
  { id: "ja", code: "ja", flag: "🇯🇵", label: "日本語" },
  { id: "fr", code: "fr", flag: "🇫🇷", label: "Français" },
  { id: "ru", code: "ru", flag: "🇷🇺", label: "Русский" },
] as const;

function setTranslationCookie(code: string) {
  const value = code === "zh-CN" ? "/zh-CN/zh-CN" : `/zh-CN/${code}`;
  document.cookie = `googtrans=${value};path=/;SameSite=Lax`;
  if (location.hostname.includes(".")) document.cookie = `googtrans=${value};path=/;domain=.${location.hostname};SameSite=Lax`;
}

export function LanguageSwitcher() {
  const [selected, setSelected] = useState("zh-CN");

  useEffect(() => {
    if (!document.getElementById("google_translate_element")) {
      const host = document.createElement("div"); host.id = "google_translate_element"; host.hidden = true; document.body.appendChild(host);
    }
    const saved = localStorage.getItem("pet-site-language") ?? "zh-CN";
    queueMicrotask(() => setSelected(saved));
    const language = languages.find((item) => item.id === saved) ?? languages[0];
    setTranslationCookie(language.code);
    const translatedWindow = window as TranslateWindow;
    translatedWindow.googleTranslateElementInit = () => {
      if (!translatedWindow.google?.translate?.TranslateElement) return;
      new translatedWindow.google.translate.TranslateElement({ pageLanguage: "zh-CN", includedLanguages: "zh-CN,en,de,ja,fr,ru", autoDisplay: false }, "google_translate_element");
    };
    if (!document.querySelector("script[data-pet-translate]")) {
      const script = document.createElement("script");
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true; script.dataset.petTranslate = "true";
      document.body.appendChild(script);
    } else translatedWindow.googleTranslateElementInit();
  }, []);

  function choose(id: string, code: string) {
    localStorage.setItem("pet-site-language", id);
    setSelected(id); setTranslationCookie(code);
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select) { select.value = code; select.dispatchEvent(new Event("change")); }
    else location.reload();
  }

  const active = languages.find((item) => item.id === selected) ?? languages[0];
  return <DropdownMenu>
      <DropdownMenuTrigger asChild><button type="button" className="flex h-11 items-center gap-2 rounded-xl border border-[#d6e6e8] bg-white px-3 shadow-sm transition hover:border-[#9dcfce]" aria-label={`切换语言，当前${active.label}`}><span className="text-2xl leading-none">{active.flag}</span><ChevronDown className="size-4 text-[#58747a]" /></button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 shadow-xl">
        {languages.map((language) => <DropdownMenuItem key={language.id} onSelect={() => choose(language.id,language.code)} className="rounded-lg px-3 py-2.5"><span className="text-xl">{language.flag}</span><span>{language.label}</span>{selected===language.id&&<Check className="ml-auto size-4 text-[#008f91]" />}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>;
}
