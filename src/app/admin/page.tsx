import { SiteShell } from "@/components/site-shell";

const adminSections = [
  {
    title: "Content",
    description: "Review uploaded files, ingestion state, and source metadata.",
  },
  {
    title: "Access",
    description: "Prepare roles and permissions for future workspace controls.",
  },
  {
    title: "System",
    description: "Track configuration for indexing, retrieval, and AI providers.",
  },
];

export default function AdminPage() {
  return (
    <SiteShell>
      <section className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
          Admin
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Manage the knowledge base
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">
          Administrative screens are scaffolded for the next phase. No
          persistence, permissions, or AI provider settings are active yet.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {adminSections.map((section) => (
          <article
            key={section.title}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-slate-950">
              {section.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {section.description}
            </p>
          </article>
        ))}
      </section>
    </SiteShell>
  );
}

