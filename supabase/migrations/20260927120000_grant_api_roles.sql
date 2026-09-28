-- Table-level privileges for Supabase Data API roles.
-- RLS policies alone are not enough; authenticated clients need GRANTs.

grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, insert, update, delete on table public.workspaces to authenticated;
grant select, insert, update, delete on table public.workspace_members to authenticated;
grant select, insert, update, delete on table public.documents to authenticated;
grant select, insert, update, delete on table public.document_chunks to authenticated;
grant select, insert, update, delete on table public.chat_messages to authenticated;
grant select, insert, update, delete on table public.tool_calls to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;

grant all on table public.workspaces to service_role;
grant all on table public.workspace_members to service_role;
grant all on table public.documents to service_role;
grant all on table public.document_chunks to service_role;
grant all on table public.chat_messages to service_role;
grant all on table public.tool_calls to service_role;
grant all on table public.tasks to service_role;

grant execute on function public.is_workspace_member(uuid) to authenticated;
