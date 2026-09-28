"use server";

import { createHash, randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MIME_BY_EXTENSION,
} from "@/lib/documents/constants";
import { processDocument } from "@/lib/documents/process-document";
import { getActiveWorkspace } from "@/lib/workspaces/server";

const MAX_BYTES = 10 * 1024 * 1024;

export type UploadDocumentResult =
  | { ok: true }
  | {
      ok: false;
      kind:
        | "unauthenticated"
        | "no_workspace"
        | "validation"
        | "duplicate"
        | "storage"
        | "database"
        | "processing";
      message: string;
    };

function sanitizeStorageFilename(originalName: string): string {
  let name = originalName.replace(/[/\\]/g, "").replace(/\.\./g, "").trim();
  const lastSegment = name.split(/[/\\]/).pop() ?? name;
  name = lastSegment.replace(/\.\./g, "").trim();
  if (!name || name === "." || name === "..") {
    return "upload.bin";
  }
  return name;
}

function resolveAllowedMimeType(file: File): string | null {
  if (ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) {
    return file.type;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  const inferred = MIME_BY_EXTENSION[ext];
  return inferred && ALLOWED_DOCUMENT_MIME_TYPES.has(inferred) ? inferred : null;
}

export async function uploadDocument(
  formData: FormData,
): Promise<UploadDocumentResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      kind: "unauthenticated",
      message: "You must be signed in to upload documents.",
    };
  }

  const active = await getActiveWorkspace();
  if (!active.ok) {
    return {
      ok: false,
      kind: "no_workspace",
      message:
        active.kind === "no_workspaces"
          ? "Create or select a workspace before uploading."
          : "Could not resolve your active workspace.",
    };
  }

  const workspaceId = active.context.workspaceId;

  const entry = formData.get("file");
  if (!(entry instanceof File)) {
    return {
      ok: false,
      kind: "validation",
      message: "Choose a file to upload.",
    };
  }

  const file = entry;
  if (file.size === 0) {
    return {
      ok: false,
      kind: "validation",
      message: "The selected file is empty.",
    };
  }

  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      kind: "validation",
      message: "File must be 10 MB or smaller.",
    };
  }

  const mimeType = resolveAllowedMimeType(file);
  if (!mimeType) {
    return {
      ok: false,
      kind: "validation",
      message: "Only PDF, DOCX, TXT, and Markdown files are allowed.",
    };
  }

  const fileBytes = Buffer.from(await file.arrayBuffer());
  const contentHash = createHash("sha256").update(fileBytes).digest("hex");

  const { data: existing } = await supabase
    .from("documents")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      kind: "duplicate",
      message: "This document has already been uploaded to this workspace.",
    };
  }

  const documentId = randomUUID();
  const safeFilename = sanitizeStorageFilename(file.name);
  const storagePath = `${workspaceId}/${documentId}/${safeFilename}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, fileBytes, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error("uploadDocument storage:", uploadError.message);
    return {
      ok: false,
      kind: "storage",
      message: uploadError.message || "Failed to upload file to storage.",
    };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    id: documentId,
    workspace_id: workspaceId,
    created_by: user.id,
    file_name: file.name,
    storage_path: storagePath,
    mime_type: mimeType,
    size_bytes: file.size,
    content_hash: contentHash,
    status: "processing",
    error_message: null,
  });

  if (insertError) {
    console.error("uploadDocument insert:", insertError.message);
    await supabase.storage.from("documents").remove([storagePath]);
    return {
      ok: false,
      kind: "database",
      message: insertError.message || "Failed to save document metadata.",
    };
  }

  const processing = await processDocument(supabase, {
    documentId,
    workspaceId,
  });

  if (!processing.ok) {
    revalidatePath("/documents");
    return {
      ok: false,
      kind: "processing",
      message: processing.message,
    };
  }

  revalidatePath("/documents");
  return { ok: true };
}

export type DeleteDocumentResult =
  | { ok: true }
  | {
      ok: false;
      kind:
        | "unauthenticated"
        | "no_workspace"
        | "not_found"
        | "storage"
        | "database";
      message: string;
    };

export async function deleteDocument(
  documentId: string,
): Promise<DeleteDocumentResult> {
  const trimmedId = documentId.trim();
  if (!trimmedId) {
    return { ok: false, kind: "not_found", message: "Document not found." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      kind: "unauthenticated",
      message: "You must be signed in to delete documents.",
    };
  }

  const active = await getActiveWorkspace();
  if (!active.ok) {
    return {
      ok: false,
      kind: "no_workspace",
      message: "Could not resolve your active workspace.",
    };
  }

  const workspaceId = active.context.workspaceId;

  const { data: doc, error: loadError } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", trimmedId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (loadError) {
    console.error("deleteDocument load:", loadError.message);
    return {
      ok: false,
      kind: "database",
      message: "Could not delete this document. Please try again.",
    };
  }

  if (!doc) {
    return { ok: false, kind: "not_found", message: "Document not found." };
  }

  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([doc.storage_path]);

  if (storageError) {
    console.error("deleteDocument storage:", storageError.message);
    return {
      ok: false,
      kind: "storage",
      message: "Could not remove the file from storage. The document was not deleted.",
    };
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", trimmedId)
    .eq("workspace_id", workspaceId);

  if (deleteError) {
    console.error("deleteDocument database:", deleteError.message);
    return {
      ok: false,
      kind: "database",
      message: "Could not delete document metadata. Please try again.",
    };
  }

  revalidatePath("/documents");
  return { ok: true };
}
