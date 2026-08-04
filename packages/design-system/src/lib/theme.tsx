import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Tema claro/escuro.
 *
 * Três valores, não dois: além de `light` e `dark` existe `system`, que
 * acompanha a preferência do sistema operacional. Um seletor com apenas duas
 * opções obriga quem usa o modo automático a escolher um lado e perder o
 * ajuste que já tinha configurado no aparelho.
 *
 * O tema resolvido vira o atributo `data-theme` no `<html>` — o mesmo gancho
 * que a camada 2 usa para reapontar os tokens.
 */

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "pokedex-theme";

interface ThemeContextValue {
  /** O que a pessoa escolheu. */
  preference: ThemePreference;
  /** O que está de fato aplicado (com `system` já resolvido). */
  theme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readStoredPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Acompanha a preferência do SO *enquanto a aba está aberta*. Sem este
  // listener, quem tem troca automática ao anoitecer veria a página continuar
  // clara até dar refresh.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const theme: ResolvedTheme =
    preference === "system" ? systemTheme : preference;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    // `color-scheme` faz o navegador pintar no tom certo o que não é nosso:
    // barra de rolagem, campos nativos, autofill.
    root.style.colorScheme = theme;
  }, [theme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    setPreference(theme === "dark" ? "light" : "dark");
  }, [theme, setPreference]);

  const value = useMemo(
    () => ({ preference, theme, setPreference, toggle }),
    [preference, theme, setPreference, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme precisa estar dentro de <ThemeProvider>");
  }
  return context;
}

/**
 * Script anti-flash.
 *
 * Precisa rodar **antes** da primeira pintura, injetado no `<head>` de forma
 * síncrona. O React só monta depois do bundle carregar; se o tema fosse
 * aplicado apenas no `useEffect`, quem escolheu escuro veria um lampejo branco
 * a cada carregamento — o "flash of wrong theme".
 *
 * Uso, em index.html:
 *   <script>{THEME_INIT_SCRIPT}</script>
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = (stored === 'light' || stored === 'dark')
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    /* localStorage bloqueado (modo privado, cookies desativados):
       segue no tema claro em vez de derrubar a página. */
  }
})();
`.trim();
