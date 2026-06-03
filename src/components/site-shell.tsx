"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/components/language-provider";
import { navigation } from "@/lib/navigation";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  const { dictionary } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white">
              AI
            </span>
            <span>
              <span className="block text-base font-semibold">
                {dictionary.shell.brand}
              </span>
              <span className="block text-sm text-slate-500">
                {dictionary.shell.subtitle}
              </span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap gap-2 text-sm font-medium text-slate-600">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  {dictionary.shell.navigation[item.key]}
                </Link>
              ))}
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
