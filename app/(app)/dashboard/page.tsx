import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { WorkspaceChat } from "@/components/chat/workspace-chat";
import { WorkspaceScopeNotice } from "@/components/workspace-scope-notice";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceChatMessages } from "@/lib/supabase/chat-messages";
import { getActiveWorkspace } from "@/lib/workspaces/server";

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
      {error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          Could not load earlier messages. You can still ask new questions below.
        </p>
      ) : null}
      <WorkspaceChat
        workspaceName={active.context.workspaceName}
        initialPersistedMessages={messages}
      />
    </AppShell>
  );
}
