-- ============================================================================
-- Migração 004 — pedidos de mudança e tokens de acesso
-- ============================================================================
--
-- Rode no SQL Editor do Supabase. **Não é destrutivo** — só cria.
--
-- Por que existe
--   O mestre da mesa precisa corrigir dado do jogo — o texto de um talento, o
--   valor de um ataque — sem abrir o SQL Editor e sem pedir deploy. O caminho
--   óbvio seria um CRUD. Não é o que está aqui.
--
--   O que está aqui é uma **fila de propostas com aprovação humana**. Entre o
--   pedido em texto livre e a escrita no banco existe uma operação tipada,
--   revisável e reversível. Quem escreve o texto nunca toca a tabela; quem
--   toca a tabela é uma função conhecida, escolhida de um cardápio fechado.
--
-- Por que uma tabela e não um motor de workflow
--   Temporal, Inngest e afins existem para durabilidade, retry e fan-out. Aqui
--   há um passo de aprovação, seis usuários e nenhuma etapa concorrente. Uma
--   linha com `status` já é durável — o banco é o motor.
-- ============================================================================

-- ── Acesso ─────────────────────────────────────────────────────────────────

/*
  Tokens de acesso.

  A alternativa era uma variável de ambiente com um segredo compartilhado. Ela
  funciona e é indefensável num fluxo de aprovação, por um motivo simples: um
  segredo compartilhado não tem identidade. O histórico registraria "aprovado"
  sem registrar por quem — e um log de aprovação que não diz quem aprovou não
  é log de aprovação, é carimbo.

  Aqui cada pessoa da mesa recebe um token próprio, com papel próprio, e o
  histórico grava o rótulo. Revogar uma pessoa não invalida as outras.

  **O token em claro não existe aqui.** Guardamos o SHA-256. Quem lê o banco —
  inclusive um dump vazado — não consegue se autenticar com o que leu. O valor
  em claro aparece uma vez só, na saída do script que o cria.
*/
create table if not exists api_tokens (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  role        text not null check (role in ('master', 'editor', 'viewer')),
  token_hash  text not null unique,
  created_at  timestamptz not null default now(),
  -- Revogação é uma data, não um `delete`: o histórico continua conseguindo
  -- resolver o token que assinou uma aprovação de seis meses atrás.
  revoked_at  timestamptz,
  last_used_at timestamptz
);

create index if not exists api_tokens_hash_idx on api_tokens (token_hash);

-- ── Pedidos ────────────────────────────────────────────────────────────────

create table if not exists change_requests (
  id uuid primary key default gen_random_uuid(),

  /* O que a pessoa escreveu, literalmente. Guardado cru porque é a entrada
     dos evals: dado este texto, o modelo escolheu a operação certa? */
  request_text text not null,

  /*
    Estados possíveis, e o caminho entre eles:

      proposed ──approve──> approved ──ok──> applied ──undo──> rolled_back
         │                     │
         │                     └──falha──> failed
         └──reject──> rejected

    Três estados ficam fora desse caminho, e a distinção entre eles é o que
    torna o histórico legível:

      unsupported  o modelo recusou traduzir — "adicione o Mewtwo".
      failed       a operação era válida, mas o alvo não existia, era ambíguo,
                   ou a escrita não conferiu com a prévia.
      denied       o papel de quem pediu não permite aquela operação.

    Confundir os três esconderia exatamente o que se quer saber: se o problema
    é o cardápio, o dado ou a permissão.

    `approved` parece redundante — a aprovação aplica na hora — mas é o
    cadeado. A transição proposed → approved é um UPDATE condicional; duas
    abas clicando em Approve ao mesmo tempo fazem a segunda afetar zero linhas
    e desistir. Sem esse estado intermediário, a mesma mudança aplicaria duas
    vezes, e a segunda gravaria um "antes" que já era o "depois".
  */
  status text not null default 'proposed'
    check (status in (
      'proposed', 'approved', 'applied', 'rejected',
      'failed', 'rolled_back', 'unsupported', 'denied'
    )),

  /* A operação tipada: { kind, args }. Nunca SQL — ver changes/operations.ts. */
  operation jsonb,

  /* Como a linha estava quando a proposta foi montada. Serve a três coisas:
     mostrar o diff, detectar drift na hora de aplicar, e montar o inverso. */
  before_state jsonb,
  after_state  jsonb,

  /*
    O inverso, calculado no momento em que se aplica — não na hora do rollback.

    É a decisão que torna o desfazer confiável: se o inverso fosse derivado
    depois, ele dependeria do estado atual da tabela, que pode já ter mudado.
    Calculado aqui, ele carrega o valor exato que existia antes.
  */
  inverse_operation jsonb,

  /* Por que o modelo escolheu esta operação. Aparece na tela de aprovação —
     aprovar sem saber o raciocínio é aprovar no escuro. */
  rationale text,

  /* Falha na aplicação, em texto. Guardada porque `failed` sem motivo obriga
     a ir no log da plataforma. */
  error text,

  /*
    Atribuição.

    O id referencia o token; o rótulo é uma **cópia** do nome no momento do
    ato. A duplicação é deliberada: um token revogado e removido deixaria o
    histórico sem saber quem aprovou, e é justamente o histórico antigo que
    mais precisa dessa resposta.
  */
  requested_by_token uuid references api_tokens (id) on delete set null,
  requested_by       text,
  decided_by_token   uuid references api_tokens (id) on delete set null,
  decided_by         text,

  /* Rastro de custo do passo de proposta, no mesmo formato de agent_runs. */
  model    text,
  cost_usd numeric(10, 6),

  /* Rollback não apaga nem edita a linha original: cria uma nova, apontando
     para ela. O histórico é append-only — dá para ler a mesa inteira de
     trás para frente. */
  rollback_of uuid references change_requests (id),

  created_at timestamptz not null default now(),
  decided_at timestamptz,
  applied_at timestamptz
);

-- A tela lista pendentes primeiro, depois o histórico recente.
create index if not exists change_requests_status_idx
  on change_requests (status, created_at desc);

-- Cota por token e por janela de tempo: ver `policy.ts`. Sem este índice, a
-- checagem de cota varre a tabela a cada proposta.
create index if not exists change_requests_quota_idx
  on change_requests (requested_by_token, created_at desc);

/*
  RLS ligada e **sem policy de leitura pública**, ao contrário das tabelas de
  catálogo. Um pedido de mudança carrega texto escrito por uma pessoa, o estado
  anterior do dado e quem decidiu; um token carrega credencial. Nada disso
  pode estar aberto ao anon key. Só a service_role — isto é, só esta API.
*/
alter table change_requests enable row level security;
alter table api_tokens      enable row level security;
