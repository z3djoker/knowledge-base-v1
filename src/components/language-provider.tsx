"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  defaultLocale,
  dictionaries,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  dictionary: Dictionary;
  setLocale: (locale: Locale) => void;
};

const storageKey = "knowledge-base-locale";
const localeChangeEvent = "knowledge-base-locale-change";
const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "zh";
}

function getStoredLocale() {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  const savedLocale = window.localStorage.getItem(storageKey);

  if (isLocale(savedLocale)) {
    return savedLocale;
  }

  if (window.navigator.language.toLowerCase().startsWith("zh")) {
    return "zh";
  }

  return defaultLocale;
}

function subscribeToLocaleChange(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(localeChangeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(localeChangeEvent, callback);
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToLocaleChange,
    getStoredLocale,
    () => defaultLocale,
  );

  function setLocale(nextLocale: Locale) {
    window.localStorage.setItem(storageKey, nextLocale);
    window.dispatchEvent(new Event(localeChangeEvent));
  }

  const value = useMemo(
    () => ({
      locale,
      dictionary: dictionaries[locale],
      setLocale,
    }),
    [locale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }

  return context;
}
