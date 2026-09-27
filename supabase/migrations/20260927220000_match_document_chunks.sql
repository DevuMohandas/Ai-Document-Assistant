-- Workspace-scoped semantic search over document_chunks (pgvector cosine).

create or replace function public.match_document_chunks(
  target_workspace_id uuid,
  query_embedding extensions.vector(768),
  match_count int default 5,
  match_threshold float default 0.5
)
returns table (
  id uuid,
  document_id uuid,
  workspace_id uuid,
  content text,
  chunk_index int,
  metadata jsonb,
  similarity float
)
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
begin
  if not public.is_workspace_member(target_workspace_id) then
    return;
  end if;

  return query
  select
    dc.id,
    dc.document_id,
    dc.workspace_id,
    dc.content,
    dc.chunk_index,
    dc.metadata,
    (1 - (dc.embedding <=> query_embedding))::float as similarity
  from public.document_chunks dc
  where dc.workspace_id = target_workspace_id
    and dc.embedding is not null
    and (1 - (dc.embedding <=> query_embedding)) >= match_threshold
  order by dc.embedding <=> query_embedding asc
  limit match_count;
end;
$$;

grant execute on function public.match_document_chunks(
  uuid,
  extensions.vector(768),
  int,
  float
) to authenticated;
