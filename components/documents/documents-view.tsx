"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { deleteDocument, uploadDocument } from "@/app/(app)/documents/actions";
import { ConfirmModal } from "@/components/confirm-modal";
import type {
  DocumentStatus,
  WorkspaceDocument,
} from "@/lib/types/documents";

function statusStyles(status: DocumentStatus): string {
  switch (status) {
    case "Ready":
      return "bg-emerald-50 text-emerald-800";
    case "Processing":
      return "bg-amber-50 text-amber-800";
    case "Uploading":
      return "bg-sky-50 text-sky-800";
    case "Failed":
      return "bg-red-50 text-red-800";
  }
}

type DocumentsViewProps = {
  activeWorkspaceName: string;
  initialDocuments: WorkspaceDocument[];
  uploadEnabled?: boolean;
  onDeleteDocument?: (id: string) => void | Promise<void>;
  onViewDocument?: (id: string) => void;
};

export function DocumentsView({
  activeWorkspaceName,
  initialDocuments,
  uploadEnabled = true,
  onDeleteDocument,
  onViewDocument,
}: DocumentsViewProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WorkspaceDocument | null>(
    null,
  );
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error" | "duplicate";
    message: string;
  } | null>(null);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!uploadEnabled || isUploading) return;

      setIsUploading(true);
      setFeedback(null);

      const formData = new FormData();
      formData.set("file", file);

      try {
        const result = await uploadDocument(formData);
        if (result.ok) {
          setFeedback({
            tone: "success",
            message: "Document uploaded and text extracted successfully.",
          });
          router.refresh();
        } else if (result.kind === "duplicate") {
          setFeedback({ tone: "duplicate", message: result.message });
        } else {
          setFeedback({ tone: "error", message: result.message });
          if (result.kind === "processing") {
            router.refresh();
          }
        }
      } catch {
        setFeedback({
          tone: "error",
          message: "Upload failed. Please try again.",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [isUploading, router, uploadEnabled],
  );

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!uploadEnabled || !fileList?.length || isUploading) return;
      void uploadFile(fileList[0]);
    },
    [isUploading, uploadEnabled, uploadFile],
  );

  const requestDelete = useCallback(
    (doc: WorkspaceDocument) => {
      if (onDeleteDocument) {
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        void onDeleteDocument(doc.id);
        return;
      }
      setPendingDelete(doc);
    },
    [onDeleteDocument],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;

    const doc = pendingDelete;
    setDeletingId(doc.id);
    setFeedback(null);

    try {
      const result = await deleteDocument(doc.id);
      if (result.ok) {
        setPendingDelete(null);
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        router.refresh();
      } else {
        setFeedback({ tone: "error", message: result.message });
      }
    } catch {
      setFeedback({
        tone: "error",
        message: "Delete failed. Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  }, [pendingDelete, router]);

  return (
    <>
      <ConfirmModal
        open={pendingDelete !== null}
        title="Delete document?"
        description={
          pendingDelete
            ? `"${pendingDelete.fileName}" will be permanently removed, including the file in storage and all indexed chunks.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deletingId !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />

      <div className="mx-auto max-w-5xl space-y-6">
      <p className="text-sm text-zinc-600">
        Workspace:{" "}
        <span className="font-medium text-zinc-900">{activeWorkspaceName}</span>
      </p>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.markdown,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          disabled={!uploadEnabled || isUploading}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={!uploadEnabled || isUploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? "Uploading and processing…" : "Upload Document"}
        </button>
      </div>

      {feedback ? (
        <p
          className={`text-sm ${
            feedback.tone === "success"
              ? "text-emerald-700"
              : feedback.tone === "duplicate"
                ? "text-amber-800"
                : "text-red-600"
          }`}
          role="alert"
        >
          {feedback.message}
        </p>
      ) : null}

      <div
        role={uploadEnabled ? "button" : undefined}
        tabIndex={uploadEnabled ? 0 : undefined}
        onKeyDown={(e) => {
          if (!uploadEnabled) return;
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragEnter={(e) => {
          if (!uploadEnabled || isUploading) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          if (!uploadEnabled || isUploading) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          if (!uploadEnabled) return;
          e.preventDefault();
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setIsDragging(false);
        }}
        onDrop={(e) => {
          if (!uploadEnabled || isUploading) return;
          e.preventDefault();
          setIsDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => {
          if (uploadEnabled && !isUploading) inputRef.current?.click();
        }}
        className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          uploadEnabled && !isUploading ? "cursor-pointer" : "cursor-default"
        } ${
          isUploading ? "pointer-events-none opacity-60" : ""
        } ${
          isDragging
            ? "border-zinc-900 bg-zinc-100"
            : "border-zinc-200 bg-white hover:border-zinc-300"
        }`}
      >
        <p className="text-sm font-medium text-zinc-900">
          Drag and drop files here
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          or click to browse — PDF, DOCX, TXT, and Markdown
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">File name</th>
              <th className="px-4 py-3 font-medium">File type</th>
              <th className="px-4 py-3 font-medium">Upload date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  No documents yet. Upload files for this workspace.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="border-b border-zinc-50 last:border-0">
                  <td className="px-4 py-3 text-zinc-900">{doc.fileName}</td>
                  <td className="px-4 py-3 text-zinc-600">{doc.fileType}</td>
                  <td className="px-4 py-3 text-zinc-600">{doc.uploadedAt}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles(doc.status)}`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          onViewDocument
                            ? onViewDocument(doc.id)
                            : undefined
                        }
                        className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        disabled={
                          isUploading ||
                          deletingId === doc.id ||
                          Boolean(deletingId)
                        }
                        onClick={() => requestDelete(doc)}
                        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deletingId === doc.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}
