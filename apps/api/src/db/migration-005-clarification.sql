-- ============================================================================
-- Migração 005 — desambiguação: o pedido que vira pergunta
-- ============================================================================
--
-- Rode no SQL Editor do Supabase. **Não é destrutivo** — só amplia.
--
-- O caso que forçou isto
--   O Charizard tem, no banco de hoje:
--
--     Blaze           habilidade inata       "+1 em ataques Fire"
--     Chama Potente   talento do tipo fire   "+1 em ataques Fire"
--
--   Duas linhas, em duas tabelas, com a descrição **idêntica**. Um pedido como
--   "a habilidade do Charizard que dá +1 em fogo deveria dar +2" é ambíguo por
--   construção: a informação necessária para escolher não está no pedido.
--
--   Nenhum modelo resolve isso, e nenhum prompt melhor resolve isso. Retrieval
--   também não — ele encontra as duas, que é justamente o problema. Só quem
--   pediu sabe de qual estava falando.
--
--   Sem esta migração o propositor era obrigado a chutar. Chute que erra o
--   nome falha em segurança; chute que acerta *um* nome plausível escreve na
--   linha errada, e o diff mostra um valor plausível virando outro plausível —
--   passa na revisão sem ninguém notar. É o pior modo de falhar do sistema.
--
-- O desenho
--   `needs_clarification` é um terceiro destino, ao lado de "proponho isto" e
--   "não sei fazer isso". O pedido guarda os candidatos que o retrieval achou,
--   já na forma de operações completas. Escolher um **não chama o modelo**: a
--   operação já está pronta, só falta dizer qual.
-- ============================================================================

alter table change_requests
  drop constraint if exists change_requests_status_check;

alter table change_requests
  add constraint change_requests_status_check
  check (status in (
    'proposed', 'approved', 'applied', 'rejected',
    'failed', 'rolled_back', 'unsupported', 'denied',
    'needs_clarification'
  ));

/*
  Os candidatos, cada um uma operação inteira e aplicável:

    [{ "label": "Blaze — innate ability",
       "detail": "+1 em ataques Fire",
       "operation": { "kind": "update_ability_text", "args": { … } } }]

  Guardar a operação pronta, e não só o identificador do alvo, é o que faz a
  escolha custar zero. Se guardássemos "ability_id: 3", escolher exigiria uma
  segunda passada do modelo para montar os argumentos — e uma segunda passada
  é uma segunda chance de errar, justamente no ponto onde a pessoa acabou de
  remover a dúvida.
*/
alter table change_requests
  add column if not exists candidates jsonb;

/* A pergunta que o propositor devolveu. Aparece acima das opções na tela. */
alter table change_requests
  add column if not exists question text;

/*
  O texto que a pessoa acrescentou quando nenhum candidato servia.
  Guardado separado de `request_text` porque os dois juntos são a entrada real
  da segunda tentativa — e é isso que os evals precisam reproduzir.
*/
alter table change_requests
  add column if not exists clarification text;

-- A fila da tela agora tem duas portas de entrada: o que espera aprovação e o
-- que espera resposta. As duas leem por status, e o índice já cobre.
