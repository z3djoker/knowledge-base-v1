"use client";

import { useLanguage } from "@/components/language-provider";
import type { Locale } from "@/lib/i18n";

const options: Array<{ locale: Locale; label: string }> = [
  { locale: "en", label: "EN" },
  { locale: "zh", label: "中" },
];

export function LanguageSwitcher() {
  const { locale, dictionary, setLocale } = useLanguage();

  return (
    <div
      aria-label={dictionary.shell.languageLabel}
      className="flex rounded-md border border-slate-200 bg-slate-50 p-1"
    >
      {options.map((option) => {
        const isActive = option.locale === locale;

        return (
          <button
            key={option.locale}
            type="button"
            aria-pressed={isActive}
            onClick={() => setLocale(option.locale)}
            className={`min-w-10 rounded px-3 py-1.5 text-sm font-semibold transition ${
              isActive
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-white hover:text-slate-950"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
