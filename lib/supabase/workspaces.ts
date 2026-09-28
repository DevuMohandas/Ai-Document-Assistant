import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserWorkspace, WorkspaceMemberRole } from "@/lib/types/workspace";

type WorkspaceEmbed = {
  id: string;
  name: string;
  created_at: string;
};

type WorkspaceMemberRow = {
  role: string;
  workspaces: WorkspaceEmbed | WorkspaceEmbed[] | null;
};

function normalizeWorkspace(
  embed: WorkspaceEmbed | WorkspaceEmbed[] | null,
): WorkspaceEmbed | null {
  if (!embed) return null;
  return Array.isArray(embed) ? embed[0] ?? null : embed;
}

export type GetUserWorkspacesResult =
  | { workspaces: UserWorkspace[]; error: null }
  | { workspaces: UserWorkspace[]; error: string };

function parseRole(role: string): WorkspaceMemberRole {
  return role === "owner" ? "owner" : "member";
}

export async function getUserWorkspaces(
  supabase: SupabaseClient,
  userId: string,
): Promise<GetUserWorkspacesResult> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name, created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getUserWorkspaces:", error.message);
    return { workspaces: [], error: error.message };
  }

  const workspaces: UserWorkspace[] = [];
  for (const row of (data ?? []) as WorkspaceMemberRow[]) {
    const workspace = normalizeWorkspace(row.workspaces);
    if (!workspace) continue;
    workspaces.push({
      id: workspace.id,
      name: workspace.name,
      role: parseRole(row.role),
      createdAt: workspace.created_at,
    });
  }

  workspaces.sort((a, b) => a.name.localeCompare(b.name));

  return { workspaces, error: null };
}
