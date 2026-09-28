import type { SupabaseClient } from "@supabase/supabase-js";
import type { RagCitation } from "@/lib/rag/types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  citations: RagCitation[];
  createdAt: string;
};

export type WorkspaceChatMessagesResult =
  | { messages: ChatMessage[]; error: null }
  | { messages: ChatMessage[]; error: string };

type ChatMessageRow = {
  id: string;
  role: string;
  content: string;
  citations: RagCitation[] | null;
  created_at: string;
};

function parseCitations(value: unknown): RagCitation[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is RagCitation =>
      item !== null &&
      typeof item === "object" &&
      typeof (item as RagCitation).documentId === "string" &&
      typeof (item as RagCitation).fileName === "string" &&
      typeof (item as RagCitation).chunkIndex === "number",
  );
}

export type InsertChatMessageResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function insertChatMessage(
  supabase: SupabaseClient,
  params: {
    workspaceId: string;
    userId: string;
    role: ChatMessage["role"];
    content: string;
    citations?: RagCitation[];
  },
): Promise<InsertChatMessageResult> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      workspace_id: params.workspaceId,
      user_id: params.userId,
      role: params.role,
      content: params.content,
      citations: params.citations ?? [],
    })
    .select("id")
    .single();

  if (error) {
    console.error("insertChatMessage:", error.message);
    return { ok: false, message: error.message };
  }

  return { ok: true, id: data.id as string };
}

export async function getWorkspaceChatMessages(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<WorkspaceChatMessagesResult> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, citations, created_at")
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
    citations: parseCitations(row.citations),
    createdAt: row.created_at,
  }));

  return { messages, error: null };
}
