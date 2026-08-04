# CLAUDE.md

Contexto para o Claude Code trabalhar neste repositório.
Se algo aqui divergir do código, **o código vence** — e corrija este arquivo.

---

## O que é

> **Leia isto antes de mexer em qualquer tela.** Este projeto **não é uma
> Pokédex**. Confundir os dois já custou uma reescrita inteira.

É o **companion digital de um jogo de tabuleiro** de Pokémon. O jogador está na
mesa e precisa responder uma pergunta:

> *"Quais Pokémon aprendem ataque de fogo, e com que valor?"*

O produto é uma **mesa de consulta de cartas**. A tela existe para o filtro por
**tipo de ataque**, e o número que aparece em cada golpe **não é o dano da
série** — é o valor convertido pela regra do jogo.

### As mecânicas (`apps/web/src/game/rules.ts`)

| Regra | O quê |
|---|---|
| Conversão de poder | `ceil(dano / 10)`, teto 10, qualquer valor ≤ 7 vira 8 → escala **8, 9 ou 10** |
| Um golpe por tipo | Fica só o mais forte de cada tipo. É o que dá sentido ao filtro |
| Só nível | Golpes aprendidos por level-up, com dano > 0 |
| Ajustes manuais | `game/moveOverrides.json` — golpes que o mestre adicionou fora da regra |
| Vantagens | Tabela **do jogo**, não da série (`ghost` acerta `ghost`; `normal` não tem vantagem) |

A compressão para três degraus é intencional: o valor vira dificuldade de
rolagem, e uma faixa de 1 a 10 tornaria a maioria dos ataques irrelevante.

### A carta

Os **símbolos de tipagem são os mesmos das cartas físicas** do jogo. São
identidade anterior ao design system e não podem ser trocados por ícone
genérico — o sistema acomoda o símbolo, não o contrário.

- **Frente:** ataques com símbolo, valor do jogo e vantagens
- **Verso (giro):** árvore de talentos por tipo + habilidades inatas

### Como portfólio técnico

Sobre esse produto, três demonstrações:

1. **Design system** — o entregável principal
2. **Backend com dados normalizados** — substituindo fetch em cascata no cliente
3. **Agente de IA** com harness próprio, RAG e evals

Documentos de referência: [`PLANO.md`](PLANO.md) (arquitetura e fases) ·
[`SETUP.md`](SETUP.md) (credenciais e contas) ·
[`docs/`](docs/README.md) (aprofundamento por tema — arquitetura, design system,
agente, RAG e evals, cada um com uma seção "Se perguntarem")

---

## Estrutura

```
apps/web                  React 18 + Vite 8 + TS 7 + Tailwind v4
apps/api                  Hono + TypeScript          (Fase 2 — não existe ainda)
packages/design-system    tokens + componentes + Storybook (Fase 1 — não existe ainda)
packages/shared           tipos compartilhados web ↔ api  (Fase 2)
docs/                     documentação de arquitetura
evals/                    promptfoo                  (Fase 6)
legacy/pokedexAPI         API .NET v1 arquivada — fora do versionamento
```

Monorepo **pnpm**. Sempre `pnpm`, nunca `npm`/`yarn` — há um `pnpm-workspace.yaml`
e usar outro gerenciador quebra o link entre os pacotes.

## Comandos

```bash
pnpm install            # na raiz, instala todos os workspaces
pnpm dev                # frontend em :3000
pnpm dev:api            # backend (Fase 2)
pnpm storybook          # design system (Fase 1)
pnpm typecheck          # todos os workspaces
pnpm build              # todos os workspaces
```

Para um workspace só: `pnpm --filter @pokedex/web <script>`

---

## Estado atual

**Fase 0 concluída.** Monorepo montado, CRA → Vite migrado, router v5 → v7,
TS 7 com `noUnusedLocals`/`noUnusedParameters`, dependências mortas removidas.

**A UI ainda é a antiga** — visual gameboy/retro, CSS solto. A Fase 1 substitui.
Não invista em melhorar os CSS legados; eles vão ser deletados.

### Dívidas conhecidas (intencionalmente não resolvidas ainda)

