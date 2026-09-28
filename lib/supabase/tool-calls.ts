import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolActivityRow, ToolCallStatus } from "@/lib/types/tool-activity";

type ToolCallRow = {
  id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  status: string;
  error_message: string | null;
  created_at: string;
};

export type WorkspaceToolCallsResult =
  | { rows: ToolActivityRow[]; error: null }
  | { rows: ToolActivityRow[]; error: string };

function mapStatus(dbStatus: string): ToolCallStatus {
  switch (dbStatus) {
    case "success":
      return "Success";
    case "failed":
      return "Failed";
    case "pending":
    default:
      return "Pending";
  }
}

function formatOccurredAt(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function describeToolCall(row: ToolCallRow): string {
  if (row.error_message) return row.error_message;
  const args = JSON.stringify(row.arguments);
  if (args === "{}") return "—";
  return args.length > 120 ? `${args.slice(0, 117)}…` : args;
}

export async function getWorkspaceToolCalls(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<WorkspaceToolCallsResult> {
  const { data, error } = await supabase
    .from("tool_calls")
    .select("id, tool_name, arguments, status, error_message, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getWorkspaceToolCalls:", error.message);
    return { rows: [], error: error.message };
  }

  const rows = ((data ?? []) as ToolCallRow[]).map((row) => ({
    id: row.id,
    toolName: row.tool_name,
    description: describeToolCall(row),
    occurredAt: formatOccurredAt(row.created_at),
    status: mapStatus(row.status),
  }));

  return { rows, error: null };
}
