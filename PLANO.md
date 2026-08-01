# Plano de Refatoração — Pokédex

> Documento vivo. Objetivo: transformar o projeto atual num portfólio de **design system + agente de IA**
> defensável numa entrevista de front-end sênior.

---

## 1. Diagnóstico do estado atual

### Frontend (`Pokedex-master`)

| Item | Situação | Impacto |
|---|---|---|
| Build | CRA (`react-scripts` 5) | Deprecado, build lento, Storybook sofre |
| Router | `react-router-dom` **v5** | 2 majors atrás |
| TypeScript | 4.7 | Antigo |
| Estilo | 5 arquivos CSS soltos, ~1.800 linhas | Sem tokens, sem tema, `!important`, cor hardcoded por tipo |
| Deps mortas | `devextreme`, `devextreme-react`, `exceljs`, `file-saver` | ~40MB de bundle sem uso aparente |
| Tipagem | `React.FC<any>`, `props.moves.map((move: any) ...)` | Perde o benefício do TS |

### O problema crítico: fetch em cascata no cliente

`src/components/MovimentosCompletos.tsx:171` — `loadPokemonPages` roda um `while` paginando a PokeAPI
inteira. Para cada Pokémon (`fetchPokemonDetails`, linha 84) faz 1 request de detalhe **e mais um request
por golpe aprendido por level-up**.

```
387 pokémon × (1 detalhe + ~40 golpes) ≈ 15.000+ requisições HTTP por page load
```

Sem cache, sem paginação, sem persistência. É a maior dívida do projeto e a melhor história de refatoração
que temos: **de ~15.000 requests para 1**.

### Regra de negócio vazando para o front

| Regra | Onde está hoje | Para onde vai |
|---|---|---|
| Tabela de vantagem de tipo | `PokemonMove.tsx:52` (`checkListVantages`) | Tabela `type_effectiveness` |
| Normalização de power (÷10, teto 10, piso 8) | `MovimentosCompletos.tsx:116` | Coluna `normalized_power` no ETL |
| Árvores de talento (880 linhas) | `data/talentTrees.ts` | Tabelas `talents` / `innate_abilities` |
| Patches manuais de golpe (368 linhas de `if (name === ...)`) | `hooks/useAddMoves.ts` | Seed `move_overrides` |
| Mapa tipo → imagem (switch de 18 casos) | `PokemonMove.tsx:8` | Token/config do design system |

### Backend (`Pokedex-API/pokedexAPI/pokedexAPI`)

.NET 8 + EF Core + MySQL. Contém apenas `FavoritesController` e o boilerplate `WeatherForecast`.
O front **não consome** — a chamada está comentada em `App.tsx:11`.
→ Vai para `legacy/`, documentado como v1.

---

## 2. Arquitetura alvo

```
Pokedex/
├── CLAUDE.md                      # handover: como o Claude Code lê este repo
├── PLANO.md                       # este arquivo
├── pnpm-workspace.yaml
├── docs/
│   ├── 01-arquitetura.md
│   ├── 02-design-system.md
│   ├── 03-agente-e-harness.md
│   ├── 04-rag.md
│   └── 05-evals.md
├── apps/
│   ├── web/                       # React + Vite + Tailwind v4
│   │   └── src/
│   │       ├── features/
│   │       │   ├── pokedex/
│   │       │   └── agent-chat/    # painel do agente
│   │       ├── lib/api-client.ts
│   │       └── routes/
│   └── api/                       # Hono + TypeScript
│       ├── src/
│       │   ├── agent/
│       │   │   ├── harness.ts     # o loop de tool-calling
│       │   │   ├── llm.ts         # OpenAI SDK → OpenRouter
│       │   │   ├── tools/         # registry de ferramentas
│       │   │   ├── prompts/       # system prompts versionados
│       │   │   └── trace.ts       # observabilidade → Supabase
│       │   ├── rag/               # chunk · embed · retrieve
│       │   ├── db/                # Supabase client + queries
│       │   └── routes/
│       └── scripts/
│           ├── ingest-pokeapi.ts  # ETL: PokeAPI → Supabase (roda 1x)
│           └── ingest-docs.ts     # ETL: markdown → pgvector
├── packages/
│   ├── design-system/             # ★ O ENTREGÁVEL PRINCIPAL
│   └── shared/                    # tipos compartilhados web ↔ api
├── evals/                         # promptfoo
└── legacy/pokedexAPI/             # .NET v1 arquivado
```

