# 05 — Evals

> **Estado:** projetado, não implementado. Depende da API estar no ar.

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
