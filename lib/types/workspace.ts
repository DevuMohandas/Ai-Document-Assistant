export type WorkspaceMemberRole = "owner" | "member";

export type UserWorkspace = {
  id: string;
  name: string;
  role: WorkspaceMemberRole;
  createdAt: string;
};
