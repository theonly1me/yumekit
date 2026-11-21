import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const themeKey = "yumekit-theme";

export function readTheme(): Theme {
  try {
    return window.localStorage.getItem(themeKey) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
    try {
      window.localStorage.setItem(themeKey, theme);
    } catch {
      return;
    }
  }, [theme]);

  return { theme, setTheme };
}
