export type Theme = "dark" | "light";

const THEME_KEY = "cm_theme_v1";

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function getTheme(): Theme {
  const v = safeGetItem(THEME_KEY);
  return v === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  safeSetItem(THEME_KEY, theme);
}

let bound = false;

export function initThemeToggle() {
  if (bound) return;
  bound = true;

  const toggle = document.querySelector<HTMLInputElement>("#themeToggle");
  if (!toggle) return;

  const initial = getTheme();
  applyTheme(initial);
  toggle.checked = initial === "light";

  toggle.addEventListener("change", () => {
    const next: Theme = toggle.checked ? "light" : "dark";
    applyTheme(next);
  });
}
