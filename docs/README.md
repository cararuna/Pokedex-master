# Documentação

Material de estudo da arquitetura deste projeto. Cada documento explica **por
que** as decisões foram tomadas, não só o que foi feito — a ideia é que você
consiga defender cada uma delas sem consultar o código.

| # | Documento | Sobre |
|---|---|---|
| 01 | [Arquitetura](01-arquitetura.md) | Visão geral, fluxo de dados, as três decisões estruturais |
| 02 | [Design system](02-design-system.md) | Camadas de token, por que a regra é verificada, Tailwind v4 |
| 03 | [Agente e harness](03-agente-e-harness.md) | O laço, ferramentas, guardrails, observabilidade |
| 04 | [RAG](04-rag.md) | Busca vetorial, chunking, quando **não** usar RAG |
| 05 | [Evals](05-evals.md) | Como qualificar o agente com promptfoo |

## Como usar isto numa entrevista

Cada documento tem uma seção **"Se perguntarem"** com as perguntas prováveis e
respostas curtas. Não decore — entenda o raciocínio, porque a pergunta seguinte
quase sempre é "e por que não fez do outro jeito?".

## O contexto que muda tudo

Este projeto **não é uma Pokédex**. É o companion digital de um jogo de
tabuleiro. A tela responde uma pergunta específica de mesa:

> *"Quais Pokémon aprendem ataque de fogo, e com que valor?"*

Confundir os dois leva a decisões erradas em cascata — já aconteceu uma vez
neste repositório e custou uma reescrita. Os números não são o dano da série:
são valores convertidos pela regra do jogo. Detalhes em
[CLAUDE.md](../CLAUDE.md).