### Fluxo de dados

```
                    ┌──────────────────────────────┐
   ETL (offline)    │  PokeAPI  ──►  ingest script │
                    └──────────────┬───────────────┘
                                   ▼
                          ┌─────────────────┐
                          │    Supabase     │
                          │  ┌───────────┐  │
                          │  │ estrutura │  │◄── tools SQL do agente
                          │  ├───────────┤  │
                          │  │ pgvector  │  │◄── RAG (docs do DS)
                          │  ├───────────┤  │
                          │  │  traces   │  │──► evals / promptfoo
                          │  └───────────┘  │
                          └────────┬────────┘
                                   ▼
              ┌────────────────────────────────────┐
              │      apps/api (Hono)               │
              │  REST  ·  harness do agente (SSE)  │
              └────────┬───────────────────────────┘
                       │                    ▲
                       ▼                    │ OpenAI SDK
              ┌─────────────────┐    ┌──────┴───────┐
              │   apps/web      │    │  OpenRouter  │
              └─────────────────┘    └──────────────┘
```

**Decisão de arquitetura importante (vale ponto na entrevista):**
dado **estruturado** (pokémon, golpes, tipos) o agente acessa por **tool com SQL** — não por RAG.
RAG é só para **texto não-estruturado**: a documentação do design system e da arquitetura.
Jogar tabela em vetor é o erro clássico de quem está começando em RAG; fazer essa distinção
explicitamente mostra maturidade.

---

## 3. Design System — o entregável principal

### Direção visual: "catálogo naturalista"

Abandonar o pixel-art/gameboy e mirar em **catálogo de história natural** — Pokédex como um livro de
espécimes, não como um console.

| Eixo | Antes | Depois |
|---|---|---|
| Superfície | Cor de tipo inundando o card inteiro | Papel off-white / ink escuro no dark |
| Borda | `border: 24px solid` + `box-shadow: 2px 5px` | Hairline 1px + sombra difusa sutil |
| Cor de tipo | Fundo do card, ~600 linhas de CSS | Chip pequeno + accent contido |
| Tipografia | Sistema, peso bold em tudo | Serifada de display (títulos) + Inter (UI) |
| Densidade | Card `min-height: 800px` | Grid respirado, hierarquia por escala |
| Motion | Nenhum / flip 3D abrupto | Transições curtas com easing tokenizado |

### Arquitetura de tokens — 3 camadas

Mesmo usando Tailwind v4, a camada de token é **nossa**. É isso que se apresenta.

```
packages/design-system/src/styles/
├── 01-primitives.css   # ramps cruas, sem semântica
│                       #   --ink-50 … --ink-950, --paper-*, --accent-*
│                       #   --space-1 … --space-24, --radius-*, --shadow-*
├── 02-semantic.css     # @theme — o que o produto consome
│                       #   --color-surface, --color-surface-raised
│                       #   --color-text, --color-text-muted
│                       #   --color-border, --color-focus-ring
│                       #   + override completo em [data-theme="dark"]
└── 03-components.css   # tokens de componente
                        #   --btn-height-md, --card-padding, --field-radius
```

**A regra que sustenta o sistema:** um componente **nunca** referencia a camada 1.
`Button` usa `--color-accent-solid`, jamais `--accent-600`. É isso que permite trocar o tema inteiro
(ou lançar um segundo brand) sem tocar em componente nenhum.

