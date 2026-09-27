import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { WorkspaceScopeNotice } from "@/components/workspace-scope-notice";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceChatMessages } from "@/lib/supabase/chat-messages";
import { getActiveWorkspace } from "@/lib/workspaces/server";

function roleLabel(role: string): string {
  switch (role) {
    case "user":
      return "You";
    case "assistant":
      return "Assistant";
    case "system":
      return "System";
    case "tool":
      return "Tool";
    default:
      return role;
  }
}

export default async function DashboardPage() {
  const active = await getActiveWorkspace();

  if (!active.ok) {
    if (active.kind === "unauthenticated") redirect("/login");
    return (
      <AppShell
        title="Chat"
        description="Ask questions grounded in this workspace’s documents."
      >
        <WorkspaceScopeNotice
          message={
            active.kind === "no_workspaces"
              ? "Create a workspace to start chatting."
              : "Could not load your workspace."
          }
        />
      </AppShell>
    );
  }

  const supabase = await createClient();
  const { messages, error } = await getWorkspaceChatMessages(
    supabase,
    active.context.workspaceId,
  );

  return (
    <AppShell
      title="Chat"
      description="Ask questions grounded in this workspace’s documents."
    >
      <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-4xl flex-col gap-4">
        <p className="text-sm text-zinc-600">
          Workspace:{" "}
          <span className="font-medium text-zinc-900">
            {active.context.workspaceName}
          </span>
        </p>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            Could not load conversation. Please try again.
          </p>
        ) : null}

        <PlaceholderPanel heading="Conversation">
          {messages.length === 0 ? (
            <p className="text-sm text-zinc-600">
              No messages yet for this workspace. Sending messages will be
              available in a later update.
            </p>
          ) : (
            <ul className="mt-1 list-disc space-y-2 pl-5 text-sm">
              {messages.map((message) => (
                <li key={message.id}>
                  <span className="font-medium text-zinc-900">
                    {roleLabel(message.role)}:
                  </span>{" "}
                  {message.content}
                </li>
              ))}
            </ul>
          )}
        </PlaceholderPanel>

        <div className="mt-auto rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-input"
            rows={2}
            placeholder="Type a question about your documents…"
            className="w-full resize-none rounded-lg border border-zinc-100 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
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
