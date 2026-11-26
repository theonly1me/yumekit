import { useTheme, type Theme } from "../shell/useTheme.js";

const themeChoices: [Theme, string][] = [
  ["dark", "Dark"],
  ["light", "Light"],
];

export function ThemeRow() {
  const { theme, setTheme } = useTheme();
  return (
    <section className="setting-group">
      <div className="setting-row">
        <span>
          Dark or light
          <em>Dark is the default. The choice applies to every screen.</em>
        </span>
        <div className="theme-choices" role="group" aria-label="Dark or light">
          {themeChoices.map(([id, name]) => (
            <button
              type="button"
              key={id}
              aria-pressed={theme === id}
              onClick={() => {
                setTheme(id);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
