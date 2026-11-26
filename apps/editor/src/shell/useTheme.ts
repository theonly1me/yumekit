import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const themeKey = "yumekit-theme";

export function readTheme(): Theme {
  try {
    return window.localStorage.getItem(themeKey) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

const store: { theme: Theme | undefined; listeners: Set<() => void> } = {
  theme: undefined,
  listeners: new Set(),
};

function shownTheme(): Theme {
  store.theme ??= readTheme();
  return store.theme;
}

function subscribe(listener: () => void): () => void {
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

function setTheme(theme: Theme): void {
  store.theme = theme;
  document.documentElement.dataset["theme"] = theme;
  for (const listener of store.listeners) listener();
  try {
    window.localStorage.setItem(themeKey, theme);
  } catch {
    return;
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, shownTheme);
  return { theme, setTheme };
}
