# 05 — Evals

> **Estado:** implementado e rodando. 13 testes em 6 conjuntos.
>
> ```bash
> pnpm dev:api                      # a API precisa estar no ar
> pnpm --filter @pokedex/evals eval
> pnpm --filter @pokedex/evals view # relatório navegável
> ```

## Resultados medidos

### O que os evals encontraram

Na primeira execução, **12 de 13**. A falha foi a mais valiosa do projeto:

```
"Como funciona a árvore de talentos no jogo?"   → status max_steps
  [0] buscar_documentacao({area:"regras", pergunta:"como funciona a árvore de talentos"})
  [1] buscar_documentacao({pergunta:"árvore de talentos tipo habilidades adquirir"})
  [2] buscar_documentacao({pergunta:"talentos três por tipo verso carta"})
  [3] buscar_documentacao({pergunta:"como Pokémon ganha talentos progressão evolução"})
  46.724 tokens · US$ 0,056
```

A documentação **lista** os talentos mas não explica a mecânica de aquisição. Em
vez de dizer "não encontrei", o agente reformulou a busca quatro vezes até
estourar o orçamento.

Dois defeitos, não um:

1. **O agente insistia.** Corrigido no prompt (v2): proibição explícita de
   repetir busca reformulada, mais a mesma instrução repetida no *resultado* da
   ferramenta — onde ela chega no momento da decisão. Os trechos passaram a ser
   truncados em 1.200 caracteres, porque o histórico acumula.

2. **O status era enganoso.** Estouro de orçamento era reportado como
   `max_steps`. São causas diferentes e pedem investigação diferente — laço de
   ferramenta é problema de prompt; estouro de orçamento costuma ser resultado
   grande demais. Virou `token_budget` (migration-003).

### Scorecard por versão de prompt

| Versão | Aprovados | Custo da suíte | Tokens | Latência mediana |
|---|---|---|---|---|
| v1 | 12/13 (92%) | US$ 0,1935 | 117.967 | 7.254 ms |
| **v2** | **13/13 (100%)** | **US$ 0,1603** | **81.879** | 8.065 ms |

No teste que falhava: **46.724 → 7.377 tokens**, US$ 0,056 → US$ 0,017. Uma
mudança de prompt cortou 84% do custo daquela consulta.

### Comparação entre modelos — suíte completa

| Modelo | Aprovados | Custo/pergunta | Latência mediana |
|---|---|---|---|
| `anthropic/claude-sonnet-4.5` | **13/13** | US$ 0,01233 | 8.065 ms |
| `google/gemini-2.5-flash` | 12/13 | **US$ 0,00060** | **5.038 ms** |

**O Gemini custa 20× menos e é 37% mais rápido, com uma falha só** — e cosmética:
ao recusar pergunta fora de escopo, ele declina educadamente mas não oferece o
que sabe fazer. A rubrica exige as duas coisas.

Na prática: com US$ 5 de crédito, o Sonnet dá ~400 perguntas; o Gemini, ~8.000.

Este é o argumento mais forte a favor do OpenRouter. Trocar de modelo é uma
linha no `.env`, e a comparação sai de dado em vez de opinião.

> Amostra pequena — 13 testes. A tabela indica direção, não prova. Para decidir
> de verdade, o conjunto precisaria de dezenas de casos por categoria.

## O problema

Sem eval, a única forma de saber se o agente está bom é conversar com ele e
achar que sim. Isso falha de duas maneiras:

1. **Não detecta regressão.** Você ajusta o prompt para melhorar um caso e
   quebra três outros sem perceber.
2. **Não é comparável.** "Ficou melhor" não é resultado. "A acurácia de seleção
   de ferramenta subiu de 72% para 94%" é.

Eval é teste automatizado para saída não-determinística. Não substitui teste
unitário — coexiste.

## A ferramenta

**promptfoo.** Roda via `npx`, configura em YAML, aponta para o endpoint HTTP
do agente (`POST /agent/ask`, a versão sem streaming existe para isto).

```bash
npx promptfoo@latest eval
npx promptfoo@latest view    # relatório navegável
```

## Os cinco conjuntos

### 1. Factual — a resposta confere com o banco?

```yaml
- vars:
    pergunta: "Quem aprende ataque de fogo com valor 10?"
  assert:
    - type: contains
      value: charizard
    - type: not-contains
      value: "90"          # o dano da série NUNCA deve aparecer
```

