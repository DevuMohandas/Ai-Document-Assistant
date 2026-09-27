import type { UserWorkspace } from "@/lib/types/workspace";

export const ACTIVE_WORKSPACE_COOKIE = "active_workspace_id";

export function resolveActiveWorkspaceId(
  workspaces: UserWorkspace[],
  cookieValue: string | undefined,
): string | null {
  if (workspaces.length === 0) return null;
  if (cookieValue && workspaces.some((w) => w.id === cookieValue)) {
    return cookieValue;
  }
  return workspaces[0].id;
}
