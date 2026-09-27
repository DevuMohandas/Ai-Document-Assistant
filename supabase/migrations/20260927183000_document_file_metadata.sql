-- File metadata and content-hash dedupe per workspace.

alter table public.documents
  add column mime_type text,
  add column size_bytes bigint,
  add column content_hash text;

create unique index documents_workspace_content_hash_unique
  on public.documents(workspace_id, content_hash)
  where content_hash is not null;
