import { useState, useCallback, createContext, useContext } from "react";
import { type Locale, type Translations, translations } from "./index";

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18nProvider() {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem("browser-sandbox-locale");
    return (saved === "zh" || saved === "en") ? saved : "zh";
  });

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem("browser-sandbox-locale", newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    handleSetLocale(locale === "zh" ? "en" : "zh");
  }, [locale, handleSetLocale]);

  const t = translations[locale];

  return { locale, t, setLocale: handleSetLocale, toggleLocale };
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
