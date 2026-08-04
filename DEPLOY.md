# Deploy na Vercel

Um projeto só serve as duas coisas: o site estático (Vite) e a API do agente
(função serverless). Mesmo domínio, sem CORS.

```
seuprojeto.vercel.app/           → apps/web/dist       site
seuprojeto.vercel.app/api/*      → api/index.ts  API + agente
```

---

## Antes de tudo: o plano Hobby dá conta

**Variável de ambiente é grátis.** O limite é de 1.000 por ambiente, igual em
todos os planos.

O que pede Pro é **Custom Environments** — criar ambientes além de
Production / Preview / Development. Você não precisa disso. Se apareceu uma
tela de upgrade, você estava em *Settings → Environments*, que é outra coisa.

O lugar certo é **Settings → Environment Variables**.

> Uma ressalva honesta: o Hobby é para uso **pessoal, não comercial**. Portfólio
> se encaixa.

---

## 1. Publicar a branch

```bash
git push -u origin refactor/monorepo-design-system
```

A Vercel cria um **Preview Deployment** dessa branch, com URL própria. Bom para
testar antes de tocar em produção.

Para publicar em produção, faça o merge para `main` depois de validar o preview.

---

## 2. Root Directory

Fica em **Settings → Build and Deployment → Root Directory**.

Na interface atual ela **não está mais em Settings → General** — foi para
"Build and Deployment". Se não achar, use a busca do painel de settings: digite
`root`.

**O valor precisa ser vazio** (ou `./`). É a raiz do monorepo, não `apps/web`.

Por quê: a pasta `api/` fica na raiz. Apontar o root para `apps/web` esconderia
a função serverless e o site subiria sem agente.

Se o projeto já estava configurado com `apps/web` ou `Pokedex-master`, limpe o
campo.

---

## 3. Build, Output e Install

Na mesma tela, **Build and Deployment**:

| Campo | O que fazer |
|---|---|
| Framework Preset | `Vite` (ou `Other`) |
| Build Command | **desmarcar Override** — deixar a Vercel usar o `vercel.json` |
| Output Directory | **desmarcar Override** |
| Install Command | **desmarcar Override** |

O [`vercel.json`](vercel.json) na raiz já define os três:

```json
"installCommand": "pnpm install --frozen-lockfile",
"buildCommand": "pnpm --filter @pokedex/web build",
"outputDirectory": "apps/web/dist"
```

Se algum campo estiver com "Override" ligado no painel, ele **vence** o
`vercel.json`. É a causa mais comum de "build funciona local, quebra no deploy".

---

## 4. Variáveis de ambiente

**Settings → Environment Variables.** Adicione as cinco, marcando os três
ambientes (Production, Preview, Development):

| Nome | Valor |
|---|---|
| `SUPABASE_URL` | `https://vuzvfnoxirmwjibytpwg.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | a chave `sb_secret_…` |
| `OPENROUTER_API_KEY` | a chave `sk-or-v1-…` |
| `OPENROUTER_MODEL` | `google/gemini-2.5-flash` |
| `WEB_ORIGIN` | a URL do projeto, ex.: `https://pokedex-xxx.vercel.app` |

Sobre o modelo: o Gemini saiu **20× mais barato e 37% mais rápido** que o
Sonnet nos evals, com uma única falha, cosmética. Num site público a diferença
entre ~400 e ~8.000 perguntas com US$ 5 decide se a demonstração sobrevive.
Detalhes em [docs/05-evals.md](docs/05-evals.md).

`WEB_ORIGIN` você só sabe depois do primeiro deploy. Faça o deploy, copie a
URL, preencha e refaça o deploy.

> **Nenhuma dessas variáveis tem prefixo `VITE_`, e isso é proposital.** O que
> tem `VITE_` entra no bundle e vira público. A `service_role` ignora todo o
> RLS do banco — ela só pode existir no servidor.

---

## 5. Redeploy e verificação

**Deployments → ⋯ no último → Redeploy.**

Quando terminar, confira nesta ordem. Primeiro a sonda sem dependência nenhuma:

```bash
curl https://SEU-PROJETO.vercel.app/api/ping
```

```json
{"pong":true,"node":"v22.x.x","ambiente":"vercel"}
```

Ela existe para separar duas perguntas que o erro da Vercel mistura. Se
`FUNCTION_INVOCATION_FAILED` aparece **também no ping**, o problema é a
configuração da função — não o código da API, que o ping nem importa.

Depois o diagnóstico de verdade:

```bash
curl https://SEU-PROJETO.vercel.app/api/health
```

Esperado:

```json
{"ok":true,"catalogo":true,"agente":true,"model":"google/gemini-2.5-flash","ambiente":"vercel"}
```

| Resposta | Significa |
|---|---|
| `"agente": false` | Falta `OPENROUTER_API_KEY` |
| `503` com `faltando` | As variáveis listadas não estão cadastradas |
| `404` | Root Directory errado, ou a pasta `api/` não subiu |
| `FUNCTION_INVOCATION_FAILED` | A função quebrou antes de rodar qualquer rota — veja Runtime Logs, e compare com o `/api/ping` |

Depois, o catálogo:

```bash
curl "https://SEU-PROJETO.vercel.app/api/pokemon?tipo_de_ataque=fire&por_pagina=3"
```

E o agente:

```bash
curl -X POST https://SEU-PROJETO.vercel.app/api/agent/ask \
  -H "Content-Type: application/json" \
  -d '{"message":"Quem aprende ataque de fogo com valor 10?"}'
```

---

## Riscos conhecidos

**Sem limite de requisições.** `/api/agent/chat` está aberto. Alguém pode
chamar em laço e queimar o crédito do OpenRouter. Para um portfólio que fica
no ar alguns dias, aceitável. Se for ficar semanas, vale limitar por IP.

O teto de crédito configurado na chave do OpenRouter (US$ 5) é a rede de
segurança: no pior caso você perde o crédito, não abre uma fatura.

**Cold start.** A função dorme quando não é usada. A primeira pergunta depois
de um tempo ocioso leva alguns segundos a mais. Se for demonstrar ao vivo,
abra o site antes para aquecer.

**`maxDuration: 60`.** O Hobby permite até 60 segundos por invocação, e é o que
está configurado. O harness tem timeout interno de 60s, então uma consulta
muito longa pode ser cortada pela plataforma antes de terminar. Na prática as
respostas ficam entre 5 e 9 segundos.
