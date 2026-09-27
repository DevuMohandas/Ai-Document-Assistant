"use client";

import { useRouter } from "next/navigation";
import { NewWorkspaceButton } from "@/components/new-workspace-button";
import { useWorkspaces } from "@/components/workspace-provider";

type WorkspaceSwitcherProps = {
  className?: string;
  id?: string;
};

export function WorkspaceSwitcher({ className, id }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId } =
    useWorkspaces();

  if (workspaces.length === 0) {
    return (
      <NewWorkspaceButton
        id={id}
        className={`${className ?? ""} cursor-pointer font-medium text-zinc-900 hover:bg-zinc-100`}
      />
    );
  }

  return (
    <select
      id={id}
      className={className}
      value={activeWorkspaceId ?? workspaces[0].id}
      aria-label="Active workspace"
      onChange={async (e) => {
        const nextId = e.target.value;
        await setActiveWorkspaceId(nextId);
        router.refresh();
      }}
    >
      {workspaces.map((ws) => (
        <option key={ws.id} value={ws.id}>
          {ws.name}
        </option>
      ))}
    </select>
  );
}
