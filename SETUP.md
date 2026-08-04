# Setup — o que você precisa fazer fora do código

> Tudo aqui é ação sua (conta, chave, clique). O resto eu faço no código.
> Marque conforme for concluindo e me avise — algumas fases ficam bloqueadas sem esses itens.

---

## ✅ Passo 0 — Ferramentas locais (já resolvido)

Verifiquei na sua máquina, está tudo instalado:

| Ferramenta | Versão | Status |
|---|---|---|
| Node | v24.11.1 | ✅ |
| pnpm | 9.0.0 | ✅ |
| git | 2.52.0 | ✅ |
| .NET | 10.0.302 | ✅ (só para o legado) |

**Nada para instalar.** Podemos começar a Fase 0 imediatamente.

---

## 🔴 Passo 1 — Supabase (bloqueia as Fases 2, 4 e 5)

1. Acesse **https://supabase.com** → *Start your project* → login com GitHub
2. *New project*
   - **Name:** `pokedex`
   - **Database Password:** gere uma forte e **guarde** (vai no `.env`)
   - **Region:** `South America (São Paulo)` — menor latência daqui
   - **Plan:** Free (suficiente de sobra)
3. Espere ~2 min de provisionamento
4. **Settings → API** e copie os 3 valores:
   - `Project URL` → `SUPABASE_URL`
   - `anon` / `public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
5. **Database → Extensions** → procure `vector` → **Enable**
   *(é o pgvector, necessário para o RAG da Fase 5)*

> ⚠️ A `service_role` key ignora todas as regras de segurança do banco. Ela só pode existir no
> `.env` do backend, **nunca** no front. Vou garantir isso na estrutura, mas vale você saber por quê —
> é uma pergunta comum de entrevista.

**Me mande:** `SUPABASE_URL` + as duas keys.

---

## 🔴 Passo 2 — OpenRouter (bloqueia as Fases 4, 5 e 6)

1. Acesse **https://openrouter.ai** → *Sign in* (GitHub ou Google)
2. **Credits** → adicione crédito
   - **US$ 5 é mais que suficiente** para todo o desenvolvimento e a demo
   - Nosso uso previsto: agente com modelo intermediário + embeddings ≈ centavos por sessão
3. **Keys** → *Create Key*
   - **Name:** `pokedex-agent`
   - **Credit limit:** defina `5` — trava de segurança caso algo entre em loop
4. Copie a key (`sk-or-v1-...`) — ela **só aparece uma vez**

**Me mande:** a key do OpenRouter.

> Por que OpenRouter e não a API direta de um vendor: uma key, um faturamento e troca de modelo por
> string de configuração. Dá para rodar o mesmo eval contra 4 modelos diferentes e comparar custo
> versus qualidade — isso vira slide de entrevista.

---

## 🟡 Passo 3 — Arquivo `.env` (faço eu, você só confere)

Quando você me mandar as chaves, eu crio:

```
apps/api/.env          ← chaves reais (entra no .gitignore)
apps/api/.env.example  ← template sem valor (esse sim vai pro git)
```

**Como me mandar as chaves:** cole aqui no chat normalmente. Depois de eu gravar no `.env`,
se quiser zerar o rastro é só rotacionar as duas keys nos respectivos painéis — leva 30 segundos
e não quebra nada, já que estarão lidas do arquivo.

---

## 🟢 Passo 4 — Claude Design (opcional, mas recomendado)

Você perguntou como usar. **Já testei o acesso e está funcionando** — sua conta tem permissão,
só não existe nenhum projeto de design system criado ainda.

Como funciona: é um espaço em **claude.ai/design** onde o design system fica publicado como
galeria visual navegável — cada componente vira um card com preview renderizado. Eu sincronizo
do código para lá.

**O que você faz:** nada agora. Na Fase 1, quando os componentes existirem, eu crio o projeto e
faço o push. Você abre `claude.ai/design`, revisa visualmente e me diz o que ajustar.

**Por que vale a pena:** você chega na entrevista com um **link** do design system em vez de um
`localhost`. Storybook mostra a engenharia; essa galeria mostra a apresentação. As duas juntas
cobrem os dois perfis de entrevistador.

---

## ⚪ Passo 5 — Figma / Pencil / CodePen

**Minha recomendação: não criar nada.** Não é preguiça, é estratégia.

Com 2 dias, desenhar no Figma e depois reimplementar em código é fazer o trabalho duas vezes.
E para uma vaga de **front-end** com design system, o código *é* a fonte da verdade — os tokens
vivem em CSS, não em variáveis do Figma.

Se numa entrevista perguntarem "cadê o Figma?", a resposta boa é:
> *"O design system é code-first. Os tokens são a fonte de verdade em CSS custom properties e o
> Storybook é a documentação viva — não existe risco de o Figma divergir do que está em produção."*

Isso é uma posição defensável e cada vez mais comum em times maduros de DS.

**Fontes** (Inter + a serifada de display): via Google Fonts / Fontsource, `pnpm add`, sem conta.

---

## ⚪ Passo 6 — Vercel (opcional, só se quiser link público)

Já existe um `vercel.json` no projeto, então provavelmente você já tem conta.

Se quiser o projeto no ar para mandar o link junto do currículo:
1. **https://vercel.com** → *Add New Project* → importe o repositório
2. Root directory: `apps/web`
3. Cole as variáveis de ambiente **públicas** (`VITE_*`) em *Settings → Environment Variables*

Deixa para o final. Deploy no meio de refatoração só rouba tempo.

---

## Ordem sugerida

```
Agora        →  Passos 1 e 2 (Supabase + OpenRouter)  ~15 min
Em paralelo  →  eu começo a Fase 0 + Fase 1, que não dependem de chave nenhuma
Depois       →  Passo 4 no meio da Fase 1
No fim       →  Passo 6, se quiser
```

**Você não precisa esperar nada para eu começar.** As duas primeiras fases — que são as mais
importantes para a entrevista — rodam inteiras sem nenhuma credencial.
