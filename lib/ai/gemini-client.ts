import "server-only";

import { GoogleGenAI } from "@google/genai";

export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Set it in the server environment.",
    );
  }
  return apiKey;
}

let genaiClient: GoogleGenAI | null = null;

export function getGenaiClient(): GoogleGenAI {
  if (!genaiClient) {
    genaiClient = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  }
  return genaiClient;
}
