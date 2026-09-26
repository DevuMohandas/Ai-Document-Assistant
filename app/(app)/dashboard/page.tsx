import { AppShell } from "@/components/app-shell";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export default function DashboardPage() {
  return (
    <AppShell
      title="Chat"
      description="Ask questions grounded in this workspace’s documents."
    >
      <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-4xl flex-col gap-4">
        <PlaceholderPanel heading="Conversation (placeholder)">
          <p>
            Chat messages, citations, and streaming replies will live here.
            Sample thread:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="text-zinc-900">You:</span> What is our refund
              policy?
            </li>
            <li>
              <span className="text-zinc-900">Assistant:</span> According to{" "}
              <em>policy-handbook.pdf</em>… (citation chips TBD)
            </li>
          </ul>
        </PlaceholderPanel>

        <div className="mt-auto rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-input"
            rows={2}
            readOnly
            placeholder="Type a question about your documents…"
            className="w-full resize-none rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled
              className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500"
            >
              Send (disabled)
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
