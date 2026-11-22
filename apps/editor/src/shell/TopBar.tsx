import type { Theme } from "./useTheme.js";
import { ViewButtons, type BarViewId } from "./ViewButtons.js";

export function TopBar(props: {
  projectName: string;
  theme: Theme;
  onTheme: (theme: Theme) => void;
  exportLabel: string;
  onStepView: (stepId: Exclude<BarViewId, "cast">) => void;
  onCast: () => void;
  onSettings: () => void;
  onExport: () => void;
}) {
  const otherTheme = props.theme === "dark" ? "light" : "dark";
  return (
    <header className="editor-bar">
      <div className="identity">
        <p className="wordmark">yumekit</p>
        <p className="project-name">{props.projectName}</p>
      </div>
      <div className="bar-actions">
        <button
          type="button"
          className="tab theme-switch"
          onClick={() => {
            props.onTheme(otherTheme);
          }}
        >
          Use the {otherTheme} theme
        </button>
        <ViewButtons
          onView={(viewId) => {
            if (viewId === "cast") props.onCast();
            else props.onStepView(viewId);
          }}
        />
        <button type="button" onClick={props.onSettings}>
          Settings
        </button>
        <button type="button" className="primary" onClick={props.onExport}>
          {props.exportLabel}
        </button>
      </div>
    </header>
  );
}
