/**
 * @pokedex/design-system — superfície pública.
 *
 * Só o que está exportado aqui é API. Qualquer coisa alcançada por caminho
 * profundo (`@pokedex/design-system/src/components/...`) é interno e pode
 * mudar sem aviso.
 */

/* Componentes */
export { Button, buttonVariants, type ButtonProps } from "./components/Button";
export { Card, type CardProps } from "./components/Card";
export { Badge, type BadgeProps } from "./components/Badge";
export { Skeleton, type SkeletonProps } from "./components/Skeleton";
export { SearchField, type SearchFieldProps } from "./components/SearchField";
export { Select, type SelectProps, type SelectOption } from "./components/Select";
export { Table } from "./components/Table";
export { Tabs } from "./components/Tabs";
export { Dialog } from "./components/Dialog";
export { Tooltip, TooltipProvider, type TooltipProps } from "./components/Tooltip";
export {
  EmptyState,
  StatBar,
  Pagination,
  type EmptyStateProps,
  type StatBarProps,
  type PaginationProps,
} from "./components/Feedback";
export {
  TypeChip,
  getTypeLabel,
  POKEMON_TYPES,
  type PokemonType,
  type TypeChipProps,
} from "./components/TypeChip";

/* Primitivos de layout */
export {
  Stack,
  Inline,
  Container,
  CardGrid,
  Divider,
} from "./primitives/Layout";

/* Tema */
export {
  ThemeProvider,
  useTheme,
  THEME_INIT_SCRIPT,
  type ThemePreference,
  type ResolvedTheme,
} from "./lib/theme";

/* Utilitário */
export { cn } from "./lib/cn";
