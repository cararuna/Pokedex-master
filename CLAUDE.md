# CLAUDE.md

Contexto para o Claude Code trabalhar neste repositório.
Se algo aqui divergir do código, **o código vence** — e corrija este arquivo.

---

## O que é

Pokédex reconstruída como portfólio técnico de três coisas:

1. **Design system** — o entregável principal
2. **Backend com dados normalizados** — substituindo fetch em cascata no cliente
3. **Agente de IA** com harness próprio, RAG e evals

Documentos de referência: [`PLANO.md`](PLANO.md) (arquitetura e fases) ·
[`SETUP.md`](SETUP.md) (credenciais e contas) · [`docs/`](docs/) (aprofundamento por tema)

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

**Idioma.** Código, tipos e nomes de arquivo em **inglês**. Comentários, documentação e
texto de interface em **português**. O código legado mistura os dois (`MovimentosCompletos`,
`ListaPokemon`) — ao reescrever um arquivo, padronize; não renomeie o que não está tocando.

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
