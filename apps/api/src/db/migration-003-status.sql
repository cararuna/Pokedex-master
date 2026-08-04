-- ============================================================================
-- Migração 003 — status "token_budget" no trace do agente
-- ============================================================================
--
-- Rode no SQL Editor do Supabase.
--
-- Por que existe
--   O harness tratava duas causas distintas como o mesmo status:
--
--     max_steps       o agente deu voltas demais (laço de ferramenta)
--     token_budget    a execução consumiu o orçamento de tokens
--
--   As duas pedem investigação diferente. Um laço de ferramenta é problema de
--   prompt ou de descrição de tool; estouro de orçamento costuma ser resultado
--   grande demais voltando de uma ferramenta.
--
--   Reportar as duas como "max_steps" escondeu qual delas aconteceu na
--   primeira falha encontrada pelos evals, e custou tempo de diagnóstico.
--
-- Seguro de rodar: só amplia o conjunto permitido, não altera nenhuma linha.
-- ============================================================================

alter table agent_runs
  drop constraint if exists agent_runs_status_check;

alter table agent_runs
  add constraint agent_runs_status_check
  check (status in ('ok', 'error', 'max_steps', 'token_budget', 'timeout'));
