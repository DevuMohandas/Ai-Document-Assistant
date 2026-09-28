"use client";

import { useRouter } from "next/navigation";
import type { UserWorkspace } from "@/lib/types/workspace";
import { useWorkspaces } from "@/components/workspace-provider";

type WorkspacesListProps = {
  workspaces: UserWorkspace[];
  activeWorkspaceId: string | null;
};

export function WorkspacesList({
  workspaces,
  activeWorkspaceId,
}: WorkspacesListProps) {
  const router = useRouter();
  const { setActiveWorkspaceId } = useWorkspaces();

  if (workspaces.length === 0) {
    return (
      <p className="mt-2 text-sm text-zinc-600">
        You are not a member of any workspace yet. Ask an admin to add you in{" "}
        <code className="text-xs">workspace_members</code>, or seed a workspace
        in Supabase.
      </p>
    );
  }

  return (
    <ul className="mt-2 divide-y divide-zinc-100">
      {workspaces.map((ws) => {
        const isActive = ws.id === activeWorkspaceId;
        return (
          <li
            key={ws.id}
            className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
          >
            <div>
              <p className="font-medium text-zinc-900">
                {ws.name}
                {isActive ? (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    Active
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-zinc-500 capitalize">Role: {ws.role}</p>
            </div>
            {isActive ? (
              <span className="text-sm text-zinc-400">Current</span>
            ) : (
              <button
                type="button"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                onClick={async () => {
                  await setActiveWorkspaceId(ws.id);
                  router.refresh();
                }}
              >
                Switch
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
