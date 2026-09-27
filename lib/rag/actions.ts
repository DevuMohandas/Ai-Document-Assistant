"use server";

import { createClient } from "@/lib/supabase/server";
import { generateRagAnswer } from "@/lib/rag/generate-answer";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve-chunks";
import type {
  AskQuestionResult,
  RetrievedChunk,
} from "@/lib/rag/types";
import { getActiveWorkspace } from "@/lib/workspaces/server";

export type TestRetrieveRelevantChunksResult =
  | {
      ok: true;
      workspaceId: string;
      workspaceName: string;
      chunks: RetrievedChunk[];
    }
  | { ok: false; message: string };

/**
 * Dev/manual verification: embeds the query and runs workspace-scoped RPC search.
 * Client must send only the question text — workspace comes from getActiveWorkspace().
 */
export async function testRetrieveRelevantChunks(
  query: string,
): Promise<TestRetrieveRelevantChunksResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "You must be signed in." };
  }

  const active = await getActiveWorkspace();
  if (!active.ok) {
    return {
      ok: false,
      message: "Could not resolve your active workspace.",
    };
  }

  const result = await retrieveRelevantChunks({
    supabase,
    workspaceId: active.context.workspaceId,
    query,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return {
    ok: true,
    workspaceId: active.context.workspaceId,
    workspaceName: active.context.workspaceName,
    chunks: result.chunks,
  };
}

export async function askQuestion(question: string): Promise<AskQuestionResult> {
  const trimmed = question.trim();
  if (!trimmed) {
    return { ok: false, message: "Question must not be empty." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "You must be signed in to ask questions." };
  }

  const active = await getActiveWorkspace();
  if (!active.ok) {
    return {
      ok: false,
      message: "Could not resolve your active workspace.",
    };
  }

  const result = await generateRagAnswer({
    supabase,
    workspaceId: active.context.workspaceId,
    question: trimmed,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return {
    ok: true,
    answer: result.answer,
    citations: result.citations,
  };
}
