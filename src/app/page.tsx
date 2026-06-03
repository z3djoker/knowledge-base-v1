"use client";

import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { useLanguage } from "@/components/language-provider";

export default function Home() {
  const { dictionary } = useLanguage();

  return (
    <SiteShell>
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
            {dictionary.home.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 md:text-6xl">
            {dictionary.home.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            {dictionary.home.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/upload"
              className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {dictionary.home.addFiles}
            </Link>
            <Link
              href="/chat"
              className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              {dictionary.home.openChat}
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <div>
            <p className="text-sm font-medium text-cyan-200">
              {dictionary.home.statusLabel}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {dictionary.home.statusTitle}
            </h2>
          </div>
          <div className="grid gap-3">
            {dictionary.home.readinessItems.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="text-sm text-slate-100">{item}</span>
                <span className="text-xs font-semibold uppercase text-emerald-300">
                  {dictionary.home.ready}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {dictionary.home.modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold">{module.title}</h2>
              <span className="rounded-md bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                {module.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {module.description}
            </p>
          </Link>
        ))}
      </section>
    </SiteShell>
  );
}
