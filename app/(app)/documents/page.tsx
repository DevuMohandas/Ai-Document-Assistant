import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DocumentsView } from "@/components/documents/documents-view";
import { WorkspaceScopeNotice } from "@/components/workspace-scope-notice";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceDocuments } from "@/lib/supabase/documents";
import { getActiveWorkspace } from "@/lib/workspaces/server";

export default async function DocumentsPage() {
  const active = await getActiveWorkspace();

  if (!active.ok) {
    if (active.kind === "unauthenticated") redirect("/login");
    return (
      <AppShell
        title="Documents"
        description="Files ingested for the active workspace."
      >
        <WorkspaceScopeNotice
          message={
            active.kind === "no_workspaces"
              ? "Create a workspace to manage documents."
              : "Could not load your workspace."
          }
        />
      </AppShell>
    );
  }

  const supabase = await createClient();
  const { documents, error } = await getWorkspaceDocuments(
    supabase,
    active.context.workspaceId,
  );

  return (
    <AppShell
      title="Documents"
      description="Files ingested for the active workspace."
    >
      {error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          Could not load documents. Please try again.
        </p>
      ) : null}
      <DocumentsView
        activeWorkspaceName={active.context.workspaceName}
        initialDocuments={documents}
      />
    </AppShell>
  );
}
