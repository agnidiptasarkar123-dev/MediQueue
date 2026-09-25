"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type Locale = string;
type Messages = Record<string, string>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const supportedLocales = ["en", "hi", "bn", "as", "brx", "doi", "gu", "kn", "ks", "kok", "mai", "ml", "mni", "mr", "ne", "or", "pa", "sa", "sat", "sd", "ta", "te", "ur"];

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [messages, setMessages] = useState<Messages>({});

  useEffect(() => {
    const saved = localStorage.getItem("mediqueue_locale");
    if (saved && supportedLocales.includes(saved)) {
      setLocaleState(saved);
    }
  }, []);

  useEffect(() => {
    import(`../messages/${locale}.json`)
      .then((mod) => setMessages(mod.default || mod))
      .catch((err) => console.error("Failed to load locale:", locale, err));
      
    if (locale === "ur" || locale === "ks" || locale === "sd") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("mediqueue_locale", newLocale);
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    let str = messages[key] || key;
    if (variables) {
      Object.keys(variables).forEach((v) => {
        str = str.replace(`{{${v}}}`, String(variables[v]));
      });
    }
    return str;
  };

  const isRtl = typeof document !== "undefined" ? document.documentElement.dir === "rtl" : false;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRtl }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
