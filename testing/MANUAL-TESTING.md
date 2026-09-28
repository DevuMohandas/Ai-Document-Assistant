# Manual testing guide

Use this checklist to verify RAG chat, tool calling, auth, and **workspace isolation** in the Multi-Workspace Document Assistant.

## Test account (throwaway)

Use a dedicated test user—not production data.

| Field | Value |
|--------|--------|
| Email | `test1@example.com` |
| Password | `testuser@123` |

1. Open `/login`.
2. Sign in with the credentials above.
3. You should land on `/dashboard` (Chat).

If sign-in fails, create this user in Supabase **Authentication → Users** (or enable email signup) with the same email and password.

---

## Sample document

A copy of the test file lives in this repo:

- **File:** [`sample-document.md`](./sample-document.md) (Lorem Ipsum overview: history, why it is used, Cicero source, 1966 standard chunk, etc.)

**Current setup:** This document has already been uploaded and processed in the app (in at least one workspace). You do not need to re-upload it for basic chat tests unless you are testing upload/processing again.

**Supported types for new uploads:** PDF, `.txt`, `.md`, `.docx` (see **Documents** in the app).

---

## Workspaces (use at least two)

Isolation only matters if you have **two or more workspaces** with **different** content.

### Suggested setup

| Workspace | Purpose | Documents |
|-----------|---------|-----------|
| **Workspace A** (e.g. `RAG Test`) | Has the Lorem sample | `sample-document.md` already uploaded here |
| **Workspace B** (e.g. `Empty Test`) | No Lorem content | No upload—or upload a **different** short file with unique facts only in B |

### Create / switch workspaces

1. Go to **Workspaces** and create **Workspace A** and **Workspace B** if they do not exist.
2. Use the workspace switcher (sidebar or mobile header) to set the **active** workspace.
3. Confirm the UI shows the correct workspace name before each test.

Upload the repo sample into **Workspace A** only if it is not already there. Keep **Workspace B** without that Lorem text (or with a distinct document).

---

## Example questions (from `sample-document.md`)

Ask these on **Chat** while **Workspace A** is active and the sample doc is processed. Answers should be grounded in the document; check **citations** when the model uses retrieved chunks.

| # | Question | What to expect (from the doc) |
|---|----------|----------------------------------|
| 1 | When did Lorem Ipsum become the standard dummy text in the printing industry? | References **1966** and Letraset / dummy sheets. |
| 2 | Why do designers use Lorem Ipsum instead of “Content here, content here”? | Readable-looking **letter distribution**; less distraction from layout. |
| 3 | What classical work is Lorem Ipsum derived from? | **Cicero**, *de Finibus Bonorum et Malorum*, sections **1.10.32** and **1.10.33** (~45 BC). |
| 4 | Who traced the source by looking up “consectetur”? | **Richard McClintock** (Latin professor, Hampden-Sydney College). |
| 5 | What is the opening line of the standard Lorem Ipsum passage? | Starts with **“Lorem ipsum dolor sit amet…”** |

**Honest “I don’t know” (optional):** With only the Lorem doc uploaded, ask something unrelated, e.g. *What is our company refund policy?* The assistant should indicate it **does not know** based on workspace documents (no invented policy).

---

## Tool calling (same active workspace)

With either workspace selected:

| Prompt | Expected behavior |
|--------|-------------------|
| `Create a task called Review contract` | Task created in **active** workspace; confirmation in chat; row on **Tool Activity**. |
| `What tasks do I have?` | Lists tasks for **active** workspace only. |

Switch workspace and run `What tasks do I have?` again—lists should **not** show tasks from the other workspace.

---

## How to test workspace isolation

Workspace isolation means: **chat, documents, RAG answers, tasks, and tool logs are scoped to the active workspace.** Nothing from Workspace B should appear when Workspace A is active.

### Quick isolation test (documents + RAG)

1. **Workspace A** — active. Ask: *Who is Richard McClintock and what did he discover about Lorem Ipsum?*  
   - Expect an answer **with citations** tied to the sample document.

2. Switch to **Workspace B** (no Lorem doc, or only a different doc). Ask the **same question**.  
   - Expect **no** Lorem-specific answer from A’s file.  
   - Expect the standard “don’t know based on documents” style reply **or** an answer only from B’s own file—**not** A’s content.

3. **Documents** page — with A active, you should see the sample upload; switch to B and confirm the list changes (B empty or shows only B’s files).

### Chat history isolation

1. In **Workspace A**, send a unique message, e.g. `MARKER-WORKSPACE-A-12345`.
2. Switch to **Workspace B**, open **Chat**.  
   - That marker message should **not** appear in B’s history.
3. Switch back to A — the marker should still be there.

### Tasks and tool activity isolation

1. In **Workspace A**: `Create a task called TASK-ONLY-IN-A`.
2. **Tool Activity** — note the `save_task` entry while A is active.
3. Switch to **Workspace B**: `What tasks do I have?`  
   - **TASK-ONLY-IN-A** must **not** be listed.
4. **Tool Activity** on B should show only tool runs executed while B was active (not A’s history mixed in).

### Active workspace is server-side

The client does not send `workspace_id` for chat or tools. Isolation depends on:

- The workspace switcher cookie / server resolution (`getActiveWorkspace`).
- Supabase **RLS** on `documents`, `document_chunks`, `chat_messages`, `tasks`, and `tool_calls`.

If isolation fails, check that you switched workspace (name in the UI) and refreshed or navigated after switching.

---

## Suggested end-to-end pass

- [ ] Login with `test1@example.com` / `testuser@123`
- [ ] At least **two** workspaces exist
- [ ] Sample doc available in **Workspace A** (already uploaded)
- [ ] RAG: 2–3 example questions above with citations in A
- [ ] RAG: same questions in B do not leak A’s content
- [ ] Upload (optional): add a unique file to B and query only B
- [ ] Tasks: create + list in A; list in B is separate
- [ ] **Tool Activity** reflects the active workspace only
- [ ] Chat history differs per workspace

---

## Files in `testing/`

| File | Role |
|------|------|
| `sample-document.md` | Source copy for uploads and question ideas |
| `MANUAL-TESTING.md` | This guide |

For local setup and deployment, see the root [`README.md`](../README.md).
