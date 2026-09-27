"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CreateWorkspaceModal } from "@/components/create-workspace-modal";
import type { UserWorkspace } from "@/lib/types/workspace";
import { setActiveWorkspace } from "@/lib/workspaces/actions";

type WorkspaceContextValue = {
  workspaces: UserWorkspace[];
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (workspaceId: string) => Promise<void>;
  openCreateWorkspace: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

type WorkspaceProviderProps = {
  workspaces: UserWorkspace[];
  activeWorkspaceId: string | null;
  children: React.ReactNode;
};

export function WorkspaceProvider({
  workspaces,
  activeWorkspaceId,
  children,
}: WorkspaceProviderProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const openCreateWorkspace = useCallback(() => setCreateOpen(true), []);
  const closeCreateWorkspace = useCallback(() => setCreateOpen(false), []);

  async function selectWorkspace(workspaceId: string) {
    await setActiveWorkspace(workspaceId);
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspaceId,
        setActiveWorkspaceId: selectWorkspace,
        openCreateWorkspace,
      }}
    >
      {children}
      <CreateWorkspaceModal open={createOpen} onClose={closeCreateWorkspace} />
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaces() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaces must be used within WorkspaceProvider");
  }
  return context;
}
