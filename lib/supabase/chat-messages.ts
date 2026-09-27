import type { SupabaseClient } from "@supabase/supabase-js";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createdAt: string;
};

export type WorkspaceChatMessagesResult =
  | { messages: ChatMessage[]; error: null }
  | { messages: ChatMessage[]; error: string };

type ChatMessageRow = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export async function getWorkspaceChatMessages(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<WorkspaceChatMessagesResult> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getWorkspaceChatMessages:", error.message);
    return { messages: [], error: error.message };
  }

  const messages = ((data ?? []) as ChatMessageRow[]).map((row) => ({
    id: row.id,
    role: row.role as ChatMessage["role"],
    content: row.content,
    createdAt: row.created_at,
  }));

  return { messages, error: null };
}
