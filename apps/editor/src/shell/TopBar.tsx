import type { Theme } from "./useTheme.js";
import { ViewButtons, type BarViewId } from "./ViewButtons.js";

export function TopBar(props: {
  projectName: string;
  theme: Theme;
  onTheme: (theme: Theme) => void;
  exportLabel: string;
  takesCount: number;
  onBackToProject: () => void;
  onTakes: () => void;
  onStepView: (
    stepId: Exclude<BarViewId, "cast" | "project" | "takes">,
  ) => void;
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
          takesCount={props.takesCount}
          onView={(viewId) => {
            if (viewId === "project") props.onBackToProject();
            else if (viewId === "takes") props.onTakes();
            else if (viewId === "cast") props.onCast();
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
