"use client";

import { useWorkspaces } from "@/components/workspace-provider";

type NewWorkspaceButtonProps = {
  id?: string;
  className?: string;
  children?: React.ReactNode;
};

export function NewWorkspaceButton({
  id,
  className,
  children = "New workspace",
}: NewWorkspaceButtonProps) {
  const { openCreateWorkspace } = useWorkspaces();

  return (
    <button
      type="button"
      id={id}
      onClick={openCreateWorkspace}
      className={className}
    >
      {children}
    </button>
  );
}
