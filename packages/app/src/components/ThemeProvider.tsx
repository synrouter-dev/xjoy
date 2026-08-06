"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";
type ResolvedTheme = Theme | "system";

interface ThemeContextValue {
  theme: ResolvedTheme;
  resolved: Theme;
  setTheme: (t: ResolvedTheme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "xjoy-theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored;
  } catch {
    // localStorage not available
  }
  return "system";
}

function resolveTheme(pref: ResolvedTheme): Theme {
  if (pref === "system") return getSystemTheme();
  return pref;
}

function applyThemeClass(resolved: Theme) {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ResolvedTheme>("system");
  const [resolved, setResolved] = useState<Theme>("light");

  // Initialize on mount
  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    const r = resolveTheme(stored);
    setResolved(r);
    applyThemeClass(r);
  }, []);

  const setTheme = useCallback((t: ResolvedTheme) => {
    setThemeState(t);
    const r = resolveTheme(t);
    setResolved(r);
    applyThemeClass(r);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // localStorage not available
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const r: Theme = e.matches ? "dark" : "light";
      setResolved(r);
      applyThemeClass(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
