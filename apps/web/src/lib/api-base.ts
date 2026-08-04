/**
 * A URL base da API, em um lugar só.
 *
 *   desenvolvimento   http://localhost:8787   front e API em portas distintas
 *   produção          /api                    mesmo domínio, sem CORS
 *
 * A base relativa em produção não é detalhe: com domínio absoluto, cada
 * preview deploy da Vercel apontaria para a API de produção, e trocar de
 * domínio exigiria rebuild. Relativa, cada deploy fala com a própria API.
 *
 * Isto mora num módulo próprio porque já divergiu uma vez. O cliente do
 * catálogo tinha o `import.meta.env.DEV ? … : "/api"`; o do agente tinha só
 * `?? "http://localhost:8787"`. Publicado, o catálogo funcionava e o agente
 * aparecia como "API offline" — o navegador de quem visitava o site tentava
 * falar com a porta 8787 da própria máquina. Duas cópias de uma regra é uma
 * cópia a mais.
 */
export const API_BASE: string =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:8787" : "/api");
