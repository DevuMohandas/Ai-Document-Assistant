"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/workspaces/active-workspace";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const WORKSPACE_NAME_MAX = 100;

export type CreateWorkspaceResult =
  | { ok: true; workspaceId: string }
  | { ok: false; error: string };

export async function setActiveWorkspace(workspaceId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    path: "/",
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
  });
}

export async function createWorkspace(
  name: string,
): Promise<CreateWorkspaceResult> {
  const trimmed = name.trim();
  if (trimmed.length < 1) {
    return { ok: false, error: "Workspace name is required." };
  }
  if (trimmed.length > WORKSPACE_NAME_MAX) {
    return {
      ok: false,
      error: `Name must be at most ${WORKSPACE_NAME_MAX} characters.`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "You must be signed in to create a workspace." };
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({ name: trimmed, owner_id: user.id })
    .select("id")
    .single();

  if (workspaceError || !workspace) {
    console.error("createWorkspace:", workspaceError?.message);
    return {
      ok: false,
      error: workspaceError?.message ?? "Failed to create workspace.",
    };
  }

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    console.error("createWorkspace member:", memberError.message);
    await supabase.from("workspaces").delete().eq("id", workspace.id);
    return { ok: false, error: memberError.message };
  }

  await setActiveWorkspace(workspace.id);
  return { ok: true, workspaceId: workspace.id };
}
