# 01 — Arquitetura

## O problema original

A versão anterior tinha um defeito que resume bem o que este projeto conserta.
Em `MovimentosCompletos.tsx`, o componente montava e disparava isto:

```tsx
while (currentLoadUrl) {
  const data = await (await fetch(currentLoadUrl)).json();
  for (const pokemon of data.results) {
    const detalhe = await (await fetch(pokemon.url)).json();
    for (const move of detalhe.moves) {          // ~40 golpes por Pokémon
      const moveData = await (await fetch(move.move.url)).json();
      // …aplica a regra do jogo aqui, no navegador
    }
  }
}
```

**387 Pokémon × ~40 golpes ≈ 15.000 requisições HTTP a cada abertura da
página.** Sem cache, sem paginação, sem persistência. Recarregar a aba refazia
tudo.

E havia um problema pior que o desempenho: **a regra de negócio morava no
componente de interface**. A conversão de dano, a tabela de vantagens, os
talentos e as correções manuais de golpe estavam espalhados entre quatro
arquivos de front. Ninguém além do React conseguia responder "quais Pokémon
batem 10 de fogo" — nem um relatório, nem um script, nem um agente de IA.

## A forma atual

```
                  ┌──────────────────────────────────┐
   ETL (offline)  │  PokeAPI ──► build-dataset.mjs   │  roda 1x
                  └──────────────┬───────────────────┘
                                 │ dataset.json (499 KB)
                                 ▼
                        ┌─────────────────┐
                        │    Supabase     │
                        │  ┌───────────┐  │
                        │  │ domínio   │◄─┼── ferramentas SQL do agente
                        │  ├───────────┤  │
                        │  │ pgvector  │◄─┼── RAG (documentação)
                        │  ├───────────┤  │
                        │  │  traces   │──┼─► evals
                        │  └───────────┘  │
                        └────────┬────────┘
                                 ▼
                    ┌────────────────────────┐
                    │   apps/api (Hono)      │
                    │  REST · SSE do agente  │
                    └────┬───────────────▲───┘
                         │               │ OpenAI SDK
                         ▼               │
                 ┌──────────────┐  ┌─────┴──────┐
                 │  apps/web    │  │ OpenRouter │
                 └──────────────┘  └────────────┘
```

### Fase de transição

Hoje o frontend lê `dataset.json` importado estaticamente — **zero requisições
em runtime**. Quando o Supabase estiver populado, o import vira uma chamada
paginada à API e nenhum componente muda: os formatos são idênticos de
propósito.

Isso foi deliberado. O ETL já emite exatamente a forma das tabelas, então a
migração é troca de origem, não refatoração.

---

## As três decisões estruturais

### 1. A transformação acontece uma vez, offline

`apps/web/scripts/build-dataset.mjs` faz o que o navegador fazia — mas uma vez
na vida, e com uma otimização que muda a ordem de grandeza:

```js
const moveCache = new Map();
async function getMove(url) {
  if (moveCache.has(url)) return moveCache.get(url);
  const promessa = getJson(url);   // guarda a PROMESSA, não o resultado
  moveCache.set(url, promessa);
  return promessa;
}
```

Guardar a promessa e não o valor resolvido é o detalhe: com 12 Pokémon sendo
processados em paralelo, vários pedem `tackle` ao mesmo tempo. Se o cache
guardasse só o resultado, os pedidos concorrentes chegariam antes do primeiro
resolver e todos disparariam requisição. Guardando a promessa, os concorrentes
aguardam a mesma chamada.

**Resultado medido:** 950 requisições, 16 segundos, 563 golpes únicos. Contra
~15.000 a cada page load.

### 2. Dado estruturado vai para tabela; texto vai para vetor

Esta é a decisão que mais rende numa conversa técnica sobre IA.

| Tipo de dado | Onde vive | Como o agente acessa |
|---|---|---|
| Pokémon, golpes, valores, vantagens | Tabelas relacionais | Ferramenta com SQL |
| Documentação do design system e da arquitetura | pgvector | RAG |

O erro comum de quem está começando em RAG é jogar tudo num índice vetorial.
Perguntar *"quais Pokémon batem 10 de fogo"* a um índice vetorial devolveria os
trechos mais **parecidos com a pergunta** — não a resposta.

Vetor mede semelhança semântica. Ele não conta, não ordena, não filtra e não
compara. `WHERE game_power = 10 AND move_type = 'fire'` faz as quatro coisas,
com precisão total e custo desprezível.

