"use client";

import { SiteShell } from "@/components/site-shell";
import { UploadForm } from "@/components/upload-form";
import { useLanguage } from "@/components/language-provider";

export default function UploadPage() {
  const { dictionary } = useLanguage();

  return (
    <SiteShell>
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
            {dictionary.upload.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            {dictionary.upload.title}
          </h1>
          <p className="mt-4 leading-7 text-slate-600">
            {dictionary.upload.description}
          </p>
        </section>

        <UploadForm />
      </div>
    </SiteShell>
  );
}
