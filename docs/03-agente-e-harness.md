# 03 — Agente e harness

## O que é um harness

Uma chamada de LLM não é um agente. Você manda um texto, recebe um texto,
acabou.

**Harness é o laço em volta** — o que transforma "chamar um modelo" em "um
agente que resolve tarefas":

```
1. monta o contexto     → system prompt + histórico + ferramentas disponíveis
2. chama o modelo
3. a resposta tem tool_call?
      não  → é a resposta final, encerra
      sim  → valida os argumentos
             executa a ferramenta
             anexa o resultado ao histórico
             volta ao passo 2
4. guardrails a cada volta: maxSteps · orçamento de tokens · timeout
5. cada passo vira registro no banco
```

Está em [`harness.ts`](../apps/api/src/agent/harness.ts), ~200 linhas.

### Por que escrever à mão

Existem frameworks que fazem isso (LangChain, o Agents SDK da OpenAI). Duas
razões para não usar aqui:

**Prática.** Este laço é onde moram as decisões que definem custo, latência e
confiabilidade — quantos passos, o que fazer com argumento inválido, quando
desistir. Esconder isso atrás de `agent.run()` significa não poder ajustá-las
quando a conta chegar alta ou a resposta vier errada.

**De portfólio.** O laço é o que se explica numa entrevista. "Usei LangChain" e
"escrevi o loop de tool-calling com guardrails de passo, token e tempo" são
conversas muito diferentes.

---

## A camada de LLM

```ts
export const llm = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",   // ← só isto muda
});
```

O OpenRouter expõe a mesma interface da OpenAI, então o SDK oficial funciona
trocando a `baseURL`. Ganhamos tipagem, streaming, retry com recuo exponencial
e paginação de graça.

**Por que OpenRouter e não a API direta de um fornecedor:** uma chave e uma
fatura para dezenas de modelos, e trocar de modelo vira mudança de variável de
ambiente:

```bash
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5
```

É o que torna viável rodar o mesmo conjunto de evals contra quatro modelos e
comparar custo versus qualidade. Com a API de um fornecedor só, cada
comparação exigiria outro SDK, outra conta e outro código.

---

## Ferramentas

Cada uma declara os argumentos em Zod:

```ts
{
  name: "buscar_pokemon",
  description: "Busca Pokémon por nome, tipo do Pokémon ou tipo de ataque…",
  schema: z.object({
    tipo_de_ataque: z.string().optional().describe("Tipo do ataque, ex.: 'fire'"),
    poder_minimo: z.number().min(8).max(10).optional(),
    limite: z.number().min(1).max(50).default(20),
  }),
  execute: async (args) => { /* SQL */ },
}
```

Uma definição serve a dois propósitos: **descreve** a função para o modelo
(convertida em JSON Schema) e **valida** o que ele devolveu antes de executar.
Sem a validação, um argumento alucinado vira uma query malformada.

### Um bug pego antes de rodar

```ts
z.toJSONSchema(schema)                    // required: ["limite"]  ✗
z.toJSONSchema(schema, { io: "input" })   // required: []          ✓
```

O Zod 4 gera por padrão o schema do tipo **saída**, onde um campo com
`.default()` sempre existe — e portanto aparece em `required`. O modelo passaria
a ser obrigado a inventar um valor para `limite` em toda chamada, em vez de
deixar o padrão agir.

É o tipo de defeito que não quebra nada visivelmente: só degrada a qualidade das
chamadas de forma silenciosa.

### As cinco ferramentas

| Ferramenta | Responde |
|---|---|
| `buscar_pokemon` | "Quem aprende ataque de fogo com valor 10?" |
| `ficha_do_pokemon` | "Mostra o Charizard" |
| `vantagem_de_tipo` | "Contra o que fantasma tem vantagem?" |
| `talentos_do_tipo` | "Quais talentos de aço existem?" |
| `explicar_regra_de_conversao` | "Por que vale 8 e não 3?" |

