-- Fix embedding column to Gemini output size (768 dimensions).

alter table public.document_chunks
  alter column embedding type extensions.vector(768)
  using embedding::extensions.vector(768);
