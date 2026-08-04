-- ============================================================================
-- Schema — companion do jogo de tabuleiro
-- ============================================================================
--
-- Rode este arquivo inteiro no SQL Editor do Supabase antes do `pnpm seed`.
--
--   ⚠  DESTRUTIVO. Começa apagando as tabelas existentes (ver bloco abaixo).
--      Rodar de novo zera o banco e exige `pnpm seed` outra vez.
--      Não é idempotente — é uma reconstrução.
--
-- O que muda de arquitetura ao trazer isto para o banco:
--
--   1. A regra do jogo deixa de ser código e vira dado. Hoje, para responder
--      "quais Pokémon batem 10 de fogo", é preciso ler talentTrees.ts e
--      rules.ts. Aqui é um SELECT — e é isso que permite o agente de IA
--      responder sem alucinar.
--
--   2. As habilidades saem do mock. `innateAbilities` referenciava um catálogo
--      por chave mas tinha dezenas de entradas escritas inline; a normalização
--      abaixo dedupe tudo em `abilities`.
--
--   3. A busca vetorial (Fase 5) passa a conviver com a relacional no mesmo
--      banco, sem um segundo serviço.
-- ============================================================================

create extension if not exists vector;

-- ── ATENÇÃO: reconstrução destrutiva ───────────────────────────────────────
--
-- Este bloco APAGA as tabelas do dump cru da PokeAPI que existia neste projeto:
--
--   pokemon            386 linhas   (incluindo a coluna flag_capturado)
--   pokemon_moves   96.467 linhas   (learnset completo, com nível e versão)
--   moves              563 linhas   (com accuracy, pp, damage_class)
--   types               18 linhas
--   pokemon_abilities  965 linhas
--
-- Autorizado explicitamente. Os dados são regeneráveis a partir do ETL em
-- apps/web/scripts/build-dataset.mjs, exceto accuracy, pp, damage_class e
-- level_learned_at, que o ETL atual não captura.
--
-- `cascade` é necessário porque há chaves estrangeiras entre elas.
-- ---------------------------------------------------------------------------

drop table if exists pokemon_abilities cascade;
drop table if exists pokemon_moves     cascade;
drop table if exists pokemon           cascade;
drop table if exists moves             cascade;
drop table if exists types             cascade;
drop table if exists abilities         cascade;
drop table if exists type_advantages   cascade;
drop table if exists type_talents      cascade;

-- Tabelas de RAG e trace, caso uma execução anterior as tenha criado.
drop table if exists document_chunks cascade;
drop table if exists documents       cascade;
drop table if exists agent_steps     cascade;
drop table if exists agent_runs      cascade;

drop function if exists match_chunks (vector, integer, text);

-- ── Domínio ────────────────────────────────────────────────────────────────

