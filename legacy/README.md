# Legado

## `pokedexAPI/` — API .NET 8 (v1)

Primeira versão do backend: ASP.NET Core 8 + EF Core + MySQL.

**Escopo real:** um `FavoritesController` (CRUD de favoritos) e o boilerplate `WeatherForecast`
gerado pelo template. O frontend nunca chegou a consumir — a chamada estava comentada
em `App.tsx`.

**Por que foi arquivado:** o harness do agente, o SDK da OpenAI e o cliente do Supabase são
naturais em TypeScript, e unificar a linguagem com o frontend reduz o custo de contexto do
projeto inteiro. A substituta é `apps/api` (Hono + TypeScript).

**Não é versionado neste monorepo.** A pasta mantém o próprio `.git` (repositório
independente, com remote no GitHub) e carrega ~300 DLLs em `bin/obj`. Está listada no
`.gitignore` da raiz — fica no disco como referência histórica, sem poluir o monorepo.
