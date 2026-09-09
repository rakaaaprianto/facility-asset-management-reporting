"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Locale, Dictionary } from "./types";
import { getDictionary } from "./index";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
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

  useEffect(() => {
    // Check localStorage fallback on client mount if cookie wasn't set
    const saved = localStorage.getItem("app_locale") as Locale | null;
    if (saved && (saved === "id" || saved === "en") && saved !== locale) {
      setLocaleState(saved);
      document.cookie = `app_locale=${saved}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("app_locale", newLocale);
    document.cookie = `app_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const t = getDictionary(locale);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      locale: "id" as Locale,
      setLocale: () => {},
      t: getDictionary("id"),
    };
  }
  return context;
}
