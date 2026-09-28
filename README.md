# Multi-Workspace Document Assistant

A Next.js app for teams that work in separate **workspaces**. Each workspace has its own documents, chat history, tasks, and tool-activity log. Users sign in with Supabase Auth, pick an active workspace, upload files, and ask questions that are answered with **retrieval-augmented generation (RAG)** over that workspace’s content. The assistant can also call **Gemini tools** to create and list tasks in the active workspace.

## Live Application

**URL:** https://ai-documentassistant.netlify.app

## Test Login

Use the following test account:

**Email:** test1@example.com 
**Password:** testuser@123

## What it does

- **Workspaces** — Create and switch workspaces; the active workspace is stored in a cookie and enforced on the server.
- **Documents** — Upload PDF, plain text, Markdown, or DOCX files. Text is extracted, chunked, embedded with Gemini (`gemini-embedding-2`, 768 dimensions), and stored in Postgres with pgvector-style search via a Supabase RPC.
- **Chat (RAG)** — Questions are scoped to the active workspace. Relevant chunks are retrieved, passed to Gemini as untrusted context, and answers include citations when document evidence was used. If the context is insufficient, the model is instructed to say it does not know based on available documents.
- **Tool calling** — Gemini may call `save_task` (create a task) or `list_tasks` (recent tasks). Workspace ID is never taken from the model; tools run server-side with the authenticated user and active workspace. Each execution is recorded in `tool_calls`.
- **Tool activity** — View a history of assistant tool runs for the current workspace.
- **Security** — Row Level Security on Supabase tables and storage; the app uses the **publishable (anon) key** with the user’s session, not the service role.

Main routes: `/login`, `/dashboard` (chat), `/documents`, `/tool-activity`, `/workspaces`, `/profile`.

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS  
- **Backend / data:** Supabase (Auth, Postgres, Storage)  
- **AI:** Google Gemini via `@google/genai` (chat, embeddings, function calling)

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (LTS recommended)
- A [Supabase](https://supabase.com/) project (local CLI or hosted)
- A [Google AI](https://aistudio.google.com/apikey) API key with access to the embedding and chat models used by the app

## Run locally

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ai-document-assistant
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
GEMINI_API_KEY=<your-gemini-api-key>
```

Optional:

```env
GEMINI_CHAT_MODEL=gemini-3.8-flash
```

If `GEMINI_CHAT_MODEL` is unset, the app defaults to `gemini-3.8-flash`.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (Settings → API). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key (formerly “anon” key). Safe for the browser with RLS. |
| `GEMINI_API_KEY` | Yes | Server-only key for embeddings, chat, and tool calling. |
| `GEMINI_CHAT_MODEL` | No | Override the Gemini model id used for chat / tools. |

Never commit `.env.local` or expose `GEMINI_API_KEY` to the client.

### 3. Database and storage (Supabase)

Apply migrations from `supabase/migrations/` to your project.

**Hosted project (linked CLI):**

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

**Local Supabase:**

```bash
npx supabase start
npx supabase db reset
```

Use the local API URL and publishable key from `supabase status` in `.env.local` when developing against local Supabase.

**Storage bucket:** Create a **private** bucket named `documents` in the Supabase dashboard (Storage). RLS policies for this bucket are defined in migration `20260927190000_documents_storage_rls.sql`; paths use `{workspace_id}/{document_id}/{filename}`.

**Auth:** Enable Email provider (or your chosen method) and create a user for sign-in. The login page uses email and password.

Enable the **pgvector** extension on your database if it is not already enabled (required for embeddings; see migrations).

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You are redirected to `/login`; after sign-in, use `/dashboard` to chat.

### 5. Verify the app

1. Create or select a workspace.  
2. Upload a document under **Documents** and wait for processing to finish.  
3. Ask a question about the document on **Chat** and check citations.  
4. Try `Create a task called Review contract` or `What tasks do I have?`  
5. Confirm entries on **Tool Activity**.

### Other scripts

```bash
npm run build   # production build
npm run start   # run production server locally
npm run lint    # ESLint
npx tsc --noEmit   # TypeScript check
```

## Deployment

The app is a standard Next.js Node deployment. A common setup is **Vercel** for the frontend/API routes and **Supabase Cloud** for database, auth, and file storage.

### Supabase (production)

1. Create a production Supabase project.  
2. Run all migrations (`supabase db push` against the linked project).  
3. Create the private `documents` storage bucket.  
4. Configure Auth (site URL, redirect URLs) for your production domain.  
5. Copy the project URL and publishable key for Vercel env vars.

### Vercel

1. Import the Git repository in [Vercel](https://vercel.com).  
2. Framework preset: **Next.js**.  
3. Set environment variables (same as local, using production Supabase and Gemini keys):

   - `NEXT_PUBLIC_SUPABASE_URL`  
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  
   - `GEMINI_API_KEY`  
   - `GEMINI_CHAT_MODEL` (optional)

4. Deploy. Vercel runs `npm run build` by default.

5. In Supabase **Authentication → URL configuration**, add your Vercel URL (e.g. `https://your-app.vercel.app`) to **Site URL** and **Redirect URLs** so session cookies work correctly.

### Other hosts

Any platform that supports Next.js 16 (`npm run build` + `npm run start`) works the same way: provide the env vars above and point Supabase Auth URLs at your domain.

### Production notes

- Keep `GEMINI_API_KEY` server-only (no `NEXT_PUBLIC_` prefix).  
- Do not use the Supabase **service role** key in this application; RLS is relied on for isolation.  
- Monitor Gemini and Supabase usage quotas for embeddings, chat, and storage.  
- Document processing and chat run in server actions / server code; ensure your host allows sufficient function duration for large uploads and embedding batches.

## Project layout (high level)

| Path | Purpose |
|------|---------|
| `app/` | Routes, layouts, login |
| `components/` | UI (chat, documents, workspaces, tool activity) |
| `lib/rag/` | Retrieval, context building, `askQuestion` |
| `lib/ai/` | Gemini client, embeddings, tool declarations and execution |
| `lib/documents/` | Upload processing, text extraction, chunking |
| `lib/supabase/` | Server/client Supabase helpers |
| `lib/workspaces/` | Active workspace resolution |
| `supabase/migrations/` | Schema, RLS, RPC for vector search |

## License

Private project — add a license here if you open-source the repository.
