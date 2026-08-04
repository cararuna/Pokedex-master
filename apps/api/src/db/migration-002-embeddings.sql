-- ============================================================================
-- Migração 002 — dimensão do vetor de embedding
-- ============================================================================
--
-- Rode no SQL Editor do Supabase.
--
-- Por que existe
--   O schema inicial definiu vector(1024), presumindo o `cohere/embed-v1`.
--   Esse modelo não existe no OpenRouter. Os que existem de verdade:
--
--     openai/text-embedding-3-small    1536   ← escolhido
--     openai/text-embedding-3-large    3072
--     qwen/qwen3-embedding-8b          4096
--     google/gemini-embedding-001      3072
--
--   O 3-small é o equilíbrio: barato, bem estabelecido, e 1536 dimensões são
--   mais que suficientes para algumas centenas de chunks de documentação.
--
-- Por que é ALTER e não UPDATE
--   Vetores de modelos diferentes NÃO são comparáveis — a similaridade entre
--   eles é ruído. Trocar de modelo de embedding é sempre recriar a coluna e
--   reindexar tudo, nunca uma migração de dado. Aqui é indolor porque a
--   tabela ainda está vazia.
-- ============================================================================

drop index if exists document_chunks_embedding_idx;

alter table document_chunks
  drop column if exists embedding;

alter table document_chunks
  add column embedding vector(1536);

create index document_chunks_embedding_idx
  on document_chunks using hnsw (embedding vector_cosine_ops);

-- A assinatura da função muda junto: o parâmetro precisa casar com a coluna.
drop function if exists match_chunks (vector, integer, text);

create or replace function match_chunks (
  query_embedding vector(1536),
  match_count     integer default 5,
  filter_kind     text default null
)
returns table (
  content      text,
  heading_path text,
  title        text,
  path         text,
  similarity   float
)
language sql stable
as $$
  select
    c.content,
    c.heading_path,
    d.title,
    d.path,
    1 - (c.embedding <=> query_embedding) as similarity
  from document_chunks c
  join documents d on d.id = c.document_id
  where filter_kind is null or d.kind = filter_kind
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
