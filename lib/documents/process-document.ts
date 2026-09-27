import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkText } from "@/lib/documents/chunk-text";
import {
  ExtractTextError,
  extractTextFromBytes,
} from "@/lib/documents/extract-text";

type DocumentProcessRow = {
  id: string;
  workspace_id: string;
  storage_path: string;
  mime_type: string | null;
  file_name: string;
};

export type ProcessDocumentResult =
  | { ok: true; chunkCount: number }
  | { ok: false; message: string };

const CHUNK_INSERT_BATCH = 200;

function userSafeError(err: unknown): string {
  if (err instanceof ExtractTextError) {
    return err.userMessage;
  }
  return "Document processing failed. Please try again or use a different file.";
}

async function markDocumentFailed(
  supabase: SupabaseClient,
  documentId: string,
  workspaceId: string,
  message: string,
): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update({
      status: "failed",
      error_message: message,
    })
    .eq("id", documentId)
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("markDocumentFailed:", error.message);
  }
}

async function markDocumentExtracted(
  supabase: SupabaseClient,
  documentId: string,
  workspaceId: string,
): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update({
      status: "processing",
      error_message: null,
    })
    .eq("id", documentId)
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("markDocumentExtracted:", error.message);
    throw error;
  }
}

export async function processDocument(
  supabase: SupabaseClient,
  params: { documentId: string; workspaceId: string },
): Promise<ProcessDocumentResult> {
  const { documentId, workspaceId } = params;

  const { data: doc, error: loadError } = await supabase
    .from("documents")
    .select("id, workspace_id, storage_path, mime_type, file_name")
    .eq("id", documentId)
    .eq("workspace_id", workspaceId)
    .single();

  if (loadError || !doc) {
    console.error("processDocument load:", loadError?.message);
    return { ok: false, message: "Document not found or access denied." };
  }

  const row = doc as DocumentProcessRow;
  if (!row.mime_type) {
    const message = "Document is missing a file type and cannot be processed.";
    await markDocumentFailed(supabase, documentId, workspaceId, message);
    return { ok: false, message };
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("documents")
    .download(row.storage_path);

  if (downloadError || !fileBlob) {
    console.error("processDocument download:", downloadError?.message);
    const message = "Could not read the uploaded file from storage.";
    await markDocumentFailed(supabase, documentId, workspaceId, message);
    return { ok: false, message };
  }

  try {
    const bytes = Buffer.from(await fileBlob.arrayBuffer());
    const text = await extractTextFromBytes(row.mime_type, bytes);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      throw new ExtractTextError(
        "No meaningful text could be extracted from this document.",
      );
    }

    const { error: deleteError } = await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId)
      .eq("workspace_id", workspaceId);

    if (deleteError) {
      console.error("processDocument delete chunks:", deleteError.message);
      throw deleteError;
    }

    const baseMetadata = {
      file_name: row.file_name,
      mime_type: row.mime_type,
    };

    for (let i = 0; i < chunks.length; i += CHUNK_INSERT_BATCH) {
      const batch = chunks.slice(i, i + CHUNK_INSERT_BATCH).map((content, j) => ({
        workspace_id: workspaceId,
        document_id: documentId,
        content,
        chunk_index: i + j,
        metadata: {
          ...baseMetadata,
          char_length: content.length,
        },
      }));

      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(batch);

      if (insertError) {
        console.error("processDocument insert chunks:", insertError.message);
        await supabase
          .from("document_chunks")
          .delete()
          .eq("document_id", documentId)
          .eq("workspace_id", workspaceId);
        throw insertError;
      }
    }

    await markDocumentExtracted(supabase, documentId, workspaceId);
    return { ok: true, chunkCount: chunks.length };
  } catch (err) {
    console.error("processDocument:", err);
    const message = userSafeError(err);
    await markDocumentFailed(supabase, documentId, workspaceId, message);
    return { ok: false, message };
  }
}