Todas com SQL. Nenhuma com RAG — ver [01](01-arquitetura.md#2-dado-estruturado-vai-para-tabela-texto-vai-para-vetor).

---

## Guardrails

O que impede o agente de custar caro ou travar:

| Proteção | Padrão | Do quê protege |
|---|---|---|
| `maxSteps` | 8 | Laço infinito de ferramenta |
| `tokenBudget` | 30.000 | Conta surpresa |
| `timeoutMs` | 60.000 | Execução pendurada |
| Timeout por ferramenta | 10.000 | Uma consulta lenta segurando tudo |
| `maxRetries` do SDK | 2 | Instabilidade passageira |

### Erro de argumento não derruba a execução

```ts
const parsed = tool.schema.safeParse(args);
if (!parsed.success) {
  return { erro: "Argumentos inválidos", detalhes: [...] };   // ← retorna
}
```

Retorna como **resultado da ferramenta**, não como exceção. O modelo lê a
mensagem e costuma corrigir sozinho na volta seguinte. Lançar transformaria um
erro recuperável em falha da conversa inteira.

O mesmo vale para "Pokémon não encontrado": devolver `{ erro: "..." }` legível
permite ao modelo pedir o nome certo à pessoa.

### `tool_choice: "auto"`, não `"required"`

Muita pergunta ("o que você faz?") não precisa de ferramenta nenhuma. Forçar
chamada gera consulta inútil e gasta tokens.

---

## O system prompt

Fica em [arquivo próprio e versionado](../apps/api/src/agent/prompt.ts), não
embutido no harness. Motivo: é o artefato que mais muda, e nos evals a
comparação entre versões só faz sentido se cada uma for um commit isolável.

O conteúdo ataca o problema específico deste domínio:

> Este NÃO é o jogo eletrônico nem a série. Números e mecânicas que você conhece
> da franquia frequentemente NÃO valem aqui.
>
> 1. O valor de um ataque é 8, 9 ou 10 — nunca o dano da série.
> 2. A tabela de vantagens é a do tabuleiro. 'ghost' também acerta 'ghost'.
>    Nunca responda vantagem de memória — consulte a ferramenta.

Isto é o ponto mais delicado do projeto em IA: **o modelo conhece Pokémon**. Ele
sabe que Lança-chamas tem 90 de poder e que fantasma não acerta fantasma. Esse
conhecimento prévio está *errado* neste contexto, e um modelo confiante produz
respostas erradas com aparência de certas — o pior resultado possível numa mesa
em andamento.

Por isso o prompt insiste em consultar antes de afirmar, e por isso os evals
(Fase 6) testam justamente esses casos.

---

## Observabilidade

Cada execução vira uma linha em `agent_runs`; cada passo, uma em `agent_steps`.

```sql
agent_runs   id · user_message · final_answer · model
             total_tokens · cost_usd · latency_ms · status
agent_steps  run_id · step_index · role · tool_name
             tool_args · tool_result · latency_ms
```

Não é enfeite:

1. **alimenta os evals** — dá para conferir se a ferramenta certa foi chamada
   com os argumentos certos, sem instrumentar o teste;
2. **custo real**, vindo do OpenRouter em `usage.cost` — não estimativa nossa
   com uma tabela de preços que envelhece;
3. **depuração** — quando alguém diz "o bot errou", existe o passo a passo do
   que ele consultou. Sem isso, depurar agente é adivinhação.

Falha de trace nunca derruba a execução. Observabilidade que quebra o produto
observado é pior que observabilidade nenhuma.

Resultados grandes são truncados em 4 KB antes de gravar — preserva o que
importa para depuração (argumentos e forma da resposta) sem inchar o banco.

---

## Streaming até a interface

`POST /agent/chat` responde em SSE. **Não** WebSocket: o fluxo é de mão única,
e SSE reconecta sozinho, passa por qualquer proxy HTTP e não exige protocolo
novo.

### Por que o cliente não usa `EventSource`

A API nativa do navegador **só faz GET** e não aceita corpo. Nosso endpoint é
POST com a pergunta no corpo — mandá-la na query string a exporia em log de
servidor e histórico de proxy.

Então o protocolo é parseado à mão sobre `fetch`, e há um detalhe que quebra
implementações ingênuas:

> **Um chunk da rede não é um evento.** Um evento pode chegar partido em dois
> chunks; dois eventos podem vir no mesmo chunk.

Por isso o buffer acumula e só corta em `\n\n`. Processar chunk a chunk produz
JSON truncado de forma intermitente — o bug clássico aqui.

Verificado com um stream adversarial: JSON partido ao meio remontado com
argumentos intactos, dois eventos num chunk, e o separador dividido entre
chunks.

### Eventos de ferramenta vão para a tela

O painel mostra "Buscando Pokémon…" enquanto o modelo trabalha. Duas razões:

- sem isso o agente fica mudo por segundos encadeando ferramentas e parece
  travado;
- torna o comportamento **auditável na demonstração** — dá para mostrar que a
  resposta veio do banco, e não da memória do modelo.

---

## Se perguntarem

**"O que exatamente é o harness?"**
O laço de tool-calling com os guardrails em volta. Recebe a mensagem, chama o
modelo, e enquanto vier `tool_call` valida os argumentos, executa, anexa o
resultado e chama de novo — respeitando teto de passos, de tokens e de tempo, e
gravando cada passo.

**"Por que não LangChain?"**
Porque o laço é onde estão as decisões de custo e confiabilidade, e eu queria
poder ajustá-las. Além disso é o que consigo explicar — usar framework aqui
esconderia justamente a parte que demonstra entendimento.

**"Como você evita alucinação?"**
Três camadas. O prompt proíbe responder de memória e explica por que o
conhecimento prévio do modelo está errado neste domínio. As ferramentas são a
única fonte de número. E os evals medem se funcionou, em vez de eu supor.

**"E se o modelo chamar a ferramenta errada?"**
O trace registra qual foi chamada com quais argumentos, e há um conjunto de eval
que assere exatamente isso. É uma métrica, não uma impressão.

**"Como controla custo?"**
Orçamento de tokens por execução, teto de passos, `tool_choice: "auto"` para não
forçar chamada desnecessária, e o custo real de cada execução gravado — dá para
ver a média por conversa em vez de descobrir na fatura.
