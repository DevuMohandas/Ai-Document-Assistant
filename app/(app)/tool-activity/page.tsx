import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ToolActivityTable } from "@/components/tool-activity/tool-activity-table";
import { WorkspaceScopeNotice } from "@/components/workspace-scope-notice";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceToolCalls } from "@/lib/supabase/tool-calls";
import { getActiveWorkspace } from "@/lib/workspaces/server";

export default async function ToolActivityPage() {
  const active = await getActiveWorkspace();

  if (!active.ok) {
    if (active.kind === "unauthenticated") redirect("/login");
    return (
      <AppShell
        title="Tool Activity"
        description="Actions performed by the assistant in this workspace."
      >
        <WorkspaceScopeNotice
          message={
            active.kind === "no_workspaces"
              ? "Create a workspace to view tool activity."
              : "Could not load your workspace."
          }
        />
      </AppShell>
    );
  }

  const supabase = await createClient();
  const { rows, error } = await getWorkspaceToolCalls(
    supabase,
    active.context.workspaceId,
  );

  return (
    <AppShell
      title="Tool Activity"
      description="Actions performed by the assistant in this workspace."
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <p className="text-sm text-zinc-600">
          Workspace:{" "}
          <span className="font-medium text-zinc-900">
            {active.context.workspaceName}
          </span>
        </p>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            Could not load tool activity. Please try again.
          </p>
        ) : null}
        <ToolActivityTable rows={rows} />
      </div>
    </AppShell>
  );
}
