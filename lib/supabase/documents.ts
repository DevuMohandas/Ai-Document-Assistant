import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentStatus, WorkspaceDocument } from "@/lib/types/documents";

type DocumentRow = {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
};

export type WorkspaceDocumentsResult =
  | { documents: WorkspaceDocument[]; error: null }
  | { documents: WorkspaceDocument[]; error: string };

function fileTypeFromName(name: string): string {
  const ext = name.split(".").pop()?.toUpperCase() ?? "FILE";
  return ext.length <= 5 ? ext : "FILE";
}

function mapStatus(dbStatus: string): DocumentStatus {
  switch (dbStatus) {
    case "ready":
      return "Ready";
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
    default:
      return "Processing";
  }
}

function formatUploadDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function getWorkspaceDocuments(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<WorkspaceDocumentsResult> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, status, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getWorkspaceDocuments:", error.message);
    return { documents: [], error: error.message };
  }

  const documents = ((data ?? []) as DocumentRow[]).map((row) => ({
    id: row.id,
    fileName: row.file_name,
    fileType: fileTypeFromName(row.file_name),
    uploadedAt: formatUploadDate(row.created_at),
    status: mapStatus(row.status),
  }));

  return { documents, error: null };
}