### Inventário de componentes

**Foundations** (páginas de documentação, não componentes)
Color · Typography · Spacing · Elevation · Motion · Iconografia · Breakpoints

**Primitivos de layout**
`Box` · `Stack` · `Inline` · `Grid` · `Container` · `Divider`

**Componentes**

| Categoria | Componentes |
|---|---|
| Ações | `Button` (solid/soft/outline/ghost/link × sm/md/lg × loading/disabled), `IconButton`, `ButtonGroup` |
| Formulário | `TextField`, `SearchField`, `Select`, `Checkbox`, `Radio`, `Switch`, `Label`, `FieldError` |
| Dados | `Card`, `PokemonCard`, `Badge`, `TypeChip`, `StatBar`, `Table`, `Avatar` |
| Feedback | `Skeleton`, `Spinner`, `EmptyState`, `Toast`, `Alert` |
| Navegação | `Tabs`, `Pagination`, `Breadcrumb`, `AppHeader`, `ThemeToggle` |
| Overlay | `Dialog`, `Drawer`, `Popover`, `Tooltip` |

Base de acessibilidade: **Radix UI primitives** para os que têm comportamento complexo
(Dialog, Popover, Tabs, Select, Tooltip). Escrever gerenciamento de foco e ARIA na mão em 2 dias é
onde o projeto quebra — usar Radix headless e estilizar por cima é a decisão profissional, e é
exatamente o que se defende numa entrevista.

### Vitrine

