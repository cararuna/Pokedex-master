# Companion do jogo de tabuleiro: design system, backend e agente de IA

Reescrita do projeto em 22 commits. O produto continua o mesmo — a mesa de
consulta de cartas do jogo de tabuleiro — mas passa a se apoiar num design
system próprio, num banco normalizado e num agente com harness e evals.

## O problema de origem

`MovimentosCompletos.tsx` paginava a PokeAPI inteira num laço e disparava uma
requisição por golpe de cada Pokémon:

```
387 pokémon × ~40 golpes ≈ 15.000 requisições HTTP a cada abertura da página
```

Sem cache, sem paginação, sem persistência. E a regra de negócio morava no
componente de interface: conversão de dano, tabela de vantagens, talentos e
correções manuais espalhados por quatro arquivos de front.

## O que mudou

| | antes | depois |
|---|---|---|
| Requisições ao abrir | ~15.000 | **1** |
| Bundle JS | 409,75 kB | 372,34 kB |
| Build | CRA, dezenas de segundos | Vite, 442 ms |
| CSS | ~1.800 linhas soltas, `!important` | tokens em 3 camadas |
| Regra do jogo | espalhada no front | tabelas + restrições no Postgres |

---

## Design system

Camadas de token: primitivos → semântica → componente. A regra que sustenta o
sistema é **componente nunca referencia primitivo** — e ela não é combinada, é
verificada: `scripts/lint-tokens.mjs` quebra o build em quatro classes de
violação, e `--color-*: initial` faz a paleta padrão do Tailwind deixar de
existir.

15 componentes, tema claro/escuro, Storybook com addon de acessibilidade, e 9
previews publicadas em claude.ai/design.

Overlays sobre Radix: a aparência é nossa; o que vem de fora é foco preso,
foco devolvido ao gatilho, `inert` e navegação por teclado.

## Backend

Supabase com 10 tabelas. A regra do jogo virou restrição:

```sql
primary key (pokemon_id, move_type)          -- um golpe por tipo
check (game_power between 8 and 10)          -- a escala do tabuleiro
```

ETL offline substitui a transformação em tempo de renderização: 950
requisições uma vez, contra 15.000 por page load. O cache é por golpe, não por
Pokémon.

## Agente

Harness próprio sobre o SDK da OpenAI apontado para o OpenRouter. Laço de
tool-calling com guardrails de passo, orçamento de tokens e timeout; cada
passo gravado em `agent_runs` / `agent_steps` com custo real.

7 ferramentas. A separação que define a arquitetura: **dado estruturado vai
para SQL, texto livre vai para RAG** — vetor não conta, não ordena e não
compara.

## RAG e evals

122 chunks indexados (US$ 0,0004), divididos por heading com a hierarquia
preservada.

15 evals apontando para o endpoint do agente, medindo o sistema e não só o
modelo. A asserção mais reveladora consulta o trace e verifica **qual
ferramenta foi chamada** — acertar pelo caminho errado é acertar por sorte.

| | prompt v1 | prompt v2 |
|---|---|---|
| Aprovados | 12/13 | **15/15** |
| Tokens da suíte | 117.967 | 81.879 |

Comparação de modelos: `gemini-2.5-flash` ficou 20× mais barato e 37% mais
rápido que `sonnet-4.5`, com uma única falha, cosmética.

---

## Documentação

`docs/` com cinco documentos e uma seção "Se perguntarem" em cada.
`CLAUDE.md` para contexto de trabalho, `SETUP.md` para credenciais,
`DEPLOY.md` para publicação.

## Verificação

Typecheck limpo nos três workspaces, linter de tokens passando, 15/15 nos
evals, e o comportamento conferido em execução — não só compilado.
