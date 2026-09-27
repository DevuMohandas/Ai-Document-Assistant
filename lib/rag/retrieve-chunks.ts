import "server-only";

/**
 * Manual workspace isolation check (after supabase db push):
 * 1. Workspace A: upload text "Project Phoenix launch date is 17 March 2027." (Ready).
 * 2. Workspace B: upload unrelated content.
 * 3. Active A → testRetrieveRelevantChunks("When is Project Phoenix launching?") → A chunk, workspaceId = A.
 * 4. Active B → same query → no A content; all chunk workspaceIds = B if any.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateQueryEmbedding } from "@/lib/ai/embeddings";
import type { RetrieveRelevantChunksResult, RetrievedChunk } from "@/lib/rag/types";

/** Default top-k for retrieval; adjust when wiring RAG chat. */
export const DEFAULT_MATCH_COUNT = 5;

/** Initial tuning value — not final; raise after inspecting real similarity scores. */
export const DEFAULT_MATCH_THRESHOLD = 0.5;

type MatchDocumentChunksRow = {
  id: string;
  document_id: string;
  workspace_id: string;
  content: string;
  chunk_index: number;
  metadata: Record<string, unknown> | null;
  similarity: number;
};

export type RetrieveRelevantChunksParams = {
  supabase: SupabaseClient;
  workspaceId: string;
  query: string;
  matchCount?: number;
  threshold?: number;
};

function mapRow(row: MatchDocumentChunksRow): RetrievedChunk {
  return {
    id: row.id,
    documentId: row.document_id,
    workspaceId: row.workspace_id,
    content: row.content,
    chunkIndex: row.chunk_index,
    metadata: row.metadata ?? {},
    similarity: row.similarity,
  };
}

export async function retrieveRelevantChunks(
  params: RetrieveRelevantChunksParams,
): Promise<RetrieveRelevantChunksResult> {
  const trimmed = params.query.trim();
  if (!trimmed) {
    return { ok: false, message: "Search query must not be empty." };
  }

  const matchCount = params.matchCount ?? DEFAULT_MATCH_COUNT;
  const threshold = params.threshold ?? DEFAULT_MATCH_THRESHOLD;

  try {
    const queryEmbedding = await generateQueryEmbedding(trimmed);

    const { data, error } = await params.supabase.rpc("match_document_chunks", {
      target_workspace_id: params.workspaceId,
      query_embedding: queryEmbedding,
      match_count: matchCount,
      match_threshold: threshold,
    });

    if (error) {
      console.error("retrieveRelevantChunks rpc:", error.message);
      return {
        ok: false,
        message: "Vector search failed. Please try again.",
      };
    }

    const rows = (data ?? []) as MatchDocumentChunksRow[];
    return { ok: true, chunks: rows.map(mapRow) };
  } catch (err) {
    console.error("retrieveRelevantChunks:", err);
    const message =
      err instanceof Error && err.message.includes("GEMINI_API_KEY")
        ? "Embedding service is not configured."
        : "Could not search document chunks. Please try again.";
    return { ok: false, message };
  }
}
