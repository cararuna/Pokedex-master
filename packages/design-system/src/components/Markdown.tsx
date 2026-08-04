import { Fragment, type ReactNode } from "react";

/**
 * Markdown renderizado com os tokens do sistema.
 *
 * ── Por que existe ──────────────────────────────────────────────────────
 *
 * O agente responde em Markdown: listas de Pokémon, nomes em negrito, tabelas
 * de valores. Jogar isso num `whitespace-pre-wrap` mostrava `**Charizard**`
 * com os asteriscos à mostra — parecia saída de terminal, não conversa.
 *
 * ── Por que não `react-markdown` ────────────────────────────────────────
 *
 * Duas razões, e a segunda é a que importa.
 *
 * A primeira é peso: react-markdown mais remark-gfm passam de 40 kB gzip para
 * cobrir uma especificação inteira, quando o que chega aqui é o subconjunto
 * que um modelo de linguagem produz.
 *
 * A segunda é que o resultado precisa *ser* do design system. Com uma
 * biblioteca, cada elemento vira um `components={{ h1: ..., li: ... }}` de
 * override, e a estilização fica pendurada por fora. Aqui cada bloco nasce com
 * o token semântico certo, e o `Markdown` é um componente do sistema como
 * qualquer outro — com story, com tema claro e escuro.
 *
 * ── Segurança ───────────────────────────────────────────────────────────
 *
 * Nada de `dangerouslySetInnerHTML` em lugar nenhum: o texto vira elemento
 * React, e o React escapa tudo. HTML dentro do Markdown é exibido como texto,
 * que é o comportamento correto para conteúdo vindo de um modelo. O `href` de
 * link é filtrado por esquema — `javascript:` não passa.
 */

export interface MarkdownProps {
  children: string;
  className?: string;
}

/* ── Trechos de linha ─────────────────────────────────────────────────────── */

/**
 * A ordem das alternativas não é arbitrária: código cru vem primeiro para que
 * `**` dentro de crase continue sendo asterisco, e negrito antes de itálico
 * porque `**x**` também casa com a regra de um asterisco só.
 */
const TRECHO =
  /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(\*[^*\n]+\*)|(\[[^\]\n]*\]\([^)\s]+\))/;

/** Só http, https e mailto. Bloqueia `javascript:` e `data:`. */
function hrefSeguro(url: string): string | undefined {
  const limpo = url.trim();
  return /^(https?:|mailto:|\/|#)/i.test(limpo) ? limpo : undefined;
}

function inline(texto: string, chave = "i"): ReactNode[] {
  const saida: ReactNode[] = [];
  let resto = texto;
  let n = 0;

  while (resto.length > 0) {
    const m = TRECHO.exec(resto);
    if (!m || m.index === undefined) {
      saida.push(resto);
      break;
    }

    if (m.index > 0) saida.push(resto.slice(0, m.index));

    const [achado, codigo, forte2, forte1, italico, link] = m;
    const k = `${chave}-${n++}`;

    if (codigo) {
      saida.push(
        <code
          key={k}
          className="rounded-[var(--r-xs)] bg-surface-sunken px-1 py-0.5 font-mono text-[0.9em] text-text"
        >
          {codigo.slice(1, -1)}
        </code>,
      );
    } else if (forte2 || forte1) {
      const conteudo = (forte2 ?? forte1).slice(2, -2);
      saida.push(
        <strong key={k} className="font-semibold text-text">
          {conteudo}
        </strong>,
      );
    } else if (italico) {
      saida.push(
        <em key={k} className="italic">
          {italico.slice(1, -1)}
        </em>,
      );
    } else if (link) {
      const corte = link.indexOf("](");
      const rotulo = link.slice(1, corte);
      const url = hrefSeguro(link.slice(corte + 2, -1));
      saida.push(
        url ? (
          <a
            key={k}
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent-text underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]"
          >
            {rotulo}
          </a>
        ) : (
          <Fragment key={k}>{rotulo}</Fragment>
        ),
      );
    }

    resto = resto.slice(m.index + achado.length);
  }

  return saida;
}

/* ── Blocos ───────────────────────────────────────────────────────────────── */

type Item = { texto: string; nivel: number };

const MARCADOR = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const TITULO = /^(#{1,4})\s+(.*)$/;
const CITACAO = /^>\s?(.*)$/;
const REGUA = /^\s*([-*_])(\s*\1){2,}\s*$/;
const SEPARADOR_DE_TABELA = /^\s*\|?[\s:-]*\|[\s|:-]*$/;

function celulas(linha: string): string[] {
  return linha
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());
}

