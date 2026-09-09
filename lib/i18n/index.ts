import { idDictionary } from "./dictionaries/id";
import { enDictionary } from "./dictionaries/en";
import type { Locale, Dictionary } from "./types";

export * from "./types";

export const dictionaries: Record<Locale, Dictionary> = {
  id: idDictionary,
  en: enDictionary,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.id;
}

export const MONTH_NAMES_FULL: Record<Locale, string[]> = {
  id: [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
};

export const MONTH_NAMES_SHORT: Record<Locale, string[]> = {
  id: [
    "", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ],
  en: [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ],
};

export function getMonthName(month: number, locale: Locale = "id"): string {
  const list = MONTH_NAMES_FULL[locale] ?? MONTH_NAMES_FULL.id;
  return list[month - 1] ?? "";
}

export function getShortMonthName(month: number, locale: Locale = "id"): string {
  const list = MONTH_NAMES_SHORT[locale] ?? MONTH_NAMES_SHORT.id;
  return list[month] ?? "";
}

export function getSectionTitle(key: string, defaultTitle: string, locale: Locale = "id"): string {
  const dict = getDictionary(locale);
  return dict.sections[key] || defaultTitle;
}
