"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/lib/workspaces/actions";

type CreateWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateWorkspaceModal({ open, onClose }: CreateWorkspaceModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      setName("");
      setError(null);
      setLoading(false);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await createWorkspace(name);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40"
      onClose={onClose}
      onCancel={onClose}
    >
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">New workspace</h2>
        <p className="mt-1 text-sm text-zinc-500">
          A separate space for documents and chat.
        </p>

        <div className="mt-5">
          <label
            htmlFor="workspace-name"
            className="block text-sm font-medium text-zinc-700"
          >
            Name <span className="text-red-600">*</span>
          </label>
          <input
            id="workspace-name"
            name="name"
            type="text"
            required
            maxLength={100}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
          />
          <p className="mt-1 text-xs text-zinc-400">1–100 characters</p>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
