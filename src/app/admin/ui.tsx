"use client";

import { useLanguage } from "@/components/language-provider";

export function AdminIntro() {
  const { dictionary } = useLanguage();

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
        {dictionary.admin.eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        {dictionary.admin.title}
      </h1>
      <p className="mt-4 max-w-3xl leading-7 text-slate-600">
        {dictionary.admin.description}
      </p>
    </section>
  );
}
