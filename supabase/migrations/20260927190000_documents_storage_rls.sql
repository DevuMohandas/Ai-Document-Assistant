-- RLS on storage.objects for the private "documents" bucket.
-- Path layout: {workspace_id}/{document_id}/{filename}

drop policy if exists "documents bucket insert for workspace members"
  on storage.objects;

create policy "documents bucket insert for workspace members"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and public.is_workspace_member(
    ((storage.foldername(name))[1])::uuid
  )
);

drop policy if exists "documents bucket select for workspace members"
  on storage.objects;

create policy "documents bucket select for workspace members"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and public.is_workspace_member(
    ((storage.foldername(name))[1])::uuid
  )
);

drop policy if exists "documents bucket delete for workspace members"
  on storage.objects;

create policy "documents bucket delete for workspace members"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and public.is_workspace_member(
    ((storage.foldername(name))[1])::uuid
  )
);
