const CHUNK_MAX_CHARS = 1200;
const CHUNK_OVERLAP_CHARS = 200;

/**
 * Splits plain text into ordered chunks for RAG ingestion.
 * Fixed max size with overlap; prefers breaking at paragraph/newline/space boundaries.
 */
export function chunkText(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < trimmed.length) {
    let end = Math.min(start + CHUNK_MAX_CHARS, trimmed.length);

    if (end < trimmed.length) {
      const slice = trimmed.slice(start, end);
      const lastParagraph = slice.lastIndexOf("\n\n");
      const lastLine = slice.lastIndexOf("\n");
      const lastSpace = slice.lastIndexOf(" ");
      const breakAt = Math.max(lastParagraph, lastLine, lastSpace);
      if (breakAt > CHUNK_MAX_CHARS * 0.4) {
        end = start + breakAt;
        if (lastParagraph === breakAt) end += 2;
        else if (lastLine === breakAt || lastSpace === breakAt) end += 1;
      }
    }

    const chunk = trimmed.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= trimmed.length) break;

    const nextStart = end - CHUNK_OVERLAP_CHARS;
    start = nextStart > start ? nextStart : end;
  }

  return chunks;
}
