"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { askQuestion } from "@/lib/rag/actions";
import type { RagCitation } from "@/lib/rag/types";
import type { ChatMessage } from "@/lib/supabase/chat-messages";
import { PlaceholderPanel } from "@/components/placeholder-panel";

const GENERIC_ERROR =
  "Something went wrong while generating the answer. Please try again.";

type LocalChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: RagCitation[];
};

type WorkspaceChatProps = {
  workspaceId: string;
  workspaceName: string;
  initialPersistedMessages?: ChatMessage[];
};

function roleLabel(role: string): string {
  switch (role) {
    case "user":
      return "You";
    case "assistant":
      return "Assistant";
    case "system":
      return "System";
    case "tool":
      return "Tool";
    default:
      return role;
  }
}

function CitationsList({ citations }: { citations: RagCitation[] }) {
  if (citations.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1 border-t border-zinc-100 pt-2">
      {citations.map((citation) => (
        <li
          key={`${citation.documentId}-${citation.chunkIndex}`}
          className="text-xs text-zinc-500"
        >
          Source: {citation.fileName} · Chunk {citation.chunkIndex}
        </li>
      ))}
    </ul>
  );
}

export function WorkspaceChat({
  workspaceId,
  workspaceName,
  initialPersistedMessages = [],
}: WorkspaceChatProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTurns, setPendingTurns] = useState<LocalChatTurn[]>([]);

  const persistedIds = useMemo(
    () => new Set(initialPersistedMessages.map((m) => m.id)),
    [initialPersistedMessages],
  );

  useEffect(() => {
    setPendingTurns((prev) =>
      prev.filter((turn) => !persistedIds.has(turn.id)),
    );
  }, [persistedIds]);

  useEffect(() => {
    setPendingTurns([]);
    setError(null);
    setInput("");
  }, [workspaceId]);

  const canSend = input.trim().length > 0 && !isSending;

  const handleSend = useCallback(async () => {
    const question = input.trim();
    if (!question || isSending) return;

    setIsSending(true);
    setError(null);
    setInput("");

    const optimisticUserId = `optimistic-user-${Date.now()}`;
    setPendingTurns([
      { id: optimisticUserId, role: "user", content: question },
    ]);

    try {
      const result = await askQuestion(question);
      if (!result.ok) {
        setError(result.message || GENERIC_ERROR);
        setPendingTurns([]);
        router.refresh();
        return;
      }

      setPendingTurns((prev) => {
        const withoutOptimistic = prev.filter((t) => t.id !== optimisticUserId);
        return [
          ...withoutOptimistic,
          {
            id: result.userMessageId,
            role: "user",
            content: question,
          },
          {
            id:
              result.assistantMessageId ??
              `assistant-pending-${result.userMessageId}`,
            role: "assistant",
            content: result.answer,
            citations: result.citations,
          },
        ];
      });
      router.refresh();
    } catch {
      setError(GENERIC_ERROR);
      setPendingTurns([]);
      router.refresh();
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, router]);

  const persistedItems = useMemo(
    () =>
      initialPersistedMessages.filter(
        (m) => m.role === "user" || m.role === "assistant",
      ),
    [initialPersistedMessages],
  );

  const visiblePending = pendingTurns.filter(
    (turn) => !persistedIds.has(turn.id),
  );

  const hasConversation =
    persistedItems.length > 0 || visiblePending.length > 0 || isSending;

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-4xl flex-col gap-4">
      <p className="text-sm text-zinc-600">
        Workspace:{" "}
        <span className="font-medium text-zinc-900">{workspaceName}</span>
      </p>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <PlaceholderPanel heading="Conversation">
        <div className="max-h-[min(24rem,50vh)] space-y-4 overflow-y-auto pr-1">
          {!hasConversation ? (
            <p className="text-sm text-zinc-600">
              Ask a question about documents in this workspace. Answers use
              retrieved excerpts from your uploaded files.
            </p>
          ) : null}

          {persistedItems.map((message) => (
            <div key={message.id} className="text-sm">
              <p className="font-medium text-zinc-900">
                {roleLabel(message.role)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-zinc-700">
                {message.content}
              </p>
              {message.role === "assistant" ? (
                <CitationsList citations={message.citations} />
              ) : null}
            </div>
          ))}

          {visiblePending.map((turn) => (
            <div key={turn.id} className="text-sm">
              <p className="font-medium text-zinc-900">
                {turn.role === "user" ? "You" : "Assistant"}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-zinc-700">
                {turn.content}
              </p>
              {turn.role === "assistant" && turn.citations ? (
                <CitationsList citations={turn.citations} />
              ) : null}
            </div>
          ))}

          {isSending ? (
            <p className="text-sm text-zinc-500">Generating answer…</p>
          ) : null}
        </div>
      </PlaceholderPanel>

      <div className="mt-auto rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-input"
          rows={2}
          value={input}
          disabled={isSending}
          placeholder="Type a question about your documents…"
          className="w-full resize-none rounded-lg border border-zinc-100 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-60"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) void handleSend();
            }
          }}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={!canSend}
            onClick={() => void handleSend()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
