export type DocumentStatus =
  | "Uploading"
  | "Processing"
  | "Ready"
  | "Failed";

export type WorkspaceDocument = {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  status: DocumentStatus;
};
