# 04 — RAG

> **Estado:** implementado e rodando. 116 chunks indexados a partir de docs/,
> CLAUDE.md, PLANO.md e das descrições de talentos e habilidades.
>
> 
>
> Custo da indexação completa: **US$ 0,0004**.

## O que RAG resolve — e o que não resolve

RAG (*Retrieval-Augmented Generation*) serve para dar ao modelo acesso a texto
que ele não viu no treino. O fluxo:

```
documento → pedaços → embedding → banco vetorial
pergunta  → embedding → busca por similaridade → pedaços → contexto do modelo
```

**A decisão mais importante deste projeto sobre RAG foi onde não usá-lo.**

| Pergunta | Ferramenta certa | Por quê |
|---|---|---|
| "Quem aprende ataque de fogo com valor 10?" | SQL | Precisa filtrar, ordenar e contar |
| "Quantos Pokémon têm mais de 5 ataques?" | SQL | Vetor não conta |
| "Como uso o componente Button?" | RAG | Resposta é texto livre |
| "Qual token controla a elevação do card?" | RAG | Idem |

Embedding mede **semelhança semântica**. Perguntar "quem bate 10 de fogo" a um
índice vetorial devolve os trechos mais parecidos com a frase — provavelmente um
parágrafo explicando a regra de conversão, não a lista de Pokémon.

Vetor não conta, não ordena, não filtra e não compara. Jogar tabela em índice
vetorial é o erro clássico de quem está começando, e evitá-lo explicitamente é
um ponto forte numa conversa técnica.

## O que vai para o índice

Só texto não-estruturado:

- os documentos desta pasta (`docs/*.md`);
- a documentação de cada componente do design system;
- `CLAUDE.md` e as regras narrativas do jogo.

O efeito colateral é valioso: o agente passa a **documentar o próprio design
system**. "Como uso o Button?" vira uma pergunta respondível dentro do produto.

## Chunking

A decisão que mais afeta qualidade, e a menos discutida.

**Estratégia: por heading, preservando a hierarquia.**

```
docs/02-design-system.md
  └─ "As três camadas" → "Camada 2 — semântica"
       conteúdo do trecho…
```

Cada pedaço carrega o caminho de títulos (`heading_path`). Duas razões:

1. **Contexto.** Um trecho solto dizendo "é esta indireção que faz o tema
   escuro existir" não diz de que indireção se trata. Com o caminho, o modelo
   sabe.
2. **Citação.** A resposta pode dizer *de onde* veio, e a pessoa confere.

Alternativas descartadas:

| Estratégia | Problema |
|---|---|
| Tamanho fixo (ex.: 512 tokens) | Corta no meio de uma frase e de um bloco de código |
| Documento inteiro | Estoura contexto e dilui a similaridade |
| Por parágrafo | Perde a relação entre parágrafos da mesma seção |

Blocos de código nunca são divididos: metade de um exemplo é pior que exemplo
nenhum.

## Embeddings

O OpenRouter expõe `/api/v1/embeddings`, compatível com a interface da OpenAI —
então **chat e embedding usam a mesma chave**. Não é preciso um segundo
fornecedor.

```ts
const { data } = await llm.embeddings.create({
  model: env.OPENROUTER_EMBEDDING_MODEL,
  input: chunks.map(c => c.content),
});
```

A coluna é `vector(1024)`, tamanho do `embed-v1` da Cohere e do Qwen3-Embedding.

> **Cuidado:** trocar de modelo de embedding exige **recriar a coluna e
> reindexar tudo**. Vetores de modelos diferentes não são comparáveis — a
> similaridade entre eles é ruído. Por isso o embedder fica atrás de uma
> interface no código: a troca é possível, mas é uma migração, não uma
> configuração.

## Busca

O cliente JS do Supabase não expressa o operador `<=>` do pgvector, então a
busca vive numa função e é chamada por RPC:

```sql
create function match_chunks (
  query_embedding vector(1024),
  match_count     integer default 5,
  filter_kind     text default null
) returns table (content text, heading_path text, title text, path text, similarity float)
language sql stable as $$
  select c.content, c.heading_path, d.title, d.path,
         1 - (c.embedding <=> query_embedding) as similarity
  from document_chunks c
  join documents d on d.id = c.document_id
  where filter_kind is null or d.kind = filter_kind
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
```

`<=>` é distância de cosseno (0 = idêntico). A função devolve `1 - distância`,
que é o número que faz sentido para quem consome.

### Por que HNSW e não IVFFlat

| Índice | Como funciona | Quando usar |
|---|---|---|
| IVFFlat | Agrupa vetores em listas; busca só nas mais próximas | Volumes grandes, e **exige treino** sobre dados já carregados |
| HNSW | Grafo navegável em camadas | Funciona desde o primeiro registro; mais memória |

Com poucas centenas de chunks — nosso caso — o IVFFlat degrada para busca
linear de qualquer forma, e ainda exige o passo de treino. HNSW é a escolha
óbvia nesta escala.

## O que falta implementar

1. `scripts/ingest-docs.ts` — percorre `docs/` e o design system, divide por
   heading, gera embeddings, grava
2. Ferramenta `buscar_documentacao` no registro do agente
3. Reindexação: por ora manual; um hook de commit seria o passo seguinte

## Se perguntarem

**"Por que não colocou os Pokémon no RAG?"**
Porque a pergunta típica é de filtro e ordenação, e vetor não faz nenhuma das
duas. RAG mede semelhança semântica; `WHERE game_power = 10` mede verdade.

**"Como escolheu o tamanho do chunk?"**
Não escolhi tamanho — escolhi fronteira. Divido por heading e preservo a
hierarquia, porque o corte por contagem de tokens rompe frase e bloco de código
no meio.

**"E se quisesse trocar o modelo de embedding?"**
É migração, não configuração: precisa recriar a coluna e reindexar, porque
vetores de modelos diferentes não são comparáveis. Por isso o embedder está
atrás de uma interface.

**"Como sabe se o RAG está funcionando?"**
Pelos evals — um conjunto de perguntas sobre a documentação com verificação de
que a fonte citada é a correta. Ver [05](05-evals.md).
