import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { NewWorkspaceButton } from "@/components/new-workspace-button";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { WorkspacesList } from "@/components/workspaces-list";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaces } from "@/lib/supabase/workspaces";
import {
  ACTIVE_WORKSPACE_COOKIE,
  resolveActiveWorkspaceId,
} from "@/lib/workspaces/active-workspace";

export default async function WorkspacesPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { workspaces, error } = await getUserWorkspaces(supabase, user.id);
  const cookieStore = await cookies();
  const activeWorkspaceId = resolveActiveWorkspaceId(
    workspaces,
    cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value,
  );

  return (
    <AppShell
      title="Workspaces"
      description="Create and switch between isolated knowledge spaces."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-600">
            Each workspace keeps its own documents and chat history.
          </p>
          <NewWorkspaceButton
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            Could not load workspaces: {error}
          </p>
        ) : null}

        <PlaceholderPanel heading="Your workspaces">
          <WorkspacesList
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
          />
        </PlaceholderPanel>
      </div>
    </AppShell>
  );
}