RAG entra onde a pergunta é sobre texto que não cabe em coluna: *"como uso o
componente Button?"*, *"qual token controla a elevação do card?"*.

### 3. A regra de negócio vira restrição de banco

A regra "um golpe por tipo, o mais forte" era uma linha de JavaScript que
alguém precisava lembrar de manter:

```js
if (!porTipo[tipo] || porTipo[tipo].power < valor) { … }
```

No banco, virou estrutura:

```sql
create table pokemon_moves (
  pokemon_id  integer not null references pokemon (id),
  move_type   text    not null,
  attack_name text    not null,
  game_power  smallint not null check (game_power between 8 and 10),
  primary key (pokemon_id, move_type)     -- ← a regra
);
```

A chave primária composta **impede** um segundo golpe de fogo para o mesmo
Pokémon. O `CHECK` impede que um valor da série (que vai a 250) entre por
engano numa carga futura.

A diferença é de natureza: a regra deixou de depender de disciplina e passou a
depender do Postgres. Uma carga malfeita falha na inserção, não meses depois
quando alguém nota um número estranho na tela.

---

## Por que estas ferramentas

| Escolha | Alternativa considerada | Por quê |
|---|---|---|
| **Vite** | CRA (o que havia) | CRA está descontinuado. Build foi de dezenas de segundos para 442ms |
| **Hono** | Express, Fastify | TypeScript de primeira classe, SSE nativo, roda em Node e serverless sem adaptador |
| **Supabase** | Postgres puro, Firebase | Postgres de verdade + pgvector no mesmo banco. Sem segundo serviço para busca vetorial |
| **OpenRouter** | API direta de um fornecedor | Uma chave para dezenas de modelos. Trocar de modelo é mudar uma variável de ambiente — é o que torna viável comparar custo e qualidade nos evals |
| **SDK da OpenAI** | Cliente HTTP próprio | O OpenRouter é compatível com a interface da OpenAI; ganhamos tipagem, streaming e retry de graça |
| **pnpm workspaces** | npm, Turborepo | Links simbólicos entre pacotes sem build intermediário; Turborepo seria peso extra para três pacotes |

### A API .NET que foi arquivada

O projeto tinha um backend .NET 8 com um `FavoritesController` e o boilerplate
`WeatherForecast`. O frontend nunca chegou a consumi-lo — a chamada estava
comentada.

Foi para `legacy/`, fora do versionamento. O motivo não é preconceito com .NET:
o harness do agente, o SDK da OpenAI e o cliente do Supabase são naturais em
TypeScript, e unificar a linguagem reduz o custo de contexto do projeto inteiro.

---

## Segurança

A `service_role` do Supabase **ignora todas as regras de RLS**. Ela existe em um
único lugar: `apps/api/.env`.

O frontend nunca fala com o Supabase diretamente. Fala com a API, e essa camada
decide o que expor. Duas consequências:

1. as regras de acesso ficam num lugar só, em código revisável — em vez de
   espalhadas entre policies do banco e chamadas do cliente;
2. a chave privilegiada nunca chega perto do bundle do navegador.

RLS está ligado em todas as tabelas. As de domínio têm policy de leitura
pública (é um catálogo de jogo, não há nada sensível). As de trace do agente
**não** — elas guardam o que as pessoas perguntaram.

> Tudo que vai para o cliente tem prefixo `VITE_` e é público por definição.
> Se uma chave precisa de prefixo `VITE_`, ela não é secreta.

---

## Se perguntarem

**"Como você resolveu o problema de performance?"**
Não foi cache nem otimização de rede: foi mover a transformação para fora do
caminho crítico. O cliente fazia ~15.000 requisições porque aplicava a regra de
negócio em tempo de renderização. Movi a transformação para um ETL que roda uma
vez, e o cliente passou a ler dado pronto.

**"Por que não usar RAG para tudo?"**
Porque vetor mede semelhança, não verdade. Para "quem bate 10 de fogo", um
índice vetorial devolveria os trechos parecidos com a frase, não a resposta.
Dado estruturado vai para SQL; RAG fica para texto livre.

**"Por que um monorepo?"**
Os tipos e o dataset são compartilhados entre front e back. Com repositórios
separados, cada mudança de formato viraria uma versão publicada e um
descompasso entre os dois lados.

**"E se a PokeAPI mudar?"**
O ETL quebra, não a aplicação. É a diferença entre uma dependência em tempo de
build e uma em tempo de execução — antes, uma instabilidade da PokeAPI derrubava
a tela do usuário.
