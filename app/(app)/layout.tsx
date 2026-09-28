import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WorkspaceProvider } from "@/components/workspace-provider";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaces } from "@/lib/supabase/workspaces";
import {
  ACTIVE_WORKSPACE_COOKIE,
  resolveActiveWorkspaceId,
} from "@/lib/workspaces/active-workspace";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { workspaces } = await getUserWorkspaces(supabase, user.id);
  const cookieStore = await cookies();
  const activeWorkspaceId = resolveActiveWorkspaceId(
    workspaces,
    cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value,
  );

  return (
    <WorkspaceProvider
      workspaces={workspaces}
      activeWorkspaceId={activeWorkspaceId}
    >
      {children}
    </WorkspaceProvider>
  );
}