export function Markdown({ children, className }: MarkdownProps) {
  const linhas = children.replace(/\r\n/g, "\n").split("\n");
  const blocos: ReactNode[] = [];

  let i = 0;
  let n = 0;

  /** Junta linhas até o predicado falhar. Devolve o bloco e avança `i`. */
  function coletar(enquanto: (l: string) => boolean): string[] {
    const acc: string[] = [];
    while (i < linhas.length && enquanto(linhas[i])) acc.push(linhas[i++]);
    return acc;
  }

  while (i < linhas.length) {
    const linha = linhas[i];
    const k = `b-${n++}`;

    /* Linha em branco: separa blocos, não vira nada. */
    if (linha.trim() === "") {
      i++;
      continue;
    }

    /* Bloco de código cercado. Fecha no próximo ``` ou no fim do texto —
       resposta interrompida no meio do stream não pode derrubar o resto. */
    if (/^\s*```/.test(linha)) {
      const idioma = linha.replace(/^\s*```/, "").trim();
      i++;
      const corpo = coletar((l) => !/^\s*```/.test(l));
      if (i < linhas.length) i++;

      blocos.push(
        <pre
          key={k}
          className="overflow-x-auto rounded-[var(--r-sm)] border border-border-subtle bg-surface-sunken p-3"
          data-language={idioma || undefined}
        >
          <code className="font-mono text-xs leading-relaxed text-text">
            {corpo.join("\n")}
          </code>
        </pre>,
      );
      continue;
    }

    /* Régua. */
    if (REGUA.test(linha)) {
      i++;
      blocos.push(<hr key={k} className="border-border-subtle" />);
      continue;
    }

    /* Título. Começa em h4 porque isto vive dentro de uma conversa — a
       hierarquia da página já foi estabelecida por quem renderiza. */
    const titulo = TITULO.exec(linha);
    if (titulo) {
      i++;
      const grau = Math.min(titulo[1].length, 3);
      const tamanho = ["text-base", "text-sm", "text-sm"][grau - 1];
      blocos.push(
        <h4 key={k} className={`font-display font-semibold text-text ${tamanho}`}>
          {inline(titulo[2], k)}
        </h4>,
      );
      continue;
    }

    /* Tabela: cabeçalho, separador, corpo. Sem o separador é parágrafo. */
    if (linha.includes("|") && SEPARADOR_DE_TABELA.test(linhas[i + 1] ?? "")) {
      const cabecalho = celulas(linha);
      i += 2;
      const corpo = coletar((l) => l.includes("|") && l.trim() !== "");

      blocos.push(
        <div key={k} className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border">
                {cabecalho.map((c, x) => (
                  <th
                    key={x}
                    className="px-2 py-1.5 text-left font-mono text-2xs uppercase tracking-widest text-text-subtle"
                  >
                    {inline(c, `${k}-h${x}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corpo.map((l, y) => (
                <tr key={y} className="border-b border-border-subtle last:border-0">
                  {celulas(l).map((c, x) => (
                    <td key={x} className="px-2 py-1.5 align-top text-text">
                      {inline(c, `${k}-${y}-${x}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    /* Citação. */
    if (CITACAO.test(linha)) {
      const corpo = coletar((l) => CITACAO.test(l)).map(
        (l) => CITACAO.exec(l)![1],
      );
      blocos.push(
        <blockquote
          key={k}
          className="border-l-2 border-border-strong pl-3 text-text-muted"
        >
          {inline(corpo.join(" "), k)}
        </blockquote>,
      );
      continue;
    }

    /* Lista. Um nível de aninhamento, que é o que um modelo produz na
       prática; mais fundo que isso vira item do nível 1. */
    const marcador = MARCADOR.exec(linha);
    if (marcador) {
      const ordenada = /\d/.test(marcador[2]);
      const itens: Item[] = [];

      while (i < linhas.length) {
        const m = MARCADOR.exec(linhas[i]);
        if (!m) {
          // Linha solta logo abaixo de um item é continuação dele, não
          // parágrafo novo — é assim que o modelo quebra frase longa.
          if (linhas[i].trim() !== "" && itens.length > 0) {
            itens[itens.length - 1].texto += " " + linhas[i].trim();
            i++;
            continue;
          }
          break;
        }
        itens.push({ texto: m[3], nivel: m[1].length >= 2 ? 1 : 0 });
        i++;
      }

      const Lista = ordenada ? "ol" : "ul";
      blocos.push(
        <Lista
          key={k}
          className={[
            "flex flex-col gap-1 pl-5 text-text",
            ordenada ? "list-decimal" : "list-disc",
            "marker:text-text-subtle",
          ].join(" ")}
        >
          {itens.map((item, x) => (
            <li key={x} className={item.nivel ? "ml-4" : undefined}>
              {inline(item.texto, `${k}-${x}`)}
            </li>
          ))}
        </Lista>,
      );
      continue;
    }

    /* Parágrafo: tudo até a próxima linha em branco ou início de outro bloco. */
    const paragrafo = coletar(
      (l) =>
        l.trim() !== "" &&
        !MARCADOR.test(l) &&
        !TITULO.test(l) &&
        !CITACAO.test(l) &&
        !REGUA.test(l) &&
        !/^\s*```/.test(l),
    );

    blocos.push(
      <p key={k} className="text-text">
        {inline(paragrafo.join(" "), k)}
      </p>,
    );
  }

  return (
    <div
      className={[
        "flex flex-col gap-3 text-sm leading-relaxed",
        className ?? "",
      ].join(" ")}
    >
      {blocos}
    </div>
  );
}