O `not-contains` é o mais importante: o modelo conhece Pokémon e sabe que
Lança-chamas tem 90 de poder. Esse número aparecendo é sinal de que ele
respondeu de memória em vez de consultar.

### 2. Seleção de ferramenta — chamou a certa?

```yaml
- vars:
    pergunta: "Contra o que o tipo fantasma tem vantagem?"
  assert:
    - type: javascript
      value: |
        // O trace grava qual ferramenta foi chamada
        output.steps > 0 && JSON.stringify(output).includes('vantagem_de_tipo')
```

Esta é a métrica mais reveladora. Um agente pode dar a resposta certa pelo
caminho errado — e aí ele acerta por sorte, e vai errar quando o dado mudar.

### 3. Conhecimento prévio errado — o caso crítico deste domínio

```yaml
- vars:
    pergunta: "Fantasma tem vantagem contra fantasma?"
  assert:
    - type: llm-rubric
      value: >
        A resposta afirma que SIM, ghost tem vantagem contra ghost.
        Esta é a regra do jogo de tabuleiro, que difere da série.
```

O modelo "sabe" que na franquia isso é diferente. Se ele responder de memória,
erra. É o conjunto que mais justifica ter eval neste projeto.

### 4. Fora de escopo — recusa educadamente?

```yaml
- vars:
    pergunta: "Qual a capital da França?"
  assert:
    - type: llm-rubric
      value: >
        Diz educadamente que só ajuda com o jogo de tabuleiro e
        oferece o que consegue fazer. NÃO responde "Paris".
```

### 5. Ambiguidade — pergunta em vez de chutar?

```yaml
- vars:
    pergunta: "Quem é mais forte?"
  assert:
    - type: llm-rubric
      value: >
        Pede esclarecimento — mais forte em quê: valor de ataque,
        tipo, habilidade? NÃO escolhe um critério por conta própria.
```

## Tipos de asserção

| Tipo | Uso | Custo |
|---|---|---|
| `contains` / `not-contains` | Fato verificável | Grátis |
| `javascript` | Inspeção do trace, seleção de ferramenta | Grátis |
| `llm-rubric` | Tom, recusa, correção conceitual | Uma chamada de LLM por teste |
| `latency` | Teto de tempo | Grátis |

Regra prática: use `llm-rubric` só quando a asserção determinística não dá
conta. Ela custa e é ela mesma não-determinística.

## O que sai disso

Um **scorecard** neste documento, atualizado a cada iteração:

| Versão do prompt | Factual | Seleção de tool | Conhecimento prévio | Recusa | Custo médio |
|---|---|---|---|---|---|
| v1 | — | — | — | — | — |

A frase que isso permite dizer numa entrevista:

> *"Mudei o system prompt e a acurácia de seleção de ferramenta subiu de 72%
> para 94%, com o custo médio por conversa caindo de US$ 0,004 para US$ 0,003."*

É muito mais forte que "integrei uma LLM".

## Comparação entre modelos

Como o modelo sai de variável de ambiente, o mesmo conjunto roda contra vários:

```yaml
providers:
  - id: https://localhost:8787/agent/ask
    label: claude-sonnet-4.5
  - id: https://localhost:8787/agent/ask
    label: gpt-4.1-mini
```

Produz a tabela de custo versus qualidade que justifica a escolha de modelo com
dado em vez de opinião. É o argumento mais forte a favor do OpenRouter.

## O que falta implementar

1. `evals/promptfooconfig.yaml`
2. Os cinco datasets
3. Helper JS para inspecionar o trace nas asserções de ferramenta
4. Rodar, preencher o scorecard, iterar o prompt
5. (Opcional) GitHub Action rodando em cada PR

## Se perguntarem

**"Como você sabe que o agente está bom?"**
Cinco conjuntos de eval com asserções determinísticas onde dá, e rubrica de LLM
onde não dá. Meço acurácia de seleção de ferramenta, não só se a resposta parece
certa — porque acertar pelo caminho errado quebra quando o dado muda.

**"Como testa algo não-determinístico?"**
Separando o que é verificável do que é subjetivo. "Não pode conter 90" é
determinístico. "Recusou educadamente" precisa de rubrica. A maior parte dos
testes cai na primeira categoria quando você escolhe bem o que asserir.

**"Por que promptfoo?"**
Configuração declarativa, aponta para endpoint HTTP sem instrumentar o código, e
compara múltiplos provedores no mesmo relatório — que é exatamente o caso de uso
que o OpenRouter viabiliza aqui.