| Onde | O quê | Resolve em |
|---|---|---|
| `components/MovimentosCompletos.tsx:165` | `loadPokemonPages` faz ~15.000 requisições à PokeAPI por page load (387 pokémon × ~40 golpes cada, sem cache) | Fase 2 (ETL) |
| `components/PokemonMove.tsx:52` | Tabela de vantagem de tipo hardcoded | Fase 2 |
| `components/MovimentosCompletos.tsx:110` | Normalização de power (÷10, teto 10, piso 8) no cliente | Fase 2 |
| `data/talentTrees.ts` | 880 linhas de talentos e habilidades inatas mockadas | Fase 2 |
| `hooks/useAddMoves.ts` | 368 linhas de `if (name === "...")` corrigindo golpes na mão | Fase 2 |
| `*.css` na raiz de `src/` | ~1.800 linhas sem tokens, com `!important` | Fases 1 e 3 |
| `React.FC<any>`, `(move: any)` | Tipagem frouxa espalhada | Fases 1 e 3 |
| `pages/Home` | Página órfã, fora das rotas — mantida como referência | Fase 3 |

---

## Convenções

**Idioma.** Três camadas, e a divisão é deliberada:

| Camada | Língua | Por quê |
|---|---|---|
| Código, tipos, nomes de arquivo | inglês | convenção do ecossistema |
| **Texto de interface** e resposta do agente | **inglês** | a mesa já fala inglês: `Flare Blitz`, `Fire`, `Heat Wave`. Rótulo em português ao lado disso fazia a tela falar duas línguas |
| Comentários, `docs/`, mensagem de commit | português | é a língua de quem mantém |

O `SYSTEM_PROMPT` também é inglês — o agente responde na língua da tela.

As duas mecânicas de habilidade têm nome fixo na interface e na API:
**innate abilities** (o Pokémon já tem) e **type abilities** (qualquer Pokémon
daquele tipo pode adquirir). No banco as tabelas seguem `abilities` e
`type_talents`; a tradução acontece na borda da API.

O código legado mistura os dois (`MovimentosCompletos`, `ListaPokemon`) — ao
reescrever um arquivo, padronize; não renomeie o que não está tocando.

**Design system.** A regra que sustenta tudo: **componente nunca referencia token primitivo.**
`Button` usa `--color-accent-solid`, jamais `--accent-600`. É isso que permite trocar tema
inteiro sem tocar em componente. Se precisar de um valor cru dentro de um componente, o token
semântico correspondente está faltando — crie ele.

**Dados.** Estruturado (pokémon, golpes, tipos) → tabela + tool SQL. Não-estruturado
(documentação) → RAG. Não jogue tabela em vetor.

**Segredos.** `SUPABASE_SERVICE_ROLE_KEY` e `OPENROUTER_API_KEY` só existem em
`apps/api/.env`. Nada de chave no frontend — o que vai para o cliente tem prefixo `VITE_`
e é público por definição.

---

## Armadilhas deste ambiente

- **Windows.** Cursor e Visual Studio seguram handles de pasta; `Move-Item`/`Remove-Item`
  falham com "em uso" mesmo em diretório vazio. Mover o *conteúdo* costuma funcionar quando
  mover o diretório não funciona.
- **`safe.directory`.** A raiz pertence a um SID de perfil antigo do Windows. Já existe
  exceção registrada no git global; se aparecer "dubious ownership" em pasta nova, é isso.
- **TypeScript 7** removeu `baseUrl`. Use só `paths`, resolvido relativo ao tsconfig.
- **Case de arquivo.** `dragonType.PNG` já quebrou em produção (Vercel é case-sensitive,
  Windows não). Confira o case ao referenciar asset de `public/`.
- **`legacy/` está no `.gitignore`** e mantém um `.git` próprio. Não tente versionar.
- **`vercel.json` não aceita comentário.** O schema tem `additionalProperties: false`,
  então a convenção `"//chave"` usada nos `tsconfig` derruba o build inteiro com
  *Invalid vercel.json*. Explicação sobre deploy vai em `DEPLOY.md` ou no
  `api/index.ts` — nunca dentro do `vercel.json`.
- **Roteamento da função.** Fora do Next.js, o nome do arquivo em `api/` só casa
  **um segmento**: `[...route].ts` não atende `/api/a/b`. Quem roteia é a reescrita
  `/api/(.*)` → `/api`, e depois o Hono.