create table pokemon (
  id          integer primary key,
  dex_number  integer not null,
  slug        text    not null unique,
  types       text[]  not null,
  sprites     jsonb   not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index pokemon_slug_idx on pokemon (slug);
-- GIN em array permite `where types @> '{fire}'` usar índice.
create index pokemon_types_idx on pokemon using gin (types);

/*
  Golpes já convertidos para a escala do tabuleiro.

  A chave primária composta (pokemon_id, move_type) é a regra do jogo escrita
  como restrição: **um golpe por tipo, o mais forte**. O banco passa a recusar
  um segundo golpe de fogo para o mesmo Pokémon — a regra não depende mais de
  ninguém lembrar dela no código do ETL.
*/
create table pokemon_moves (
  pokemon_id  integer not null references pokemon (id) on delete cascade,
  move_type   text    not null,
  attack_name text    not null,
  -- A escala do jogo é 8, 9 ou 10. O CHECK impede que um valor da série
  -- (que vai a 250) entre aqui por engano numa carga futura.
  game_power  smallint not null check (game_power between 8 and 10),
  primary key (pokemon_id, move_type)
);

create index pokemon_moves_type_idx
  on pokemon_moves (move_type, game_power desc);

/*
  Vantagens de tipo — a tabela DO JOGO, não a da série.
  Difere em pontos deliberados: `ghost` acerta `ghost`, e `normal` não tem
  vantagem contra nada.
*/
create table type_advantages (
  attacking_type text not null,
  defending_type text not null,
  primary key (attacking_type, defending_type)
);

-- ── Habilidades ────────────────────────────────────────────────────────────

create table abilities (
  id          serial primary key,
  key         text not null unique,
  name        text not null,
  description text not null
);

create table pokemon_abilities (
  pokemon_slug text    not null,
  ability_id   integer not null references abilities (id) on delete cascade,
  position     smallint not null,
  primary key (pokemon_slug, ability_id)
);

/* Talentos por tipo — 3 por tipo, na ordem da árvore. */
create table type_talents (
  id          serial primary key,
  type        text not null,
  name        text not null,
  description text not null,
  position    smallint not null,
  unique (type, name)
);

-- ── RAG (Fase 5) ───────────────────────────────────────────────────────────

create table documents (
  id         serial primary key,
  source     text not null,
  path       text not null unique,
  title      text not null,
  kind       text not null check (kind in ('design-system', 'arquitetura', 'regras')),
  updated_at timestamptz not null default now()
);

create table document_chunks (
  id           serial primary key,
  document_id  integer not null references documents (id) on delete cascade,
  content      text not null,
  heading_path text,
  -- 1536 dimensões: tamanho do openai/text-embedding-3-small, um dos poucos
  -- modelos de embedding realmente servidos pelo OpenRouter. Trocar de modelo
  -- exige recriar a coluna e reindexar — vetores de modelos diferentes não são
  -- comparáveis. Por isso o embedder fica atrás de uma interface no código.
  embedding    vector(1536),
  tokens       integer
);

/*
  HNSW em vez de IVFFlat: não exige treino prévio sobre um volume mínimo de
  dados. Com poucas centenas de chunks — que é o nosso caso — o IVFFlat
  degrada para busca linear de qualquer forma.
*/
create index document_chunks_embedding_idx
  on document_chunks using hnsw (embedding vector_cosine_ops);

-- ── Observabilidade do agente (Fase 4) ─────────────────────────────────────

create table agent_runs (
  id           uuid primary key default gen_random_uuid(),
  session_id   text,
  user_message text not null,
  final_answer text,
  model        text not null,
  total_tokens integer,
  cost_usd     numeric(10, 6),
  latency_ms   integer,
  status       text not null check (status in ('ok', 'error', 'max_steps', 'timeout')),
  created_at   timestamptz not null default now()
);

create table agent_steps (
  id          serial primary key,
  run_id      uuid not null references agent_runs (id) on delete cascade,
  step_index  smallint not null,
  role        text not null,
  tool_name   text,
  tool_args   jsonb,
  tool_result jsonb,
  tokens      integer,
  latency_ms  integer
);

create index agent_steps_run_idx on agent_steps (run_id, step_index);

-- ── Busca vetorial ─────────────────────────────────────────────────────────

/*
  O cliente JS não expressa o operador `<=>` do pgvector, então a busca vive
  numa função e é chamada por RPC.

  `<=>` é distância de cosseno (0 = idêntico). A similaridade devolvida é
  `1 - distância`, que é o número que faz sentido para quem consome.
*/
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

-- ── Segurança ──────────────────────────────────────────────────────────────

/*
  RLS ligado em tudo. As tabelas de domínio são públicas para leitura — é um
  catálogo de jogo, não há nada sensível — e a escrita fica restrita à
  service_role, usada apenas pelo backend.

  As tabelas de trace do agente NÃO recebem policy de leitura pública: elas
  guardam o que as pessoas perguntaram.
*/
alter table pokemon            enable row level security;
alter table pokemon_moves      enable row level security;
alter table type_advantages    enable row level security;
alter table abilities          enable row level security;
alter table pokemon_abilities  enable row level security;
alter table type_talents       enable row level security;
alter table documents          enable row level security;
alter table document_chunks    enable row level security;
alter table agent_runs         enable row level security;
alter table agent_steps        enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'pokemon', 'pokemon_moves', 'type_advantages',
    'abilities', 'pokemon_abilities', 'type_talents'
  ] loop
    execute format(
      'drop policy if exists "leitura publica" on %I; '
      'create policy "leitura publica" on %I for select using (true);', t, t
    );
  end loop;
end $$;
