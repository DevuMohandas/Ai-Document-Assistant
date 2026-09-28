export type ToolCallStatus = "Success" | "Failed" | "Pending";

export type ToolActivityRow = {
  id: string;
  toolName: string;
  description: string;
  occurredAt: string;
  status: ToolCallStatus;
};
