import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** Existing key; the legacy app wrote only 'light' | 'dark'. */
export const THEME_STORAGE_KEY = 'mia_theme_mode';

const DARK_QUERY = '(prefers-color-scheme: dark)';

interface ThemeContextValue {
  /** User choice: 'light' | 'dark' | 'system'. */
  mode: ThemeMode;
  /** Theme actually applied ('system' resolved through the OS preference). */
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Reads the persisted mode. Legacy 'light'/'dark' are valid as-is; anything else falls back to 'system'. */
function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function getSystemTheme(): ResolvedTheme {
  try {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  // Legacy: `dark:` variants and old ternaries rely on the `.dark` class (removed in L10).
  root.classList.toggle('dark', theme === 'dark');
  document.body?.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({children}: {children: ReactNode}) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Follow OS changes live (only matters while mode === 'system').
  useEffect(() => {
    let media: MediaQueryList;
    try {
      media = window.matchMedia(DARK_QUERY);
    } catch {
      return;
    }
    const onChange = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: ResolvedTheme = mode === 'system' ? systemTheme : mode;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable: theme still applies for this session.
    }
  }, []);

  const value = useMemo(() => ({mode, resolvedTheme, setMode}), [mode, resolvedTheme, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
}
