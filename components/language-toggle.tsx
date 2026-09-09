"use client";

import { useTranslation } from "@/lib/i18n/language-context";
import { Globe } from "lucide-react";

export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs font-medium shadow-xs ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLocale("id")}
        className={`flex items-center gap-1 rounded-md px-2 py-1 transition-all ${
          locale === "id"
            ? "bg-white text-slate-900 shadow-xs font-semibold"
            : "text-slate-500 hover:text-slate-800"
        }`}
        title="Bahasa Indonesia"
      >
        <span>🇮🇩</span>
        <span>ID</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`flex items-center gap-1 rounded-md px-2 py-1 transition-all ${
          locale === "en"
            ? "bg-white text-slate-900 shadow-xs font-semibold"
            : "text-slate-500 hover:text-slate-800"
        }`}
        title="English"
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
