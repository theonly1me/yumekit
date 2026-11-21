import type { Output } from "../engine/snapshot.js";
import { outputLabel } from "../timeline/timelineFacts.js";
import type { Theme } from "./useTheme.js";

export function TopBar(props: {
  projectName: string;
  outputs: Output[];
  outputId: string;
  theme: Theme;
  onOutput: (outputId: string) => void;
  onTheme: (theme: Theme) => void;
  onRender: () => void;
}) {
  const otherTheme = props.theme === "dark" ? "light" : "dark";
  return (
    <header className="editor-bar">
      <div className="identity">
        <p className="wordmark">yumekit</p>
        <p className="project-name">{props.projectName}</p>
      </div>
      <div className="switch" role="group" aria-label="Output">
        {props.outputs.map((output) => (
          <button
            key={output.id}
            type="button"
            aria-pressed={output.id === props.outputId}
            onClick={() => {
              props.onOutput(output.id);
            }}
          >
            {outputLabel(output)}
          </button>
        ))}
      </div>
      <div className="bar-end">
        <button
          type="button"
          className="tab"
          onClick={() => {
            props.onTheme(otherTheme);
          }}
        >
          Use the {otherTheme} theme
        </button>
        <button type="button" className="primary" onClick={props.onRender}>
          Render
        </button>
      </div>
    </header>
  );
}
