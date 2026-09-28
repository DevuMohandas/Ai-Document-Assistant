import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaces } from "@/lib/supabase/workspaces";
import {
  ACTIVE_WORKSPACE_COOKIE,
  resolveActiveWorkspaceId,
} from "@/lib/workspaces/active-workspace";

export type ActiveWorkspaceContext = {
  userId: string;
  workspaceId: string;
  workspaceName: string;
};

export type GetActiveWorkspaceResult =
  | { ok: true; context: ActiveWorkspaceContext }
  | {
      ok: false;
      kind: "unauthenticated" | "no_workspaces" | "query_error";
      message?: string;
    };

export async function getActiveWorkspace(): Promise<GetActiveWorkspaceResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, kind: "unauthenticated" };
  }

  const { workspaces, error } = await getUserWorkspaces(supabase, user.id);
  if (error) {
    return { ok: false, kind: "query_error", message: error };
  }
  if (workspaces.length === 0) {
    return { ok: false, kind: "no_workspaces" };
  }

  const cookieStore = await cookies();
  const workspaceId = resolveActiveWorkspaceId(
    workspaces,
    cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value,
  );

  if (!workspaceId) {
    return { ok: false, kind: "no_workspaces" };
  }

  const active = workspaces.find((w) => w.id === workspaceId);
  if (!active) {
    return { ok: false, kind: "no_workspaces" };
  }

  return {
    ok: true,
    context: {
      userId: user.id,
      workspaceId: active.id,
      workspaceName: active.name,
    },
  };
}

export async function getActiveWorkspaceId(): Promise<string | null> {
  const result = await getActiveWorkspace();
  return result.ok ? result.context.workspaceId : null;
}
