import { SiteShell } from "@/components/site-shell";

export default function UploadPage() {
  return (
    <SiteShell>
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
            File upload
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Upload knowledge files
          </h1>
          <p className="mt-4 leading-7 text-slate-600">
            This page defines the upload surface for the knowledge base. Storage,
            parsing, chunking, and indexing will be added in a later phase.
          </p>
        </section>

        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex max-w-xl flex-col items-center">
            <div className="flex size-14 items-center justify-center rounded-lg bg-cyan-50 text-xl font-semibold text-cyan-700">
              +
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950">
              Drop files here
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Placeholder upload area. File selection and backend upload
              handling are intentionally not implemented yet.
            </p>
            <button
              type="button"
              disabled
              className="mt-6 rounded-md bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500"
            >
              Upload disabled
            </button>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}

