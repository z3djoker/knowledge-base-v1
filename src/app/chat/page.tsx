import { SiteShell } from "@/components/site-shell";

const sampleMessages = [
  {
    role: "System",
    body: "Chat interface placeholder. Retrieval and AI responses are not wired yet.",
  },
  {
    role: "User",
    body: "Where will answers from uploaded documents appear?",
  },
];

export default function ChatPage() {
  return (
    <SiteShell>
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
            Chat
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Ask the knowledge base
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            The chat page is ready for the future retrieval and AI layer. For
            now, it only shows the planned conversation layout.
          </p>
        </div>

        <div className="grid min-h-[520px] gap-0 lg:grid-cols-[280px_1fr]">
          <aside className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
            <h2 className="text-sm font-semibold text-slate-900">Sessions</h2>
            <div className="mt-4 rounded-md bg-slate-100 p-3 text-sm text-slate-600">
              New conversation
            </div>
          </aside>
          <div className="flex flex-col">
            <div className="flex-1 space-y-4 p-5">
              {sampleMessages.map((message) => (
                <div
                  key={message.role}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {message.role}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {message.body}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 p-5">
              <div className="flex gap-3">
                <input
                  disabled
                  placeholder="Chat input disabled until AI functionality is added"
                  className="min-w-0 flex-1 rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                />
                <button
                  type="button"
                  disabled
                  className="rounded-md bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