**Storybook 9** — o artefato mais forte para levar. Cada componente com:
- Página de docs (uso, quando não usar, do/don't)
- Todas as variantes visíveis lado a lado
- Controls interativos
- Addon **a11y** ligado (auditoria de contraste/ARIA visível na própria story)

---

## 4. O Agente

### Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Vendor LLM | **OpenRouter** | Aberto, um key para N modelos, permite trocar de modelo sem trocar código |
| SDK | **`openai` (oficial)** apontado para `https://openrouter.ai/api/v1` | OpenRouter é OpenAI-compatible; o SDK oficial dá tipagem, streaming e retry de graça |
| Harness | **Próprio**, sobre o SDK | O loop ser nosso é o ponto da entrevista — controle de passos, budget, tracing e guardrails visíveis |
| Servidor | **Hono** | Leve, TS-first, roda em Node e serverless, SSE nativo |
| Schema de tool | **Zod** → JSON Schema | Uma definição só valida entrada e descreve a tool para o modelo |

> Nota: o `@openai/agents` (Agents SDK) seria uma alternativa, mas ele esconde justamente o loop que
> queremos mostrar, e a compatibilidade com OpenRouter é menos garantida. Harness próprio.

### O que é o harness (`agent/harness.ts`)

O loop que transforma "uma chamada de LLM" em "um agente":

```
1. monta contexto     → system prompt + histórico + tools disponíveis
2. chama a LLM        → via OpenRouter
3. resposta tem tool_calls?
      não → devolve resposta final, encerra
      sim → valida args com Zod
            executa a tool (com timeout)
            anexa o resultado ao histórico
            volta para o passo 2
4. guardrails em toda volta:
      maxSteps · budget de token · timeout global · retry com backoff
5. trace de cada passo → tabela agent_steps no Supabase
```

Cada peça acima é um item que se explica na entrevista. É por isso que não usamos framework pronto.

### Ferramentas do agente

| Tool | Tipo | O que faz |
|---|---|---|
| `search_pokemon` | SQL | Filtra por nome, tipo, geração, tipo de golpe |
| `get_pokemon` | SQL | Ficha completa de um Pokémon |
| `compare_pokemon` | SQL | Compara 2+ lado a lado |
| `type_matchup` | SQL | Consulta `type_effectiveness` — vantagem/fraqueza |
| `search_docs` | **RAG** | Busca vetorial na doc do design system e da arquitetura |
| `navigate_ui` | **UI action** | O agente aplica filtro/rota no front |

`navigate_ui` é o recurso que fecha a demo: *"me mostre os Pokémon de fogo da primeira geração"* →
o agente responde **e** a interface filtra sozinha. Para uma vaga de front-end, um agente que
opera a UI vale mais que um chat isolado.

---

## 5. Light RAG

**Só sobre texto não-estruturado**: `docs/*.md` + a documentação de cada componente do design system.

Pipeline:

```
markdown → chunk por heading (respeitando hierarquia)
         → embedding (OpenRouter /embeddings)
         → document_chunks (pgvector)

query    → embedding da pergunta
         → match_chunks() via RPC  [similaridade de cosseno + índice HNSW]
         → top-k + re-rank por heading_path
         → contexto para a tool search_docs
```

Confirmado: o OpenRouter expõe `/api/v1/embeddings` compatível com OpenAI, então **chat e embedding
usam a mesma key**. Ainda assim o embedder fica atrás de uma interface (`Embedder`) para permitir
trocar de provider sem mexer no resto.

Efeito colateral valioso: o agente consegue responder *"como uso o componente Button?"* ou
*"qual token controla a elevação do card?"* — o agente documenta o próprio design system.

---

## 6. Schema do Supabase

**Domínio (consumido por tool SQL)**
```
pokemon              id · dex_number · slug · name · types[] · sprites jsonb
                     abilities[] · stats jsonb · generation
moves                id · slug · name · type · power · normalized_power
                     accuracy · pp · damage_class
pokemon_moves        pokemon_id · move_id · learn_method · level
type_effectiveness   attacking_type · defending_type · multiplier
favorites            user_id · pokemon_id

-- sistema de habilidades (hoje mockado em data/talentTrees.ts)
abilities            id · key · name · description
                     ← catálogo ABILITIES (linha 205) + as inline deduplicadas
pokemon_abilities    pokemon_slug · ability_id · position
                     ← innateAbilities (linha 405)
type_talents         type · name · description · position
                     ← typeTalentTrees (linha 36), 3 talentos por tipo
```

> **Nota sobre as habilidades inatas:** o arquivo já é semi-normalizado — `innateAbilities` referencia
> o catálogo `ABILITIES` por chave (`A.OVERGROW`), mas mistura habilidades escritas inline
> (ex.: `charmander` tem uma `"Chama Interior"` solta). Na migração, toda inline vira registro em
> `abilities` e a duplicação some. O `getTypeIcon` (switch de 18 casos duplicado em
> `PokemonMove.tsx:8` e `talentTrees.ts:12`) vira token do design system, não dado de banco.

**RAG**
```
documents            id · source · path · title · kind
document_chunks      id · document_id · content · heading_path
                     embedding vector(N) · tokens
                     → índice HNSW + RPC match_chunks()
```

**Observabilidade do agente**
```
agent_runs           id · session_id · user_message · final_answer
                     model · total_tokens · cost_usd · latency_ms · status
agent_steps          run_id · step_index · role · tool_name · tool_args
                     tool_result · tokens · latency_ms
```

As tabelas de trace não são enfeite: alimentam os evals e permitem mostrar custo e latência reais
por conversa. Poucos portfólios têm isso.

---

## 7. Evals (pós-core)

**promptfoo**, apontando para o endpoint HTTP do agente.

Conjuntos de teste:
1. **Factual** — respostas sobre Pokémon conferidas contra o banco
2. **Seleção de tool** — asserção em JS de que a tool certa foi chamada com os args certos
3. **RAG** — perguntas sobre o design system, verificando se citou a fonte correta
4. **Fora de escopo** — o agente recusa educadamente
5. **Ambíguo** — o agente pede esclarecimento em vez de alucinar

Asserções: `contains` · `javascript` (inspeção de tool call) · `llm-rubric` (correção e tom) ·
limites de latência e custo.

Entregável: um **scorecard** em `docs/05-evals.md` com o antes/depois de cada iteração de prompt.
"Eu mudei o system prompt e a acurácia de seleção de tool subiu de 72% para 94%" é uma frase
muito mais forte que "eu integrei uma LLM".

---

## 8. Fases de execução

### Fase 0 — Fundação
- [ ] `git init` na raiz, `.gitignore` (preservando o histórico de `Pokedex-master`)
- [ ] Monorepo pnpm: `pnpm-workspace.yaml` + workspaces
- [ ] Mover `Pokedex-master` → `apps/web`, `Pokedex-API` → `legacy/pokedexAPI`
- [ ] Migrar CRA → **Vite**; `react-router` v5 → v7
- [ ] Remover deps mortas (`devextreme`, `exceljs`, `file-saver`)
- [ ] TypeScript 5.x + `strict: true`
- [ ] `CLAUDE.md` na raiz (handover)

### Fase 1 — Design System ★ prioridade máxima
- [ ] Tailwind v4 + as 3 camadas de token
- [ ] Tema light/dark via `[data-theme]`
- [ ] Escala tipográfica (serifada display + Inter UI)
- [ ] Primitivos de layout
- [ ] Componentes base (Button, TextField, SearchField, Card, Badge, TypeChip…)
- [ ] Overlays sobre Radix (Dialog, Popover, Tabs, Select, Tooltip)
- [ ] Storybook 9 + addon a11y
- [ ] Páginas de Foundations
- [ ] `docs/02-design-system.md`

### Fase 2 — Backend e dados
- [ ] Projeto Supabase + schema + RLS + pgvector
- [ ] `apps/api` com Hono
- [ ] `ingest-pokeapi.ts` — o ETL que mata as 15.000 requisições
- [ ] Endpoints REST de Pokémon/golpes/favoritos
- [ ] Front passa a consumir a API (deleta `talentTrees.ts` e `useAddMoves.ts`)
- [ ] `docs/01-arquitetura.md`

### Fase 3 — Redesign das telas
- [ ] Reescrever `Home` e `PokemonCard` com o design system
- [ ] Nova busca/filtros usando `SearchField` + `Select`
- [ ] Página de detalhe do Pokémon
- [ ] Deletar `ListaPokemon.css`, `PokemonMove.css`, `ListaMovimentos.css`, `Search.css`
- [ ] Loading states com `Skeleton`

### Fase 4 — Agente
- [ ] `llm.ts` — OpenAI SDK → OpenRouter
- [ ] `harness.ts` — loop, guardrails, tracing
- [ ] Registry de tools com Zod
- [ ] Streaming SSE
- [ ] Feature `agent-chat` no front
- [ ] `navigate_ui` — agente operando a interface
- [ ] `docs/03-agente-e-harness.md`

### Fase 5 — RAG
- [ ] Migration pgvector + `match_chunks()`
- [ ] `ingest-docs.ts` (chunk + embed)
- [ ] Tool `search_docs`
- [ ] `docs/04-rag.md`

### Fase 6 — Evals
- [ ] `promptfooconfig.yaml` + datasets
- [ ] Asserções de tool-selection
- [ ] Scorecard em `docs/05-evals.md`

---

## 9. Prioridade dado o prazo

A entrevista é para **front-end com design system**. Se o tempo apertar, a ordem de sacrifício é:

**Inegociável:** Fase 0 → Fase 1 → Fase 3
Um design system impecável com Storybook e a UI redesenhada já ganha a entrevista sozinho.

**Alto valor:** Fase 2 → Fase 4
O ETL (15.000 → 1 request) e o agente que opera a UI são os diferenciais.

**Se sobrar tempo:** Fase 5 → Fase 6
RAG e evals são profundidade extra. Melhor ter 4 fases excelentes que 6 pela metade.
