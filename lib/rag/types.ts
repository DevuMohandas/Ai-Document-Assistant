export type RetrievedChunk = {
  id: string;
  documentId: string;
  workspaceId: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, unknown>;
  similarity: number;
};

export type RetrieveRelevantChunksResult =
  | { ok: true; chunks: RetrievedChunk[] }
  | { ok: false; message: string };

export type RetrievedContextSource = {
  sourceIndex: number;
  documentId: string;
  chunkIndex: number;
  fileName?: string;
};

export type RagCitation = {
  documentId: string;
  fileName: string;
  chunkIndex: number;
};

export type RagAnswerSuccess = {
  ok: true;
  answer: string;
  citations: RagCitation[];
};

export type RagAnswerResult =
  | RagAnswerSuccess
  | { ok: false; message: string };

export type AskQuestionResult =
  | {
      ok: true;
      answer: string;
      citations: RagCitation[];
      userMessageId: string;
      assistantMessageId: string | null;
    }
  | { ok: false; message: string };
