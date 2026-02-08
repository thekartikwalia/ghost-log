// GhostLog theme: light / dark / system. Persisted in localStorage for instant apply before React.

const THEME_KEY = "ghostlog_theme";
export type ThemePreference = "light" | "dark" | "system";

export function getTheme(): ThemePreference {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "light" || t === "dark" || t === "system") return t;
  } catch {
    // ignore
  }
  return "system";
}

export function setTheme(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, preference);
  } catch {
    // ignore
  }
  applyTheme(preference);
}

function isDark(preference: ThemePreference): boolean {
  if (preference === "dark") return true;
  if (preference === "light") return false;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(preference: ThemePreference): void {
  if (typeof document === "undefined") return;
  const dark = isDark(preference);
  document.documentElement.classList.toggle("dark", dark);
}

/** Call once on app load to sync class with stored preference (e.g. after user changed in Options). */
export function initTheme(): void {
  applyTheme(getTheme());
}
