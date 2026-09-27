"use client";

import { useCallback, useRef, useState } from "react";
import type {
  DocumentStatus,
  WorkspaceDocument,
} from "@/lib/types/documents";

const SEED_DOCUMENTS: WorkspaceDocument[] = [
  {
    id: "doc-1",
    fileName: "employee-handbook.pdf",
    fileType: "PDF",
    uploadedAt: "20 Sep 2026",
    status: "Ready",
  },
  {
    id: "doc-2",
    fileName: "Leave Policy.docx",
    fileType: "DOCX",
    uploadedAt: "22 Sep 2026",
    status: "Ready",
  },
  {
    id: "doc-3",
    fileName: "contract-draft.pdf",
    fileType: "PDF",
    uploadedAt: "25 Sep 2026",
    status: "Processing",
  },
];

function fileTypeFromName(name: string): string {
  const ext = name.split(".").pop()?.toUpperCase() ?? "FILE";
  return ext.length <= 5 ? ext : "FILE";
}

function formatUploadDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
  initialDocuments?: WorkspaceDocument[];
  onUploadFiles?: (files: File[]) => void | Promise<void>;
  onDeleteDocument?: (id: string) => void | Promise<void>;
  onViewDocument?: (id: string) => void;
};

export function DocumentsView({
  activeWorkspaceName,
  initialDocuments = SEED_DOCUMENTS,
  onUploadFiles,
  onDeleteDocument,
  onViewDocument,
}: DocumentsViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;

      const files = Array.from(fileList);
      const newRows: WorkspaceDocument[] = files.map((file) => ({
        id: `local-${file.name}-${file.lastModified}`,
        fileName: file.name,
        fileType: fileTypeFromName(file.name),
        uploadedAt: formatUploadDate(new Date()),
        status: "Uploading",
      }));

      setDocuments((prev) => [...newRows, ...prev]);
      void onUploadFiles?.(files);
    },
    [onUploadFiles],
  );

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    void onDeleteDocument?.(id);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <p className="text-sm text-zinc-600">
        Workspace:{" "}
        <span className="font-medium text-zinc-900">{activeWorkspaceName}</span>
      </p>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Upload Document
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
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
                        onClick={() => handleDelete(doc.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
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
  );
}
