-- =========================================================
-- Initial schema
-- Multi-Workspace Document Assistant
-- =========================================================

-- pgvector
create extension if not exists vector with schema extensions;


-- =========================================================
-- WORKSPACES
-- =========================================================

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- WORKSPACE MEMBERS
-- =========================================================

create table public.workspace_members (
  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,

  user_id uuid not null
    references auth.users(id) on delete cascade,

  role text not null default 'member'
    check (role in ('owner', 'member')),

  created_at timestamptz not null default now(),

  primary key (workspace_id, user_id)
);


-- =========================================================
-- DOCUMENTS
-- =========================================================

create table public.documents (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,

  created_by uuid not null
    references auth.users(id) on delete cascade,

  file_name text not null,
  storage_path text not null,

  status text not null default 'processing'
    check (status in ('processing', 'ready', 'failed')),

  error_message text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (id, workspace_id)
);


-- =========================================================
-- DOCUMENT CHUNKS
-- Single shared vector store
-- =========================================================

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,

  document_id uuid not null,

  content text not null,

  chunk_index integer not null
    check (chunk_index >= 0),

  metadata jsonb not null default '{}'::jsonb,

  embedding extensions.vector,

  created_at timestamptz not null default now(),

  foreign key (document_id, workspace_id)
    references public.documents(id, workspace_id)
    on delete cascade,

  unique (document_id, chunk_index)
);


-- =========================================================
-- CHAT MESSAGES
-- =========================================================

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,

  user_id uuid not null
    references auth.users(id) on delete cascade,

  role text not null
    check (role in ('user', 'assistant', 'system', 'tool')),

  content text not null,

  citations jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now()
);


-- =========================================================
-- TOOL CALLS
-- =========================================================

create table public.tool_calls (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,

  user_id uuid not null
    references auth.users(id) on delete cascade,

  tool_name text not null,

  arguments jsonb not null default '{}'::jsonb,
  result jsonb,

  status text not null
    check (status in ('pending', 'success', 'failed')),

  error_message text,

  created_at timestamptz not null default now()
);


-- =========================================================
-- TASKS
-- Used by AI save_task tool
-- =========================================================

create table public.tasks (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,

  created_by uuid not null
    references auth.users(id) on delete cascade,

  title text not null
    check (char_length(title) between 1 and 200),

  description text,

  completed boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- INDEXES
-- =========================================================

create index idx_workspace_members_user
  on public.workspace_members(user_id);

create index idx_documents_workspace
  on public.documents(workspace_id);

create index idx_document_chunks_workspace
  on public.document_chunks(workspace_id);

create index idx_document_chunks_document
  on public.document_chunks(document_id);

create index idx_chat_messages_workspace_created
  on public.chat_messages(workspace_id, created_at);

create index idx_tool_calls_workspace_created
  on public.tool_calls(workspace_id, created_at);

create index idx_tasks_workspace
  on public.tasks(workspace_id);


-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chat_messages enable row level security;
alter table public.tool_calls enable row level security;
alter table public.tasks enable row level security;


-- =========================================================
-- SECURITY HELPER
-- =========================================================

create or replace function public.is_workspace_member(
  target_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
  );
$$;


-- =========================================================
-- WORKSPACE POLICIES
-- =========================================================

create policy "workspace members can view workspace"
on public.workspaces
for select
to authenticated
using (
  public.is_workspace_member(id)
  or owner_id = auth.uid()
);

create policy "users can create workspace"
on public.workspaces
for insert
to authenticated
with check (
  owner_id = auth.uid()
);

create policy "owner can update workspace"
on public.workspaces
for update
to authenticated
using (
  owner_id = auth.uid()
)
with check (
  owner_id = auth.uid()
);

create policy "owner can delete workspace"
on public.workspaces
for delete
to authenticated
using (
  owner_id = auth.uid()
);


-- =========================================================
-- WORKSPACE MEMBER POLICIES
-- =========================================================

create policy "members can view workspace members"
on public.workspace_members
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

create policy "workspace owner can manage members"
on public.workspace_members
for all
to authenticated
using (
  exists (
    select 1
    from public.workspaces
    where id = workspace_members.workspace_id
      and owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workspaces
    where id = workspace_members.workspace_id
      and owner_id = auth.uid()
  )
);


-- =========================================================
-- DOCUMENT POLICIES
-- =========================================================

create policy "workspace members can view documents"
on public.documents
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

create policy "workspace members can create documents"
on public.documents
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
);

create policy "workspace members can update documents"
on public.documents
for update
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

create policy "workspace members can delete documents"
on public.documents
for delete
to authenticated
using (
  public.is_workspace_member(workspace_id)
);


-- =========================================================
-- DOCUMENT CHUNK POLICIES
-- =========================================================

create policy "workspace members can view chunks"
on public.document_chunks
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

create policy "workspace members can insert chunks"
on public.document_chunks
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
);

create policy "workspace members can delete chunks"
on public.document_chunks
for delete
to authenticated
using (
  public.is_workspace_member(workspace_id)
);


-- =========================================================
-- CHAT POLICIES
-- =========================================================

create policy "workspace members can view chat"
on public.chat_messages
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

create policy "workspace members can create chat"
on public.chat_messages
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and user_id = auth.uid()
);


-- =========================================================
-- TOOL CALL POLICIES
-- =========================================================

create policy "workspace members can view tool calls"
on public.tool_calls
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

create policy "workspace members can create tool calls"
on public.tool_calls
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and user_id = auth.uid()
);


-- =========================================================
-- TASK POLICIES
-- =========================================================

create policy "workspace members can view tasks"
on public.tasks
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

create policy "workspace members can create tasks"
on public.tasks
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
);

create policy "workspace members can update tasks"
on public.tasks
for update
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

create policy "workspace members can delete tasks"
on public.tasks
for delete
to authenticated
using (
  public.is_workspace_member(workspace_id)
);