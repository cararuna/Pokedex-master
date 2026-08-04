import { getTypeIcon, TYPE_LABELS, type GameType } from "../../game/rules";

/**
 * Símbolo de tipagem do jogo de tabuleiro.
 *
 * São as mesmas imagens das cartas físicas — por isso permanecem PNG, e não
 * viram ícone genérico do design system. O sistema governa cor, espaço e
 * forma ao redor; o símbolo em si é identidade anterior a ele e é preservado.
 *
 * `decorative` por padrão: numa lista de golpes o nome do tipo já está no
 * texto ao lado, e repeti-lo faria o leitor de tela anunciar tudo duas vezes.
 */
interface Props {
  type: GameType;
  size?: number;
  decorative?: boolean;
  className?: string;
}

export function TypeIcon({ type, size = 16, decorative = true, className }: Props) {
  return (
    <img
      src={getTypeIcon(type)}
      alt={decorative ? "" : TYPE_LABELS[type]}
      aria-hidden={decorative || undefined}
      width={size}
      height={size}
      loading="lazy"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
