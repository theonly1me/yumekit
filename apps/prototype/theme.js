const themeKey = "yumekit-design-theme";

export function storedTheme() {
  try {
    return localStorage.getItem(themeKey) ?? "dark";
  } catch {
    return "dark";
  }
}

export function currentTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const strip = document.getElementById("theme");
  if (strip !== null) {
    strip.textContent =
      theme === "dark" ? "Show the light version" : "Show the dark version";
  }
  try {
    localStorage.setItem(themeKey, theme);
  } catch {
    return;
  }
}
