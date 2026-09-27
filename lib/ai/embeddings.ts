import "server-only";

import { getGenaiClient } from "@/lib/ai/gemini-client";

const EMBEDDING_MODEL = "gemini-embedding-2";
const EMBEDDING_DIMENSION = 768;
const RETRIEVAL_DOCUMENT_TASK = "RETRIEVAL_DOCUMENT";
const RETRIEVAL_QUERY_TASK = "RETRIEVAL_QUERY";

function assertValidInput(text: string): string {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("Embedding input text must not be empty.");
  }

  return trimmed;
}

function assertValidEmbedding(values: unknown): number[] {
  if (!Array.isArray(values)) {
    throw new Error("Gemini embedding response did not include a numeric vector.");
  }
  if (values.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Expected embedding length ${EMBEDDING_DIMENSION}, got ${values.length}.`,
    );
  }
  for (const value of values) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error("Gemini embedding response contained invalid numeric values.");
    }
  }
  return values;
}

async function embedWithTaskType(
  text: string,
  taskType: string,
): Promise<number[]> {
  const content = assertValidInput(text);
  const ai = getGenaiClient();

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: content,
    config: {
      taskType,
      outputDimensionality: EMBEDDING_DIMENSION,
    },
  });

  const values = response.embeddings?.[0]?.values;
  if (!values) {
    throw new Error("Gemini embedding response did not include embedding values.");
  }

  return assertValidEmbedding(values);
}

/**
 * Document chunk ingestion — Gemini RETRIEVAL_DOCUMENT, 768 dims.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  return embedWithTaskType(text, RETRIEVAL_DOCUMENT_TASK);
}

/**
 * User search queries — Gemini RETRIEVAL_QUERY, 768 dims. Not persisted.
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  return embedWithTaskType(text, RETRIEVAL_QUERY_TASK);
}
