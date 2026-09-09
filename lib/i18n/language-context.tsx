"use client";

import React, { createContext, useContext, useState, useEffect, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Locale, Dictionary } from "./types";
import { getDictionary } from "./index";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  isPending: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  initialLocale = "id",
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sync html lang attribute and check localStorage fallback
  useEffect(() => {
    document.documentElement.lang = locale;
    const saved = localStorage.getItem("app_locale") as Locale | null;
    if (saved && (saved === "id" || saved === "en") && saved !== locale) {
      setLocaleState(saved);
      document.cookie = `app_locale=${saved}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = saved;
      startTransition(() => {
        router.refresh();
      });
    }
  }, [locale, router]);

  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;
    setLocaleState(newLocale);
    localStorage.setItem("app_locale", newLocale);
    document.cookie = `app_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = newLocale;
    startTransition(() => {
      router.refresh();
    });
  };

  const t = getDictionary(locale);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, isPending }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      locale: "id" as Locale,
      setLocale: () => {},
      t: getDictionary("id"),
      isPending: false,
    };
  }
  return context;
}
