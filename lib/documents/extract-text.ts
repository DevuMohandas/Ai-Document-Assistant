import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MIN_MEANINGFUL_TEXT_CHARS,
} from "@/lib/documents/constants";

export class ExtractTextError extends Error {
  readonly userMessage: string;

  constructor(userMessage: string, cause?: unknown) {
    super(userMessage);
    this.name = "ExtractTextError";
    this.userMessage = userMessage;
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}

export function normalizeExtractedText(raw: string): string {
  let text = raw.replace(/\uFEFF/g, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const paragraphs = text
    .split(/\n\n+/)
    .map((p) =>
      p
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .trim(),
    )
    .filter(Boolean);

  return paragraphs.join("\n\n").trim();
}

function assertMeaningfulText(text: string): void {
  const nonWhitespace = text.replace(/\s/g, "").length;
  if (nonWhitespace < MIN_MEANINGFUL_TEXT_CHARS) {
    throw new ExtractTextError(
      "No meaningful text could be extracted from this document.",
    );
  }
}

async function extractPlainText(bytes: Buffer): Promise<string> {
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  return normalizeExtractedText(decoded);
}

async function extractMarkdown(bytes: Buffer): Promise<string> {
  return extractPlainText(bytes);
}

async function extractDocx(bytes: Buffer): Promise<string> {
  try {
    const { value, messages } = await mammoth.extractRawText({ buffer: bytes });
    if (messages.length > 0) {
      console.warn("extractDocx mammoth messages:", messages);
    }
    return normalizeExtractedText(value);
  } catch (err) {
    console.error("extractDocx:", err);
    throw new ExtractTextError(
      "Could not extract text from this Word document.",
      err,
    );
  }
}

async function extractPdf(bytes: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  try {
    const result = await parser.getText();
    return normalizeExtractedText(result.text ?? "");
  } catch (err) {
    console.error("extractPdf:", err);
    throw new ExtractTextError("Could not extract text from this PDF.", err);
  } finally {
    await parser.destroy();
  }
}

export async function extractTextFromBytes(
  mimeType: string,
  bytes: Buffer,
): Promise<string> {
  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(mimeType)) {
    throw new ExtractTextError("Unsupported document type for text extraction.");
  }

  let text: string;
  switch (mimeType) {
    case "text/plain":
      text = await extractPlainText(bytes);
      break;
    case "text/markdown":
      text = await extractMarkdown(bytes);
      break;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      text = await extractDocx(bytes);
      break;
    case "application/pdf":
      text = await extractPdf(bytes);
      break;
    default:
      throw new ExtractTextError("Unsupported document type for text extraction.");
  }

  assertMeaningfulText(text);
  return text;
}
